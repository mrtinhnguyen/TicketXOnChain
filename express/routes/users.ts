import express from 'express'
import type { Request, RequestHandler } from 'express'
import createError from 'http-errors'
import { TokenType, redisJsonSet } from '../utils/index.js'
import { validateId } from '../utils/helpers.js'
import type {
  ITypedRequest,
  IAuthenticateRequest,
  IAuthenticateTypedRequest,
  IAuthenticateQueryRequest,
  ISignUpJwtPayload,
  IActivationJwtPayload,
  IRefreshJwtPayload
} from '../utils/interfaces.js'
import jwt from 'jsonwebtoken'
import type { Secret } from 'jsonwebtoken'
import { SiweMessage } from 'siwe'
import authenticate from '../middlewares/authenticate.js'
import validateBody from '../middlewares/validateBody.js'
import validationSchemas, { UserRole } from '../utils/validationSchemas.js'
import redis from '../redis.js'
import config from '../config.js'
import type { operations } from '../schemas/schema.d.ts'
import { Sequelize, HasMany, Op, BelongsTo, QueryTypes } from 'sequelize'
import { anonymRateLimiter } from '../middlewares/rateLimiter.js'
import { User } from '../models/User.js'
import { Ticket } from '../models/Ticket.js'
import { Event } from '../models/Event.js'
import { UserFollowArtist } from '../models/UserFollowArtist.js'
import sequelize from '../sequelize.js'
import type { RedisJSON } from '@redis/json/dist/commands/index.js'

const router = express.Router()

router.get('/', authenticate([UserRole.ADMINISTRATOR]), async function (
  req: Request<
    any,
    any,
    any,
    NonNullable<operations['ListUsers']['parameters']['query']>
  >,
  res
) {
  const { search } = req.query
  let { page } = req.query
  if (page !== undefined) {
    page = parseInt(page as unknown as string)
  } else {
    page = 1
  }

  const where: any = {}

  if (search !== undefined) {
    where[Op.or] = {
      email: {
        [Op.like]: `%${search}%`
      },
      username: {
        [Op.like]: `%${search}%`
      }
    }
  }

  const count = await User.count({
    where
  })

  let pages = Math.ceil(count / config.pagination)
  if (pages === 0) {
    pages = 1
  }

  if (!(page >= 1 && page <= pages)) {
    page = 1
  }

  const users = await User.findAll({
    attributes: [
      'idUser',
      'publicAddress',
      'email',
      'username',
      'role',
      'active',
      'created'
    ],
    where,
    order: [
      ['created', 'DESC'],
      ['username', 'ASC']
    ],
    limit: config.pagination,
    offset: config.pagination * (page - 1)
  })

  res.json({
    count,
    pages,
    currentPage: page,
    results: users
  })
} as RequestHandler)

type GenerateNonce = NonNullable<
  operations['GenerateNonce']['requestBody']
>['content']['application/json']

router.post(
  '/nonce',
  anonymRateLimiter,
  validateBody<GenerateNonce>(validationSchemas.generateNonce),
  async function (req: ITypedRequest<GenerateNonce>, res, next) {
    const secret: Secret = config.jwt.secret as Secret
    const { publicAddress } = req.body

    const user = await User.findOne({
      where: {
        publicAddress
      }
    })

    if (user === null) {
      const signUpPayload: ISignUpJwtPayload = {
        publicAddress,
        tokenType: TokenType.SIGN_UP
      }

      const signUpToken = jwt.sign(signUpPayload, secret, {
        expiresIn: config.jwt.signUpTokenExpirationTime
      })

      res.status(404).json({
        signUpToken
      })
      return
    }

    let nonce
    try {
      nonce = await user.generateNonce()
    } catch (error: any) {
      if (error.message === 'User is not active') {
        next(
          createError(
            400,
            'Konto jest nieaktywne. Sprawdź skrzynkę email w poszukiwaniu wiadomości aktywacyjnej'
          )
        )
        return
      }

      throw error
    }

    res.json({
      nonce
    })
  } as RequestHandler
)

type SignUp = NonNullable<
  operations['SignUp']['requestBody']
