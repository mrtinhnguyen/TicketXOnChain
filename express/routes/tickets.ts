import express from 'express'
import type { RequestHandler } from 'express'
import createError from 'http-errors'
import type { operations } from '../schemas/schema.d.ts'
import { anonymRateLimiter } from '../middlewares/rateLimiter.js'
import type { ITypedRequest } from '../utils/interfaces.js'
import validateBody from '../middlewares/validateBody.js'
import validationSchemas from '../utils/validationSchemas.js'
import { Event } from '../models/Event.js'

const router = express.Router()

type ApproveActiveTicketVerification = NonNullable<
  operations['ApproveActiveTicketVerification']['requestBody']
>['content']['application/json']

router.post(
  '/approve',
  anonymRateLimiter,
  validateBody<ApproveActiveTicketVerification>(
    validationSchemas.approveActiveTicketVerification
  ),
  async function (
    req: ITypedRequest<ApproveActiveTicketVerification>,
    res,
    next
  ) {
    const { uuid, signature } = req.body

    try {
      await Event.approveTicket(uuid, signature)
    } catch (error: any) {
      if (error.message === 'Unable to approve ticket verification') {
        next(createError(400, 'Nieprawidłowa treść żądania'))
        return
      }

      throw error
    }

    res.sendStatus(204)
  } as RequestHandler
)

export default router
