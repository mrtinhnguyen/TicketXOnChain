import type { RequestHandler } from 'express'
import { Ajv } from 'ajv'
import type { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

const validateBody = function <T>(schema: JSONSchemaType<T>): RequestHandler {
  const ajv = new Ajv({
    allErrors: true,
    $data: true
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  addFormats.default(ajv)

  const validate = ajv.compile(schema)

  return (req, res, next) => {
    const valid = validate(req.body)
    if (!valid) {
      res.status(400).json({ message: JSON.stringify(validate.errors) })
      return
    }

    next()
  }
}

export default validateBody