>['content']['application/json']

router.post(
  '/sign-up',
  anonymRateLimiter,
  validateBody<SignUp>(validationSchemas.signUp),
  async function (req: ITypedRequest<SignUp>, res, next) {
    const { signUpToken, email, username, name, surname, birthdate } = req.body

    const currentDate = new Date()
    const birthDate = new Date(birthdate)

    if (birthDate > currentDate) {
      next(createError(400, 'Data urodzin musi być w przeszłości'))
      return
    }

    const user = User.build({
      publicAddress: '',
      nonce: '',
      email,
      username,
      name,
      surname,
      birthdate
    })

    try {
      await User.createUser(signUpToken, user)
    } catch (error: any) {
      const { message } = error
      if (message === 'Invalid registration token') {
        next(createError(400, 'Nieprawidłowy token rejestracyjny'))
        return
      } else if (message === 'Email address already in use') {
        next(createError(400, 'Adres email jest już wykorzystany'))
        return
      } else if (message === 'Username already in use') {
        next(createError(400, 'Podana nazwa użytkownika jest już wykorzystana'))
        return
      } else if (message === 'User account already exists') {
        next(createError(400, 'Konto użytkownika już istnieje'))
        return
      }

      throw error
    }

    res.sendStatus(204)
  } as RequestHandler
)

type ActivateUser = NonNullable<
  operations['ActivateUser']['requestBody']
>['content']['application/json']

router.post(
  '/activate',
  anonymRateLimiter,
  validateBody<ActivateUser>(validationSchemas.activateUser),
  async function (req: ITypedRequest<ActivateUser>, res, next) {
    const secret: Secret = config.jwt.secret as Secret
    const { activationToken } = req.body

    let activationPayload
    try {
      activationPayload = jwt.verify(
        activationToken,
        secret
      ) as IActivationJwtPayload
    } catch (error: any) {
      next(createError(400, 'Nieprawidłowy token aktywacyjny'))
      return
    }

    const { idUser, tokenType } = activationPayload

    if (tokenType !== TokenType.ACTIVATION) {
      next(createError(400, 'Nieprawidłowy token aktywacyjny'))
      return
    }

    const user = await User.findByPk(idUser)

    if (user === null || user.active === 1) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    await user.activate()

    res.sendStatus(204)
  } as RequestHandler
)

type SignIn = NonNullable<
  operations['SignIn']['requestBody']
>['content']['application/json']

