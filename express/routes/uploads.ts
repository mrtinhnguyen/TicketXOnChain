import express from 'express'
import type { RequestHandler } from 'express'
import createError from 'http-errors'
import { userRateLimiter } from '../middlewares/rateLimiter.js'
import authenticate from '../middlewares/authenticate.js'
import { UserRole } from '../utils/validationSchemas.js'
import { Upload } from '../models/Upload.js'
import type { ITypedRequest } from '../utils/interfaces.js'
import type { operations } from '../schemas/schema.d.ts'
import { fileTypeFromBuffer } from 'file-type'
import { bucket } from '../firebase.js'
import { v4 as uuid } from 'uuid'
import config from '../config.js'

const router = express.Router()

type CreateUpload = ITypedRequest<
  NonNullable<
    operations['CreateUpload']['requestBody']
  >['content']['multipart/form-data']
>

router.post(
  '/',
  authenticate([UserRole.EVENTS_ORGANIZER, UserRole.ADMINISTRATOR]),
  userRateLimiter,
  async function (req: CreateUpload, res, next) {
    const allowedMimeTypes = {
      FILE: ['application/pdf'],
      IMAGE: [
        'image/avif',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
    }

    const { type } = req.body
    let file = req.files?.file

    if (!Object.keys(allowedMimeTypes).includes(req.body.type)) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    if (file === undefined || file === null) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    if (Array.isArray(file)) {
      file = file[0]
    }

    const fileType = await fileTypeFromBuffer(file.data)

    if (
      fileType?.mime === undefined ||
      !allowedMimeTypes[type].includes(fileType.mime)
    ) {
      next(createError(400, 'Nieprawidłowa treść żądania'))
      return
    }

    const name = `${uuid()}/${encodeURIComponent(file.name)}`
    let url

    if (!config.test) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const bucketFile = bucket!.file(name)
      await bucketFile.save(file.data, {
        gzip: true,
        contentType: fileType.mime,
        resumable: false,
        public: true
      })

      url = bucketFile.publicUrl().replace(/%2F/g, '/')
    } else {
      url = name
    }

    const createdUpload = await Upload.create({
      url,
      type
    })

    res.status(201).json({
      idUpload: createdUpload.idUpload,
      url: createdUpload.url,
      type: createdUpload.type
    })
  } as RequestHandler
)

export default router
