import express from 'express'
import type { Request, RequestHandler } from 'express'
import createError from 'http-errors'
import { redisJsonSet } from '../utils/index.js'
import { validateId, generateIdString } from '../utils/helpers.js'
import type {
  IAuthenticateRequest,
  IAuthenticateTypedRequest
} from '../utils/interfaces.js'
import authenticate from '../middlewares/authenticate.js'
import validateBody from '../middlewares/validateBody.js'
import validationSchemas, { UserRole } from '../utils/validationSchemas.js'
import redis from '../redis.js'
import config from '../config.js'
import {
  anonymRateLimiter,
  userRateLimiter
} from '../middlewares/rateLimiter.js'
import type { operations } from '../schemas/schema.d.ts'
import { Event } from '../models/Event.js'
import { User } from '../models/User.js'
import { Ticket } from '../models/Ticket.js'
import { Subcategory } from '../models/Subcategory.js'
import { City } from '../models/City.js'
import { Upload } from '../models/Upload.js'
import { Artist } from '../models/Artist.js'
import { EventHasUpload } from '../models/EventHasUpload.js'
import { EventHasArtist } from '../models/EventHasArtist.js'
import { Sequelize, BelongsTo, HasMany, Op, QueryTypes } from 'sequelize'
import type { FindAttributeOptions, Order } from 'sequelize'
import sequelize from '../sequelize.js'
import type { RedisJSON } from '@redis/json/dist/commands/index.js'

const router = express.Router()

router.get('/', async function (
  req: Request<
    any,
    any,
    any,
    NonNullable<operations['ListEvents']['parameters']['query']>
  >,
  res
) {
  const { search, sort } = req.query
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

  const currentDate = new Date()
  const where: any = [
    {
      start: {
        [Op.gte]: currentDate
      }
    },
    {
      publish: {
        [Op.lte]: currentDate
      }
    },
    {
      contract_address: {
        [Op.not]: null
      }
    },
    {
      draft: 0
    }
  ]
  const replacements: { search?: string; idsCities?: number[] } = {}

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
    const idsCities = (await sequelize.query(
      `
        SELECT
          get_cities_in_area(:idCity, 10000) AS idsCities
        FROM
          DUAL;
      `,
      {
        replacements: { idCity },
        type: QueryTypes.SELECT
      }
    )) as any
    where.push({
      id_city: {
        [Op.in]: idsCities[0].idsCities
          .split(',')
          .map((idCity: string) => Number(idCity))
      }
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

  const order: Order = []

  if (sort === 'LOWEST_PRICE') {
    order.push(['ticketPrice', 'ASC'])
  } else if (sort === 'HIGHEST_PRICE') {
    order.push(['ticketPrice', 'DESC'])
  } else if (sort === 'MOST_LIKES') {
    order.push(['likes', 'DESC'])
  } else if (sort === 'STARTING_SOON') {
    order.push(['start', 'ASC'])
  } else {
    order.push(['created', 'DESC'])
  }

  order.push(['idEvent', 'DESC'])

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
    order,
    group: ['Event.id_event'],
    limit: config.pagination,
    offset: config.pagination * (page - 1),
    subQuery: false
  })

  const eventsHaveUploads =
    events.length > 0
      ? await EventHasUpload.findAll({
          include: [
            {
              association: 'idUploadUpload',
              attributes: ['idUpload', 'url']
            }
          ],
          attributes: ['idEvent'],
          where: {
            idEvent: {
              [Op.in]: events.map(({ idEvent }) => idEvent)
            }
          },
          order: [['idUploadUpload', 'idUpload', 'ASC']]
        })
      : null

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
        ticketPrice,
        ticketCount,
        dataValues: { purchasedTicketCount },
        location,
        start,
        draft,
        likes,
        transferable,
        created
      }) => ({
        idEvent,
        creatorIdUser,
        creatorUsername: creator.username,
        idSubcategory,
        subcategoryName: subcategory.name,
        idCity,
        cityName: city.name,
        name,
        ticketPrice: Math.trunc(ticketPrice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        remainingTicketCount: ticketCount - purchasedTicketCount!,
        location,
        start,
        draft,
        likes,
        transferable,
        created,
        image:
          eventsHaveUploads?.find(
            (eventHasUpload) => eventHasUpload.idEvent === idEvent
          )?.idUploadUpload.url ?? null
      })
    )
  })
} as RequestHandler)

