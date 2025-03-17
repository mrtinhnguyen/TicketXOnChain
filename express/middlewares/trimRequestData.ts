import type { RequestHandler } from 'express'
import { trimStringProperties } from '../utils/helpers.js'

const trimRequestData = function (req, res, next) {
  trimStringProperties(req.query)
  trimStringProperties(req.body)

  next()
} as RequestHandler

export default trimRequestData
