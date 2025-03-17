import type { Request, Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import crypto from 'crypto'
import { RedisStore } from 'rate-limit-redis'
import redis from '../redis.js'
import type { IAuthenticateRequest } from '../utils/interfaces.js'
import config from '../config.js'

const defaultOptions = {
  windowMs: 60 * 1000, // 1 minute
  limit: config.rateLimiter.limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Spróbuj ponownie za minutę' },
  statusCode: 429,
  keyGenerator(req: Request, res: Response) {
    return ''
  },
  store: new RedisStore({
    sendCommand: async (...args: string[]) => await redis.sendCommand(args)
  })
}

export const anonymRateLimiter = rateLimit({
  ...defaultOptions,
  keyGenerator(req: Request, res: Response) {
    const hash = crypto.createHash('sha256')
    hash.update(
      `${req.method}::${req.path}::${req.clientIp ?? ''}::${
        req.get('user-agent') ?? ''
      }`
    )

    return hash.digest('hex')
  }
})

export const userRateLimiter = rateLimit({
  ...defaultOptions,
  keyGenerator(req: IAuthenticateRequest, res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!
    const hash = crypto.createHash('sha256')
    hash.update(`${req.method}::${req.path}::${user.idUser}`)

    return hash.digest('hex')
  }
})
