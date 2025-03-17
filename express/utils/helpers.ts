import { Ajv } from 'ajv'
import validationSchemas from './validationSchemas.js'

export function trimStringProperties(object: unknown): void {
  if (object !== null && typeof object === 'object') {
    for (const [key, value] of Object.entries(object)) {
      if (typeof value === 'object') {
        trimStringProperties(value)
      }

      if (typeof value === 'string') {
        ;(object as any)[key] = value.trim()
      }
    }
  }
}

export function validateId(id: number): boolean {
  const ajv = new Ajv()
  const validate = ajv.compile(validationSchemas.id)
  const valid = validate(id)
  return valid
}

export function generateIdString(name: string, id: number): string {
  return `${encodeURIComponent(name.toLowerCase().split(' ').join('-'))}-${id}`
}
