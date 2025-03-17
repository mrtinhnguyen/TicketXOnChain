import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import type { Secret } from 'jsonwebtoken'
import createError from 'http-errors'
import type {
  IAuthenticationJwtPayload,
  IAuthenticateRequest
} from '../utils/interfaces.js'
import { TokenType } from '../utils/index.js'
import type { UserRole } from '../utils/validationSchemas.js'
import config from '../config.js'

const authenticate = function (
  allowedRoles: null | UserRole[] = null,
  triggerUnauthorized: boolean = true
): RequestHandler {
  return (req: IAuthenticateRequest, res, next) => {
    const secret: Secret = config.jwt.secret as Secret
    const authenticationHeader = req.headers.authorization
    const authenticationToken =
      authenticationHeader?.split('Bearer ')[1] ?? null

    if (authenticationToken === null) {
      if (triggerUnauthorized) {
        next(createError(401, 'Brak lub nieprawidłowy token uwierzytelniający'))
      } else {
        next()
      }
      return
    }

    let authenticationPayload
    try {
      authenticationPayload = jwt.verify(
        authenticationToken,
        secret
      ) as IAuthenticationJwtPayload
    } catch (error: any) {
      next(createError(401, 'Brak lub nieprawidłowy token uwierzytelniający'))
      return
    }

    const { user, tokenType } = authenticationPayload

    if (tokenType !== TokenType.AUTHENTICATION) {
      next(createError(401, 'Brak lub nieprawidłowy token uwierzytelniający'))
      return
    }

    // User authorization
    if (allowedRoles !== null && !allowedRoles.includes(user.role)) {
      next(createError(403, 'Użytkownik nie może wykonać tej akcji'))
      return
    }

    req.user = user

    next()
  }
}

export default authenticate
