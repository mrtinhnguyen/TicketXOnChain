import express from 'express'
import type { Request, RequestHandler } from 'express'
import createError from 'http-errors'
import { Review } from '../models/Review.js'
import redis from '../redis.js'
import config from '../config.js'
import type { operations } from '../schemas/schema.d.ts'
import authenticate from '../middlewares/authenticate.js'
import { UserRole } from '../utils/validationSchemas.js'
import { validateId } from '../utils/helpers.js'

const router = express.Router()

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

    const where: any = {
      approved: 0
    }

    const count = await Review.count({
      where
    })

    let pages = Math.ceil(count / config.pagination)
    if (pages === 0) {
      pages = 1
    }

    if (!(page >= 1 && page <= pages)) {
      page = 1
    }

    const reviewsToApprove = await Review.findAll({
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
      where,
      order: [['created', 'ASC']],
      limit: config.pagination,
      offset: config.pagination * (page - 1)
    })

    res.json({
      count,
      pages,
      currentPage: page,
      results: reviewsToApprove.map(
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
    })
  } as RequestHandler
)

router.delete(
  '/:idReview',
  authenticate([UserRole.ADMINISTRATOR]),
  async function (req, res, next) {
    const idReview = Number(req.params.idReview)

    if (!validateId(idReview)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const review = await Review.findByPk(idReview)

    if (review === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    await review?.destroy()

    const key = `GetArtist::${review.reviewedIdArtist}`
    await redis.json.del(key)

    res.sendStatus(204)
  } as RequestHandler
)

router.post(
  '/:idReview/approve',
  authenticate([UserRole.ADMINISTRATOR]),
  async function (req, res, next) {
    const idReview = Number(req.params.idReview)

    if (!validateId(idReview)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const review = await Review.findByPk(idReview)

    if (review === null || review.approved === 1) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    await review.approve()

    res.sendStatus(204)
  } as RequestHandler
)

export default router
