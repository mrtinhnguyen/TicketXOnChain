import express from 'express'
import type { Request, RequestHandler } from 'express'
import createError from 'http-errors'
import { Artist } from '../models/Artist.js'
import type { operations } from '../schemas/schema.d.ts'
import { Sequelize, HasMany, Op } from 'sequelize'
import { userRateLimiter } from '../middlewares/rateLimiter.js'
import redis from '../redis.js'
import config from '../config.js'
import type {
  ITypedRequest,
  IAuthenticateRequest,
  IAuthenticateTypedRequest
} from '../utils/interfaces.js'
import authenticate from '../middlewares/authenticate.js'
import validateBody from '../middlewares/validateBody.js'
import validationSchemas, { UserRole } from '../utils/validationSchemas.js'
import { Upload } from '../models/Upload.js'
import { Event } from '../models/Event.js'
import { Ticket } from '../models/Ticket.js'
import { redisJsonSet } from '../utils/index.js'
import { validateId } from '../utils/helpers.js'
import type { RedisJSON } from '@redis/json/dist/commands/index.js'

const router = express.Router()

router.get('/', async function (
  req: Request<
    any,
    any,
    any,
    NonNullable<operations['ListArtists']['parameters']['query']>
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
    where.name = {
      [Op.like]: `%${search}%`
    }
  }

  const count = await Artist.count({
    where
  })

  let pages = Math.ceil(count / config.pagination)
  if (pages === 0) {
    pages = 1
  }

  if (!(page >= 1 && page <= pages)) {
    page = 1
  }

  const artists = await Artist.findAll({
    attributes: ['idArtist', 'name'],
    include: {
      association: 'pictureIdUploadUpload',
      attributes: ['url']
    },
    where,
    order: [
      ['name', 'ASC'],
      ['idArtist', 'DESC']
    ],
    limit: config.pagination,
    offset: config.pagination * (page - 1)
  })

  res.json({
    count,
    pages,
    currentPage: page,
    results: artists.map(
      ({ idArtist, pictureIdUploadUpload: picture, name }) => ({
        idArtist,
        pictureUrl: picture.url,
        name
      })
    )
  })
} as RequestHandler)

router.get('/filter', async function (req, res) {
  const artists = await Artist.findAll({
    attributes: ['idArtist', 'name'],
    order: [
      ['name', 'ASC'],
      ['idArtist', 'DESC']
    ]
  })

  res.json(artists)
} as RequestHandler)

type CreateArtist = NonNullable<
  operations['CreateArtist']['requestBody']
>['content']['application/json']

