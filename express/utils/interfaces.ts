import type { Request } from 'express'
import type { JwtPayload } from 'jsonwebtoken'
import type { TokenType, EthereumEventType } from './index.js'
import type { UserRole } from './validationSchemas.js'

export interface ISignUpJwtPayload extends JwtPayload {
  publicAddress: string
  tokenType: TokenType
}

export interface IActivationJwtPayload extends JwtPayload {
  idUser: number
  tokenType: TokenType
}

export interface IAuthenticationJwtPayload extends JwtPayload {
  user: IUser
  tokenType: TokenType
}

export interface IRefreshJwtPayload extends JwtPayload {
  user: IUser
  tokenType: TokenType
}

export interface IUser {
  idUser: number
  publicAddress: string
  role: UserRole
}

export interface ITypedRequest<T> extends Request {
  body: T
}

export interface IAuthenticateRequest extends Request {
  user?: IUser
}

export interface IAuthenticateTypedRequest<T> extends Request {
  user?: IUser
  body: T
}

export interface IAuthenticateQueryRequest<T>
  extends Request<any, any, any, T> {
  user?: IUser
}

export interface EthereumEvent {
  type: EthereumEventType
  data: any
}