router.post(
  '/verify',
  anonymRateLimiter,
  validateBody<SignIn>(validationSchemas.signIn),
  async function (req: ITypedRequest<SignIn>, res, next) {
    const { message, signature } = req.body

    let siweMessage
    try {
      siweMessage = new SiweMessage(message)
    } catch (error: any) {
      next(createError(400, 'Nieprawidłowa wiadomość autentykacyjna'))
      return
    }

    const user = await User.findOne({
      where: {
        publicAddress: siweMessage.address
      }
    })

    if (user === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    let tokensPair
    try {
      tokensPair = await user.signIn(message, signature)
    } catch (error: any) {
      if (error.message === 'Invalid authentication message') {
        next(createError(400, 'Nieprawidłowa wiadomość autentykacyjna'))
        return
      }

      throw error
    }

    res.type('json').send(tokensPair)
  } as RequestHandler
)

type RefreshTokens = NonNullable<
  operations['RefreshTokens']['requestBody']
>['content']['application/json']

router.post(
  '/refresh',
  anonymRateLimiter,
  validateBody<RefreshTokens>(validationSchemas.refreshTokens),
  async function (req: ITypedRequest<RefreshTokens>, res, next) {
    const secret: Secret = config.jwt.secret as Secret
    const { refreshToken } = req.body

    let refreshPayload
    try {
      refreshPayload = jwt.verify(refreshToken, secret) as IRefreshJwtPayload
    } catch (error: any) {
      next(createError(400, 'Nieprawidłowy token odświeżania'))
      return
    }

    const { user, tokenType } = refreshPayload

    if (tokenType !== TokenType.REFRESH) {
      next(createError(401, 'Nieprawidłowy token odświeżania'))
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundUser = (await User.findByPk(user.idUser))!

    if (foundUser.active === 0) {
      next(createError(400, 'Konto jest nieaktywne'))
      return
    }

    const tokensPair = await foundUser.generateTokensPair()

    res.type('json').send(tokensPair)
  } as RequestHandler
)

router.get('/me', authenticate(), async function (
  req: IAuthenticateRequest,
  res
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user!

  const key = `GetMe::${user.idUser}`
  let foundUser = (await redis.json.get(key)) as unknown as User

  if (foundUser === null) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    foundUser = (await getUser(user.idUser))!

    await redisJsonSet(key, foundUser as unknown as RedisJSON)
  }

  foundUser.role = user.role

  res.json(foundUser)
} as RequestHandler)

type UpdateUser = NonNullable<
  operations['UpdateUser']['requestBody']
>['content']['application/json']

router.patch(
  '/me',
  authenticate(),
  validateBody<UpdateUser>(validationSchemas.updateUser),
  async function (req: IAuthenticateTypedRequest<UpdateUser>, res, next) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const { name, surname, birthdate } = req.body

    const currentDate = new Date()
    const birthDate = new Date(birthdate)

    if (birthDate > currentDate) {
      next(createError(400, 'Data urodzin musi być w przeszłości'))
      return
    }

    await User.update(
      {
        name,
        surname,
        birthdate
      },
      {
        where: {
          idUser: user.idUser
        }
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const foundUser = (await getUser(user.idUser))!

    const key = `GetMe::${user.idUser}`
    await redis.json.del(key)

    res.json(foundUser)
  } as RequestHandler
)

router.get('/me/tickets', authenticate(), async function (
  req: IAuthenticateRequest,
  res
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user!

  let tickets = await Ticket.findAll({
    attributes: [
      'idTicket',
      'tokenId',
      'ticketAddress',
      'userAddress',
      'price',
      'created',
      'used'
    ],
    include: {
      model: Event,
      association: new BelongsTo(Ticket, Event, {
        foreignKey: 'ticketAddress',
        targetKey: 'contractAddress',
        constraints: false
      }),
      attributes: ['idEvent', 'name', 'transferable'],
      required: true
    },
    where: {
      userAddress: user.publicAddress
    },
    order: [['created', 'DESC']]
  })

  const ticketsKey = `Tickets::${user.publicAddress}`
  const cachedTickets = (await redis.json.get(ticketsKey)) as unknown as Record<
    string,
    Ticket
  >

  if (cachedTickets !== null) {
    const contractsAddresses = []
    const ticketsAddressesTokensIds = []
    for (const cachedTicket of Object.values(cachedTickets)) {
      contractsAddresses.push(cachedTicket.ticketAddress)

      if (cachedTicket.created == null) {
        ticketsAddressesTokensIds.push({
          ticketAddress: cachedTicket.ticketAddress,
          tokenId: cachedTicket.tokenId
        })
      } else {
        cachedTicket.created = new Date(cachedTicket.created)
      }
    }

    if (contractsAddresses.length > 0) {
      const events = await Event.findAll({
        attributes: ['idEvent', 'name', 'contractAddress', 'transferable'],
        where: {
          contractAddress: {
            [Op.in]: contractsAddresses
          }
        }
      })

      for (const cachedTicket of Object.values(cachedTickets)) {
        const event = events.find(
          (event) => event.contractAddress === cachedTicket.ticketAddress
        )

        if (event !== undefined) {
          cachedTicket.Event = event
        }
      }
    }

    for (const ticketAddressTokenId of ticketsAddressesTokensIds) {
      const { ticketAddress, tokenId } = ticketAddressTokenId

      const ticket = await Ticket.findOne({
        attributes: ['price', 'created', 'used'],
        where: {
          ticketAddress,
          tokenId
        }
      })

      if (ticket !== null) {
        const cachedTicket = cachedTickets[`${ticketAddress}::${tokenId}`]

        if (cachedTicket !== undefined) {
          cachedTicket.price = ticket.price
          cachedTicket.created = ticket.created
          cachedTicket.used = ticket.used
        }
      }
    }

    tickets = [
      ...tickets,
      ...Object.values(cachedTickets).filter(
        (cachedTicket) =>
          cachedTicket.Event != null && cachedTicket.created != null
      )
    ]
    tickets.sort((a, b) => b.created.getTime() - a.created.getTime())
  }

  for (const ticket of tickets) {
    const ticketKey = `Ticket::${ticket.ticketAddress}::${ticket.tokenId}`
    const cachedTicket = (await redis.json.get(ticketKey)) as unknown as Ticket

    ticket.userAddress =
      cachedTicket?.userAddress === undefined
        ? ticket.userAddress
        : cachedTicket.userAddress
    ticket.used =
      cachedTicket?.used === undefined ? ticket.used : cachedTicket.used
  }

  tickets = tickets.filter(
    (ticket) => ticket.userAddress === user.publicAddress
  )

  res.json(
    tickets.map(
      ({
        idTicket,
        Event: event,
        tokenId,
        ticketAddress,
        price,
        created,
        used
      }) => ({
        idTicket,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        idEvent: event!.idEvent,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eventName: event!.name,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transferable: event!.transferable,
        tokenId,
        ticketAddress,
        ticketPrice: price,
        ticketUsed: used,
        created
      })
    )
  )
} as RequestHandler)

router.get('/me/following', authenticate(), async function (
  req: IAuthenticateRequest,
  res
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user!

  const following = await UserFollowArtist.findAll({
    include: {
      association: 'idArtistArtist',
      attributes: ['idArtist', 'name'],
      include: [
        {
          association: 'pictureIdUploadUpload',
          attributes: ['url']
        }
      ]
    },
    where: {
      idUser: user.idUser
    },
    order: [['idArtistArtist', 'name', 'ASC']]
  })

  res.json(
    following.map(
      ({
        idArtistArtist: { idArtist, name, pictureIdUploadUpload: upload }
      }) => ({
        idArtist,
        pictureUrl: upload.url,
        name
      })
    )
  )
} as RequestHandler)

router.get(
  '/me/events',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  async function (
    req: IAuthenticateQueryRequest<
      NonNullable<operations['ListUserEvents']['parameters']['query']>
    >,
    res
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const { search } = req.query
    let { idSubcategory, idCity, page } = req.query

    if (idSubcategory !== undefined) {
      idSubcategory = Number(idSubcategory)
    }

    if (idCity !== undefined) {
      idCity = Number(idCity)
    }

    if (page !== undefined) {
      page = parseInt(page as unknown as string)
    } else {
      page = 1
    }

    const where: any = [
      {
        creator_id_user: user.idUser
      }
    ]
    const replacements: { search?: string } = {}

    if (search !== undefined && search !== '*') {
      where.push(
        Sequelize.literal(
          'MATCH (Event.name, Event.tags, Event.description) AGAINST (:search IN NATURAL LANGUAGE MODE)'
        )
      )
      replacements.search = search
    }

    if (idSubcategory !== undefined && validateId(idSubcategory)) {
      where.push({
        id_subcategory: idSubcategory
      })
    }

    if (idCity !== undefined && validateId(idCity)) {
      where.push({
        id_city: idCity
      })
    }

    const count = (await Event.count({
      where,
      // @ts-expect-error Types inconsistency
      replacements
    })) as unknown as number

    let pages = Math.ceil(count / config.pagination)
    if (pages === 0) {
      pages = 1
    }

    if (!(page >= 1 && page <= pages)) {
      page = 1
    }

    const events = await Event.findAll({
      include: [
        {
          association: 'creatorIdUserUser',
          attributes: ['username']
        },
        {
          association: 'idSubcategorySubcategory',
          attributes: ['name']
        },
        {
          association: 'idCityCity',
          attributes: ['name']
        },
        {
          association: 'eventHasUploads',
          include: [
            {
              association: 'idUploadUpload',
              attributes: ['idUpload', 'url']
            }
          ],
          order: [['idUploadUpload', 'idUpload', 'ASC']]
        },
        {
          model: Ticket,
          association: new HasMany(Event, Ticket, {
            sourceKey: 'contractAddress',
            foreignKey: 'ticketAddress',
            constraints: false
          }),
          attributes: []
        }
      ],
      attributes: [
        'idEvent',
        'creatorIdUser',
        'idSubcategory',
        'idCity',
        'name',
        'contractAddress',
        'ticketPrice',
        'ticketCount',
        'location',
        'start',
        'draft',
        'likes',
        'transferable',
        'created',
        [
          Sequelize.fn('COUNT', Sequelize.col('Tickets.id_ticket')),
          'purchasedTicketCount'
        ]
      ],
      where,
      replacements,
      order: [
        ['created', 'DESC'],
        ['idEvent', 'DESC']
      ],
      group: ['Event.id_event'],
      limit: config.pagination,
      offset: config.pagination * (page - 1),
      subQuery: false
    })

    res.json({
      count,
      pages,
      currentPage: page,
      results: events.map(
        ({
          idEvent,
          creatorIdUser,
          creatorIdUserUser: creator,
          idSubcategory,
          idSubcategorySubcategory: subcategory,
          idCity,
          idCityCity: city,
          name,
          contractAddress,
          ticketPrice,
          ticketCount,
          dataValues: { purchasedTicketCount },
          location,
          start,
          draft,
          likes,
          transferable,
          created,
          eventHasUploads: uploads
        }) => ({
          idEvent,
          creatorIdUser,
          creatorUsername: creator.username,
          idSubcategory,
          subcategoryName: subcategory.name,
          idCity,
          cityName: city.name,
          name,
          contractAddress,
          ticketPrice,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          remainingTicketCount: ticketCount - purchasedTicketCount!,
          location,
          start,
          draft,
          likes,
          transferable,
          created,
          image: uploads[0]?.idUploadUpload.url ?? null
        })
      )
    })
  } as RequestHandler
)

router.get(
  '/me/events/tickets',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  async function (req: IAuthenticateRequest, res) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!

    const tickets = await sequelize.query(
      `
        SELECT
          id_ticket 'idTicket',
          id_event 'idEvent',
          event_name 'eventName',
          id_user 'idUser',
          email,
          username,
          token_id 'tokenId',
          ticket_address 'ticketAddress',
          ticket_price 'ticketPrice',
          ticket_used 'ticketUsed',
          created
        FROM
          ticket_list
        WHERE
          creator_id_user = :idUser
        ORDER BY
          created DESC
        LIMIT 100;
      `,
      {
        replacements: { idUser: user.idUser },
        type: QueryTypes.SELECT
      }
    )

    res.json(tickets)
  } as RequestHandler
)

router.get(
  '/me/sales-report',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  async function (req: IAuthenticateRequest, res) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!

    let salesReport: string
    const key = `GetSalesReport::${user.idUser}`
    const result = (await redis.json.get(key)) as string

    if (result === null) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const foundUser = (await User.findByPk(user.idUser))!

      salesReport = await foundUser.generateSalesReport()

      await redisJsonSet(key, salesReport)
    } else {
      salesReport = result
    }

    res.type('json').send(salesReport)
  } as RequestHandler
)

type UpdateUserRole = NonNullable<
  operations['UpdateUserRole']['requestBody']
>['content']['application/json']

router.patch(
  '/:idUser',
  authenticate([UserRole.ADMINISTRATOR]),
  validateBody<UpdateUserRole>(validationSchemas.updateUserRole),
  async function (req: ITypedRequest<UpdateUserRole>, res, next) {
    const { role } = req.body
    const idUser = Number(req.params.idUser)

    if (!validateId(idUser)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const foundUser = await User.findByPk(idUser)

    if (foundUser === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    foundUser.role = role

    await foundUser.edit()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = (await getUser(idUser))!

    res.json(user)
  } as RequestHandler
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function getUser(idUser: number) {
  const user = await User.findByPk(idUser, {
    attributes: [
      'idUser',
      'publicAddress',
      'email',
      'username',
      'name',
      'surname',
      'birthdate',
      'role',
      'created'
    ]
  })

  return user
}

export default router