router.post(
  '/',
  authenticate([UserRole.ADMINISTRATOR]),
  validateBody<CreateArtist>(validationSchemas.createArtist),
  async function (req: ITypedRequest<CreateArtist>, res, next) {
    const { pictureIdUpload, name, description } = req.body

    const upload = await Upload.findByPk(pictureIdUpload)

    if (upload === null || upload.type !== 'IMAGE') {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const existingArtist = await Artist.findOne({
      where: {
        name
      }
    })

    if (existingArtist !== null) {
      next(createError(400, 'Podana nazwa artysty jest już wykorzystana'))
      return
    }

    const createdArtist = await Artist.create({
      pictureIdUpload,
      name,
      description
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const artist = (await getArtist(createdArtist.idArtist))!

    res.status(201).json(artist)
  } as RequestHandler
)

router.get('/:idArtist', async function (req, res, next) {
  const idArtist = Number(req.params.idArtist)

  if (!validateId(idArtist)) {
    next(createError(404, 'Nie znaleziono żądanego zasobu'))
    return
  }

  const key = `GetArtist::${idArtist}`
  let artist = (await redis.json.get(key)) as any

  if (artist === null) {
    artist = await getArtist(idArtist)

    if (artist === null) {
      next(createError(404, 'Nie znaleziono żądanego zasobu'))
      return
    }

    await redisJsonSet(key, artist as RedisJSON)
  }

  res.json(artist)
} as RequestHandler)

type UpdateArtist = NonNullable<
  operations['UpdateArtist']['requestBody']
>['content']['application/json']

router.patch(
  '/:idArtist',
  authenticate([UserRole.ADMINISTRATOR]),
  validateBody<UpdateArtist>(validationSchemas.updateArtist),
  async function (req: ITypedRequest<UpdateArtist>, res, next) {
    const { pictureIdUpload, name, description } = req.body
    const idArtist = Number(req.params.idArtist)

    if (!validateId(idArtist)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const upload = await Upload.findByPk(pictureIdUpload)

    if (upload === null || upload.type !== 'IMAGE') {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const foundArtist = await Artist.findByPk(idArtist)

    if (foundArtist === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    foundArtist.pictureIdUpload = pictureIdUpload
    foundArtist.name = name
    foundArtist.description = description

    await foundArtist.edit()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const artist = (await getArtist(idArtist))!

    const key = `GetArtist::${idArtist}`
    await redis.json.del(key)

    res.json(artist)
  } as RequestHandler
)

router.post('/:idArtist/follow', authenticate(), async function (
  req: IAuthenticateRequest,
  res,
  next
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user!
  const idArtist = Number(req.params.idArtist)

  if (!validateId(idArtist)) {
    next(createError(400, 'Nieprawidłowa treść żądania'))
    return
  }

  const artist = await Artist.findByPk(idArtist)

  if (artist === null) {
    next(createError(400, 'Nieprawidłowa treść żądania'))
    return
  }

  try {
    await artist.follow(user)
  } catch (error: any) {
    if (error.message === 'User already follows artist') {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    throw error
  }

  res.sendStatus(204)
} as RequestHandler)

router.delete('/:idArtist/follow', authenticate(), async function (
  req: IAuthenticateRequest,
  res,
  next
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user!
  const idArtist = Number(req.params.idArtist)

  if (!validateId(idArtist)) {
    next(createError(400, 'Nieprawidłowa treść żądania'))
    return
  }

  const artist = await Artist.findByPk(idArtist)

  if (artist === null) {
    next(createError(400, 'Nieprawidłowa treść żądania'))
    return
  }

  try {
    await artist.unfollow(user)
  } catch (error: any) {
    if (error.message === 'User does not follow artist') {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    throw error
  }

  res.sendStatus(204)
} as RequestHandler)

type CreateReview = NonNullable<
  operations['CreateReview']['requestBody']
>['content']['application/json']

router.post(
  '/:idArtist/review',
  authenticate(),
  userRateLimiter,
  validateBody<CreateReview>(validationSchemas.createReview),
  async function (req: IAuthenticateTypedRequest<CreateReview>, res, next) {
    const { title, eventLocation, eventDate, content, rate } = req.body
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const idArtist = Number(req.params.idArtist)

    if (!validateId(idArtist)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const artist = await Artist.findByPk(idArtist)

    if (artist === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const review = await artist.createReview({
      reviewerIdUser: user.idUser,
      title,
      eventLocation,
      eventDate,
      content,
      rate,
      created: new Date()
    })

    res.status(201).json({
      idReview: review.idReview,
      reviewerIdUser: review.reviewerIdUser,
      reviewedIdArtist: review.reviewedIdArtist,
      title: review.title,
      eventLocation: review.eventLocation,
      eventDate: review.eventDate,
      content: review.content,
      rate: review.rate,
      created: review.created
    })
  } as RequestHandler
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function getArtist(idArtist: number) {
  const currentDate = new Date()
  const artist = await Artist.findByPk(idArtist, {
    attributes: ['idArtist', 'pictureIdUpload', 'name', 'description'],
    include: [
      {
        association: 'pictureIdUploadUpload',
        attributes: ['url']
      },
      {
        association: 'eventHasArtists',
        include: [
          {
            association: 'idEventEvent',
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
                    attributes: ['url']
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
              'ticketPrice',
              'ticketCount',
              'location',
              'start',
              'likes',
              'transferable',
              'created',
              [
                Sequelize.fn(
                  'COUNT',
                  Sequelize.col('idEventEvent->Tickets.id_ticket')
                ),
                'purchasedTicketCount'
              ]
            ],
            where: {
              start: {
                [Op.gte]: currentDate
              },
              publish: {
                [Op.lte]: currentDate
              },
              contractAddress: {
                [Op.not]: null
              },
              draft: 0
            }
          }
        ],
        order: [['idEventEvent', 'start', 'ASC']],
        // @ts-expect-error Types inconsistency
        group: ['idEventEvent.id_event'],
        limit: 10
      },
      {
        association: 'reviews',
        include: [
          {
            association: 'reviewerIdUserUser',
            attributes: ['username']
          },
          {
            association: 'reviewedIdArtistArtist',
            attributes: ['name']
          }
        ],
        attributes: [
          'idReview',
          'reviewerIdUser',
          'reviewedIdArtist',
          'title',
          'eventLocation',
          'eventDate',
          'content',
          'rate',
          'created'
        ],
        where: {
          approved: 1
        },
        order: [['created', 'DESC']],
        limit: 30
      }
    ]
  })

  if (artist === null) {
    return null
  }

  return {
    idArtist: artist.idArtist,
    pictureIdUpload: artist.pictureIdUpload,
    pictureUrl: artist.pictureIdUploadUpload.url,
    name: artist.name,
    description: artist.description,
    events: artist.eventHasArtists.map(
      ({
        idEventEvent: {
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
          created,
          eventHasUploads: uploads
        }
      }) => ({
        idEvent,
        creatorIdUser,
        creatorUsername: creator.username,
        idSubcategory,
        subcategoryName: subcategory.name,
        idCity,
        cityName: city.name,
        name,
        ticketPrice,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        remainingTicketCount: ticketCount - purchasedTicketCount!,
        location,
        start,
        likes,
        transferable,
        created,
        image: uploads[0]?.idUploadUpload.url ?? null
      })
    ),
    reviews: artist.reviews.map(
      ({
        idReview,
        reviewerIdUser,
        reviewerIdUserUser: reviewer,
        reviewedIdArtist,
        reviewedIdArtistArtist: artist,
        title,
        eventLocation,
        eventDate,
        content,
        rate,
        created
      }) => ({
        idReview,
        reviewerIdUser,
        reviewerUsername: reviewer.username,
        reviewedIdArtist,
        reviewedName: artist.name,
        title,
        eventLocation,
        eventDate,
        content,
        rate,
        created
      })
    )
  }
}

export default router
