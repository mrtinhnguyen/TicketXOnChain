import createError from 'http-errors'
import express from 'express'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import trimRequestData from './middlewares/trimRequestData.js'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import fileUpload from 'express-fileupload'
import requestIp from 'request-ip'
import config from './config.js'
import fs from 'node:fs/promises'

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.resolve()

import artistsRouter from './routes/artists.js'
import categoriesRouter from './routes/categories.js'
import citiesRouter from './routes/cities.js'
import eventsRouter from './routes/events.js'
import reviewsRouter from './routes/reviews.js'
import ticketsRouter from './routes/tickets.js'
import uploadsRouter from './routes/uploads.js'
import usersRouter from './routes/users.js'

const app = express()

const DEBUG = app.get('env') === 'development'

app.set('trust proxy', true)
app.set('case sensitive routing', true)
app.set('strict routing', true)

const options: cors.CorsOptions = {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  origin: [config.frontendBaseUrl!]
}
app.use(cors(options))
app.use(compression())
app.use(helmet())

app.use(
  logger(
    ':date[iso] ":method :url :status :res[content-length] - :response-time ms"',
    {
      skip: function (req, res) {
        return !config.test ? (DEBUG ? false : res.statusCode < 400) : true
      }
    }
  )
)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(trimRequestData)

app.use(
  fileUpload({
    limits: { fileSize: config.maxFileSize },
    limitHandler: function (req, res, next) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
    }
  })
)

app.use(requestIp.mw())

app.get('/api', async function (req, res) {
  const openapi = await fs.readFile(
    path.join(__dirname, 'openapi', 'openapi3_1.yaml')
  )

  res.type('yaml')
  res.send(openapi)
} as RequestHandler)

app.use('/api/artists', artistsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/cities', citiesRouter)
app.use('/api/events', eventsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/users', usersRouter)

app.use(function (req, res, next) {
  next(createError(404, 'Nie znaleziono żądanego zasobu'))
} as RequestHandler)

app.use(function (err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  if (err.status !== undefined && err.status !== null) {
    res.status(Number(err.status)).json({
      message: err.message
    })
  } else {
    res.status(500).json({
      message: 'Wystąpił wewnętrzny błąd serwera'
    })
  }
} as ErrorRequestHandler)

export default app