type CreateEvent = NonNullable<
  operations['CreateEvent']['requestBody']
>['content']['application/json']

router.post(
  '/',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  userRateLimiter,
  validateBody<CreateEvent>(validationSchemas.createEvent),
  async function (req: IAuthenticateTypedRequest<CreateEvent>, res, next) {
    const {
      idSubcategory,
      cityName,
      statuteIdUpload,
      nftImageIdUpload,
      name,
      tags,
      description,
      video,
      ticketPrice,
      ticketCount,
      maxTicketsPerUser,
      location,
      street,
      postalCode,
      start,
      publish,
      draft,
      transferable,
      images,
      artists
    } = req.body
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!

    const currentDate = new Date()
    const startDate = new Date(start)

    if (startDate <= currentDate) {
      next(
        createError(400, 'Data rozpoczęcia wydarzenia musi być w przyszłości')
      )
      return
    }

    const subcategory = await Subcategory.findByPk(idSubcategory)

    if (subcategory === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    let city = await City.findOne({
      where: {
        name: cityName
      }
    })

    if (city === null) {
      let location

      if (!config.test) {
        const result = await fetch(
          `${config.googleGeocodingApi.url}?address=${cityName}&components=country:PL&key=${config.googleGeocodingApi.key}`
        )

        const text = await result.text()

        if (!result?.ok) {
          throw new Error(text)
        }

        const json = JSON.parse(text)

        if (
          ['OVER_DAILY_LIMIT', 'OVER_QUERY_LIMIT'].includes(
            json.status as string
          )
        ) {
          next(createError(500, 'Wystąpił wewnętrzny błąd serwera'))
          return
        }

        if (json.status !== 'OK' || json.results[0]?.types[0] !== 'locality') {
          next(createError(400, 'Podane miasto nie istnieje'))
          return
        }

        location = json.results[0].geometry.location
      } else {
        location = {
          lng: 0.0,
          lat: 0.0
        }
      }

      city = await City.create({
        name: cityName,
        coordinates: Sequelize.fn(
          'ST_GeomFromText',
          `POINT(${location.lng} ${location.lat})`,
          4326
        )
      })
    }

    const idCity = city.idCity

    if (statuteIdUpload !== undefined && statuteIdUpload !== null) {
      const upload = await Upload.findByPk(statuteIdUpload)

      if (upload === null || upload.type !== 'FILE') {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }
    }

    if (nftImageIdUpload !== undefined && nftImageIdUpload !== null) {
      const upload = await Upload.findByPk(nftImageIdUpload)

      if (upload === null || upload.type !== 'IMAGE') {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }
    }

    const foundEvent = await Event.findOne({
      where: {
        name
      }
    })

    if (foundEvent?.name === name) {
      next(createError(400, 'Podana nazwa wydarzenia jest już wykorzystana'))
      return
    }

    const selectedImages = await Upload.findAll({
      attributes: ['idUpload'],
      where: {
        idUpload: {
          [Op.in]: images.length > 0 ? images : ['']
        },
        type: 'IMAGE'
      }
    })

    const selectedArtists = await Artist.findAll({
      attributes: ['idArtist'],
      where: {
        idArtist: {
          [Op.in]: artists.length > 0 ? artists : ['']
        }
      }
    })

    let createdEvent: Event
    const transaction = await sequelize.transaction()

    try {
      createdEvent = await Event.create(
        {
          creatorIdUser: user.idUser,
          idSubcategory,
          idCity,
          // @ts-expect-error Types inconsistency
          statuteIdUpload: statuteIdUpload ?? null,
          // @ts-expect-error Types inconsistency
          nftImageIdUpload: nftImageIdUpload ?? null,
          name,
          tags,
          description,
          // @ts-expect-error Types inconsistency
          video: video ?? null,
          ticketPrice: Number(ticketPrice),
          ticketCount,
          maxTicketsPerUser,
          location,
          street,
          postalCode,
          start: new Date(start),
          publish: new Date(publish),
          draft: draft ? 1 : 0,
          transferable: transferable ? 1 : 0
        },
        {
          transaction
        }
      )

      if (selectedImages.length > 0) {
        await EventHasUpload.bulkCreate(
          selectedImages.map((upload) => ({
            idEvent: createdEvent.idEvent,
            idUpload: upload.idUpload
          })),
          {
            transaction
          }
        )
      }

      if (selectedArtists.length > 0) {
        await EventHasArtist.bulkCreate(
          selectedArtists.map((artist) => ({
            idEvent: createdEvent.idEvent,
            idArtist: artist.idArtist
          })),
          { transaction }
        )
      }

      await transaction.commit()
    } catch (error: any) {
      await transaction.rollback()

      throw error
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const event = (await getEvent(createdEvent.idEvent, true, user.idUser))!

    res.status(201).json(event)
  } as RequestHandler
)

router.get(
  '/to-approve',
  authenticate([UserRole.ADMINISTRATOR]),
  async function (
    req: Request<
      any,
      any,
      any,
      NonNullable<operations['ListReviewsToApprove']['parameters']['query']>
    >,
    res
  ) {
    let { page } = req.query
    if (page !== undefined) {
      page = parseInt(page as unknown as string)
    } else {
      page = 1
    }

    const currentDate = new Date()
    const where: any = {
      start: {
        [Op.gte]: currentDate
      },
      contractAddress: {
        [Op.is]: null
      },
      draft: 0
    }

    const count = await Event.count({
      where
    })

    let pages = Math.ceil(count / config.pagination)
    if (pages === 0) {
      pages = 1
    }

    if (!(page >= 1 && page <= pages)) {
      page = 1
    }

    const eventsToApprove = await Event.findAll({
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
        'ticketPrice',
        'ticketCount',
        'location',
        'start',
        'likes',
        'transferable',
        'created',
        [
          Sequelize.fn('COUNT', Sequelize.col('Tickets.id_ticket')),
          'purchasedTicketCount'
        ]
      ],
      where,
      order: [['created', 'ASC']],
      group: ['Event.id_event'],
      limit: config.pagination,
      offset: config.pagination * (page - 1),
      subQuery: false
    })

    const eventsHaveUploads =
      eventsToApprove.length > 0
        ? await EventHasUpload.findAll({
            include: [
              {
                association: 'idUploadUpload',
                attributes: ['idUpload', 'url']
              }
            ],
            attributes: ['idEvent'],
            where: {
              idEvent: {
                [Op.in]: eventsToApprove.map(({ idEvent }) => idEvent)
              }
            },
            order: [['idUploadUpload', 'idUpload', 'ASC']]
          })
        : null

    const events = []

    for (const eventToApprove of eventsToApprove) {
      const {
        idEvent,
        creatorIdUser,
        creatorIdUserUser: creator,
        idSubcategory,
        idSubcategorySubcategory: subcategory,
        idCity,
        idCityCity: city,
        name,
        ticketPrice,
        ticketCount,
        dataValues: { purchasedTicketCount },
        location,
        start,
        likes,
        transferable,
        created
      } = eventToApprove

      const key = `Event::${idEvent}`
      const cachedEvent = (await redis.json.get(key)) as unknown as Event

      events.push({
        idEvent,
        creatorIdUser,
        creatorUsername: creator.username,
        idSubcategory,
        subcategoryName: subcategory.name,
        idCity,
        cityName: city.name,
        name,
        ticketPrice: Math.trunc(ticketPrice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        remainingTicketCount: ticketCount - purchasedTicketCount!,
        location,
        start,
        likes,
        transferable,
        created,
        image:
          eventsHaveUploads?.find(
            (eventHasUpload) => eventHasUpload.idEvent === idEvent
          )?.idUploadUpload.url ?? null,
        deployed: cachedEvent?.contractAddress != null
      })
    }

    res.json({
      count,
      pages,
      currentPage: page,
      results: events
    })
  } as RequestHandler
)

router.get('/:idEvent', authenticate(null, false), async function (
  req: IAuthenticateRequest,
  res,
  next
) {
  const user = req.user
  const idEvent = Number(req.params.idEvent)

  if (!validateId(idEvent)) {
    next(createError(404, 'Nie znaleziono żądanego zasobu'))
    return
  }

  let event
  if (user !== undefined) {
    if (user?.role === UserRole.EVENTS_ORGANIZER) {
      event = await getEvent(idEvent, true, user.idUser)
    } else {
      event = await getEvent(idEvent, false, user.idUser)
    }
  } else {
    event = await getEvent(idEvent)
  }

  if (event === null) {
    next(createError(404, 'Nie znaleziono żądanego zasobu'))
    return
  }

  res.json(event)
} as RequestHandler)

type UpdateEvent = NonNullable<
  operations['UpdateEvent']['requestBody']
>['content']['application/json']

router.patch(
  '/:idEvent',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  validateBody<UpdateEvent>(validationSchemas.updateEvent),
  async function (req: IAuthenticateTypedRequest<UpdateEvent>, res, next) {
    const {
      idSubcategory,
      cityName,
      statuteIdUpload,
      nftImageIdUpload,
      tags,
      description,
      video,
      location,
      street,
      postalCode,
      start,
      draft,
      images,
      artists
    } = req.body
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const idEvent = Number(req.params.idEvent)

    if (!validateId(idEvent)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const foundEvent = await Event.findOne({
      where: {
        idEvent,
        creatorIdUser: user.idUser
      }
    })

    if (foundEvent === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const currentDate = new Date()
    const startDate = new Date(start)

    if (startDate <= currentDate) {
      next(
        createError(400, 'Data rozpoczęcia wydarzenia musi być w przyszłości')
      )
      return
    }

    const subcategory = await Subcategory.findByPk(idSubcategory)

    if (subcategory === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    let city = await City.findOne({
      where: {
        name: cityName
      }
    })

    if (city === null) {
      let location

      if (!config.test) {
        const result = await fetch(
          `${config.googleGeocodingApi.url}?address=${cityName}&components=country:PL&key=${config.googleGeocodingApi.key}`
        )

        const text = await result.text()

        if (!result?.ok) {
          throw new Error(text)
        }

        const json = JSON.parse(text)

        if (
          ['OVER_DAILY_LIMIT', 'OVER_QUERY_LIMIT'].includes(
            json.status as string
          )
        ) {
          next(createError(500, 'Wystąpił wewnętrzny błąd serwera'))
          return
        }

        if (json.status !== 'OK' || json.results[0]?.types[0] !== 'locality') {
          next(createError(400, 'Podane miasto nie istnieje'))
          return
        }

        location = json.results[0].geometry.location
      } else {
        location = {
          lng: 0.0,
          lat: 0.0
        }
      }

      city = await City.create({
        name: cityName,
        coordinates: Sequelize.fn(
          'ST_GeomFromText',
          `POINT(${location.lng} ${location.lat})`,
          4326
        )
      })
    }

    const idCity = city.idCity

    if (statuteIdUpload !== undefined && statuteIdUpload !== null) {
      const upload = await Upload.findByPk(statuteIdUpload)

      if (upload === null || upload.type !== 'FILE') {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }
    }

    if (nftImageIdUpload !== undefined && nftImageIdUpload !== null) {
      const upload = await Upload.findByPk(nftImageIdUpload)

      if (upload === null || upload.type !== 'IMAGE') {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }
    }

    const selectedImages = await Upload.findAll({
      attributes: ['idUpload'],
      where: {
        idUpload: {
          [Op.in]: images.length > 0 ? images : ['']
        },
        type: 'IMAGE'
      }
    })

    const selectedArtists = await Artist.findAll({
      attributes: ['idArtist'],
      where: {
        idArtist: {
          [Op.in]: artists.length > 0 ? artists : ['']
        }
      }
    })

    const transaction = await sequelize.transaction()

    try {
      const updateEvent = await Event.findByPk(idEvent)

      if (updateEvent === null) {
        next(createError(400, 'Nieprawidłowa treść żądania'))

        await transaction.rollback()
        return
      }

      updateEvent.idSubcategory = idSubcategory
      updateEvent.idCity = idCity
      // @ts-expect-error Types inconsistency
      updateEvent.statuteIdUpload = statuteIdUpload ?? null
      // @ts-expect-error Types inconsistency
      updateEvent.nftImageIdUpload = nftImageIdUpload ?? null
      updateEvent.tags = tags
      updateEvent.description = description
      // @ts-expect-error Types inconsistency
      updateEvent.video = video ?? null
      updateEvent.location = location
      updateEvent.street = street
      updateEvent.postalCode = postalCode
      updateEvent.start = new Date(start)
      updateEvent.draft = draft ? 1 : 0

      await updateEvent.edit()

      await EventHasUpload.destroy({
        where: {
          idEvent
        },
        transaction
      })

      if (selectedImages.length > 0) {
        await EventHasUpload.bulkCreate(
          selectedImages.map((upload) => ({
            idEvent,
            idUpload: upload.idUpload
          })),
          { transaction }
        )
      }

      await EventHasArtist.destroy({
        where: {
          idEvent
        },
        transaction
      })

      if (selectedArtists.length > 0) {
        await EventHasArtist.bulkCreate(
          selectedArtists.map((artist) => ({
            idEvent,
            idArtist: artist.idArtist
          })),
          { transaction }
        )
      }

      await transaction.commit()
    } catch (error: any) {
      await transaction.rollback()

      throw error
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const event = (await getEvent(idEvent, true, user.idUser))!

    const key = `Event::${idEvent}`
    await redis.json.del(key)

    res.json(event)
  } as RequestHandler
)

router.delete(
  '/:idEvent',
  authenticate([UserRole.ADMINISTRATOR]),
  async function (req, res, next) {
    const idEvent = Number(req.params.idEvent)

    if (!validateId(idEvent)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const result = await Event.destroy({
      where: {
        idEvent
      }
    })

    if (result === 0) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const key = `Event::${idEvent}`
    await redis.json.del(key)

    res.sendStatus(204)
  } as RequestHandler
)

router.post(
  '/:idEvent/approve',
  authenticate([UserRole.ADMINISTRATOR]),
  async function (req, res, next) {
    const idEvent = Number(req.params.idEvent)

    if (!validateId(idEvent)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const event = await Event.findByPk(idEvent, {
      include: {
        association: 'creatorIdUserUser',
        attributes: ['publicAddress']
      }
    })

    if (event === null || event.contractAddress != null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const key = `Event::${idEvent}`
    const cachedEvent = (await redis.json.get(key)) as unknown as Event

    if (cachedEvent?.contractAddress != null) {
      next(createError(400, 'Wydarzenie jest zatwierdzane'))
      return
    }

    await redis.json.del(key)

    try {
      await event.approve()
    } catch (error: any) {
      if (error.message === 'Unable to create event smart contract') {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }

      throw error
    }

    res.sendStatus(204)
  } as RequestHandler
)

router.post('/:idEvent/like', anonymRateLimiter, async function (
  req,
  res,
  next
) {
  const idEvent = Number(req.params.idEvent)

  if (!validateId(idEvent)) {
    next(createError(400, 'Nieprawidłowa treść żądania'))
    return
  }

  const event = await Event.findByPk(idEvent)

  if (event === null) {
    next(createError(400, 'Nieprawidłowa treść żądania'))
    return
  }

  await event.like()

  res.sendStatus(204)
} as RequestHandler)

type PassiveTicketVerification = NonNullable<
  operations['PassiveTicketVerification']['requestBody']
>['content']['application/json']

router.post(
  '/:idEvent/tickets/verify',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  validateBody<PassiveTicketVerification>(
    validationSchemas.passiveTicketVerification
  ),
  async function (
    req: IAuthenticateTypedRequest<PassiveTicketVerification>,
    res,
    next
  ) {
    const { publicAddress } = req.body
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const idEvent = Number(req.params.idEvent)

    if (!validateId(idEvent)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const event = await Event.findOne({
      where: {
        idEvent,
        creatorIdUser: user.idUser
      }
    })

    if (event?.contractAddress == null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    let result
    try {
      result = await event.verifyTicketPossession(publicAddress, false)
    } catch (error: any) {
      const message = error.message as string
      if (
        [
          'Event has no smart contract associated',
          'Unable to get user ticket details',
          'Unable to use ticket'
        ].includes(message)
      ) {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }

      throw error
    }

    res.type('json').send(result)
  } as RequestHandler
)

type ActiveTicketVerification = NonNullable<
  operations['ActiveTicketVerification']['requestBody']
>['content']['application/json']

router.post(
  '/:idEvent/tickets/subscribe',
  authenticate([UserRole.EVENTS_ORGANIZER]),
  validateBody<ActiveTicketVerification>(
    validationSchemas.activeTicketVerification
  ),
  async function (
    req: IAuthenticateTypedRequest<ActiveTicketVerification>,
    res,
    next
  ) {
    const { uuid } = req.body
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const idEvent = Number(req.params.idEvent)

    if (!validateId(idEvent)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const event = await Event.findOne({
      where: {
        idEvent,
        creatorIdUser: user.idUser
      }
    })

    if (event?.contractAddress == null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    let result
    try {
      result = await event.subscribeTicketApproval(uuid)
    } catch (error: any) {
      const message = error.message as string
      if (
        ['Timeout has passed', 'Consumer cancelled by server'].includes(message)
      ) {
        res.sendStatus(204)
        return
      }

      if (
        [
          'Event has no smart contract associated',
          'Unable to get user ticket details',
          'Unable to use ticket'
        ].includes(message)
      ) {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }

      throw error
    }

    res.type('json').send(result)
  } as RequestHandler
)

router.get('/:idEvent/tickets/:tokenId', async function (req, res, next) {
  const idEvent = Number(req.params.idEvent)
  const tokenId = Number(req.params.tokenId)

  if (!validateId(idEvent) || !validateId(tokenId)) {
    next(createError(404, 'Nie znaleziono żądanego zasobu'))
    return
  }

  const key = `GetToken::${idEvent}::${tokenId}`
  let token = (await redis.json.get(key)) as any

  if (token === null) {
    const ticket = await Ticket.findOne({
      attributes: ['created'],
      include: {
        model: Event,
        association: new BelongsTo(Ticket, Event, {
          foreignKey: 'ticketAddress',
          targetKey: 'contractAddress',
          constraints: false
        }),
        include: [
          {
            association: 'nftImageIdUploadUpload',
            attributes: ['url']
          }
        ],
        attributes: ['idEvent', 'name', 'description'],
        where: {
          idEvent
        }
      },
      where: {
        tokenId
      }
    })

    if (ticket === null) {
      next(createError(404, 'Nie znaleziono żądanego zasobu'))
      return
    }

    const { Event: event, created } = ticket

    token = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      name: event!.name,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      description: event!.description,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      external_url: `${config.frontendBaseUrl}/events/${generateIdString(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        event!.name,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        event!.idEvent
      )}`,
      attributes: [
        {
          display_type: 'date',
          trait_type: 'Created',
          value: created.getTime()
        }
      ]
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const upload = event!.nftImageIdUploadUpload
    if (upload !== null) {
      token.image = upload.url
    }

    await redisJsonSet(key, token as RedisJSON)
  }

  res.json(token)
} as RequestHandler)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function getEvent(
  idEvent: number,
  isEventOrganizer: boolean = false,
  idUser?: number
) {
  const include: any[] = [
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
      association: 'nftImageIdUploadUpload',
      attributes: ['url']
    },
    {
      association: 'statuteIdUploadUpload',
      attributes: ['url']
    },
    {
      model: Ticket,
      association: new HasMany(Event, Ticket, {
        sourceKey: 'contractAddress',
        foreignKey: 'ticketAddress',
        constraints: false
      }),
      attributes: []
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
      association: 'eventHasArtists',
      include: [
        {
          association: 'idArtistArtist',
          attributes: ['idArtist', 'name'],
          include: {
            association: 'pictureIdUploadUpload',
            attributes: ['url']
          }
        }
      ],
      order: [['idArtistArtist', 'name', 'ASC']]
    }
  ]

  const attributes: FindAttributeOptions = [
    'idEvent',
    'creatorIdUser',
    'idSubcategory',
    'idCity',
    'nftImageIdUpload',
    'statuteIdUpload',
    'name',
    'description',
    'contractAddress',
    'video',
    'ticketPrice',
    'ticketCount',
    'maxTicketsPerUser',
    'location',
    'street',
    'postalCode',
    'start',
    'likes',
    'transferable',
    'created',
    [
      Sequelize.fn('COUNT', Sequelize.col('Tickets.id_ticket')),
      'purchasedTicketCount'
    ]
  ]

  if (isEventOrganizer) {
    attributes.push('tags', 'publish', 'draft')
  }

  const key = `Event::${idEvent}`
  const cachedEvent = (await redis.json.get(key)) as unknown as Event

  const currentDate = new Date()
  const where: any = {
    idEvent
  }

  if (!isEventOrganizer) {
    if (cachedEvent !== null) {
      if (new Date(cachedEvent.publish) > currentDate) {
        return null
      }
    } else {
      where.contractAddress = {
        [Op.not]: null
      }
      where.publish = {
        [Op.lte]: currentDate
      }
    }

    where.start = {
      [Op.gte]: currentDate
    }
    where.draft = 0
  } else {
    where[Op.or] = [
      { creatorIdUser: idUser },
      {
        contractAddress: {
          [Op.not]: null
        },
        publish: {
          [Op.lte]: currentDate
        },
        start: {
          [Op.gte]: currentDate
        },
        draft: 0
      }
    ]
  }

  const event = await Event.findOne({
    attributes,
    include,
    where,
    group: [
      'Event.id_event',
      'eventHasUploads.id_upload',
      'eventHasArtists.id_artist'
    ]
  })

  if (event === null) {
    return null
  }

  let userTicketCount = 0
  if (idUser !== undefined) {
    userTicketCount = await Ticket.count({
      include: [
        {
          model: Event,
          association: new BelongsTo(Ticket, Event, {
            foreignKey: 'ticketAddress',
            targetKey: 'contractAddress',
            constraints: false
          }),
          where: {
            idEvent
          }
        },
        {
          model: User,
          association: new BelongsTo(Ticket, User, {
            foreignKey: 'userAddress',
            targetKey: 'publicAddress',
            constraints: false
          }),
          where: {
            idUser
          }
        }
      ]
    })
  }

  const data: any = {
    idEvent: event.idEvent,
    creatorIdUser: event.creatorIdUser,
    creatorUsername: event.creatorIdUserUser.username,
    idSubcategory: event.idSubcategory,
    subcategoryName: event.idSubcategorySubcategory.name,
    idCity: event.idCity,
    cityName: event.idCityCity.name,
    nftImageIdUpload: event.nftImageIdUpload,
    nftImageUrl: event.nftImageIdUploadUpload?.url ?? null,
    statuteIdUpload: event.statuteIdUpload,
    statuteUrl: event.statuteIdUploadUpload?.url ?? null,
    name: event.name,
    description: event.description,
    contractAddress:
      cachedEvent?.contractAddress == null
        ? event.contractAddress
        : cachedEvent.contractAddress,
    video: event.video,
    ticketPrice:
      cachedEvent?.ticketPrice === undefined
        ? Math.trunc(event.ticketPrice)
        : Math.trunc(cachedEvent.ticketPrice),
    remainingTicketCount:
      (cachedEvent?.ticketCount === undefined
        ? event.ticketCount
        : cachedEvent.ticketCount) -
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      event.dataValues.purchasedTicketCount!,
    remainingTicketsPerUser:
      (cachedEvent?.maxTicketsPerUser === undefined
        ? event.maxTicketsPerUser
        : cachedEvent.maxTicketsPerUser) - userTicketCount,
    location: event.location,
    street: event.street,
    postalCode: event.postalCode,
    start: event.start,
    likes: event.likes,
    transferable:
      cachedEvent?.transferable === undefined
        ? event.transferable
        : cachedEvent.transferable,
    created: event.created,
    images: event.eventHasUploads.map(
      ({ idUploadUpload: { idUpload, url } }) => ({
        idUpload,
        url
      })
    ),
    artists: event.eventHasArtists.map(
      ({
        idArtistArtist: {
          idArtist,
          name,
          pictureIdUploadUpload: { url: pictureUrl }
        }
      }) => ({
        idArtist,
        pictureUrl,
        name
      })
    )
  }

  if (isEventOrganizer && event.creatorIdUser === idUser) {
    data.ticketCount =
      cachedEvent?.ticketCount === undefined
        ? event.ticketCount
        : cachedEvent.ticketCount
    data.maxTicketsPerUser =
      cachedEvent?.maxTicketsPerUser === undefined
        ? event.maxTicketsPerUser
        : cachedEvent.maxTicketsPerUser
    data.tags = event.tags
    data.publish =
      cachedEvent?.publish === undefined ? event.publish : cachedEvent.publish
    data.draft = event.draft
  }

  return data
}

export default router
