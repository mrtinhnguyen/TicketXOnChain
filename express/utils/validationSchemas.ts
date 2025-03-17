import type { JSONSchemaType } from 'ajv'
import type { components, operations } from '../schemas/schema.d.ts'

export enum UserRole {
  USER = 'USER',
  EVENTS_ORGANIZER = 'EVENTS_ORGANIZER',
  ADMINISTRATOR = 'ADMINISTRATOR'
}

const id: JSONSchemaType<components['schemas']['Id']> = {
  type: 'integer'
}

const publicAddress: JSONSchemaType<components['schemas']['PublicAddress']> = {
  type: 'string',
  pattern: '^0x[0-9a-fA-F]{40}$'
}

const jwt: JSONSchemaType<components['schemas']['JWT']> = {
  type: 'string',
  minLength: 1
}

const name: JSONSchemaType<components['schemas']['Name']> = {
  type: 'string',
  minLength: 1,
  maxLength: 85
}

const longName: JSONSchemaType<components['schemas']['LongName']> = {
  type: 'string',
  minLength: 1,
  maxLength: 120
}

const description: JSONSchemaType<components['schemas']['Description']> = {
  type: 'string',
  minLength: 1,
  maxLength: 3000
}

const content: JSONSchemaType<components['schemas']['Content']> = {
  type: 'string',
  minLength: 1,
  maxLength: 1000
}

const url: JSONSchemaType<components['schemas']['Url']> = {
  type: 'string',
  format: 'url',
  maxLength: 255
}

const email: JSONSchemaType<components['schemas']['Email']> = {
  type: 'string',
  format: 'email',
  maxLength: 320
}

const tags: JSONSchemaType<components['schemas']['Tags']> = {
  type: 'string',
  minLength: 1,
  maxLength: 100
}

const price: JSONSchemaType<components['schemas']['Price']> = {
  type: 'string',
  pattern: '^\\d{1,28}(.\\d{1,2})?$'
}

const postalCode: JSONSchemaType<components['schemas']['PostalCode']> = {
  type: 'string',
  pattern: '^\\d{2}-\\d{3}$'
}

const date: JSONSchemaType<components['schemas']['Date']> = {
  type: 'string',
  format: 'date'
}

const dateTime: JSONSchemaType<components['schemas']['DateTime']> = {
  type: 'string',
  format: 'date-time'
}

const rate: JSONSchemaType<components['schemas']['Rate']> = {
  type: 'integer',
  minimum: 0,
  maximum: 5
}

const uuid: JSONSchemaType<components['schemas']['UUID']> = {
  type: 'string',
  pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
}

const userRole: JSONSchemaType<components['schemas']['UserRole']> = {
  type: 'string',
  enum: ['USER', 'EVENTS_ORGANIZER', 'ADMINISTRATOR']
}

const createArtist: JSONSchemaType<components['schemas']['CreateArtist']> = {
  type: 'object',
  properties: {
    pictureIdUpload: id,
    name,
    description
  },
  required: ['pictureIdUpload', 'name', 'description'],
  additionalProperties: false
}

const updateArtist: JSONSchemaType<components['schemas']['UpdateArtist']> =
  createArtist

// @ts-expect-error Types inconsistency
const createEvent: JSONSchemaType<components['schemas']['CreateEvent']> = {
  type: 'object',
  properties: {
    idSubcategory: id,
    cityName: name,
    statuteIdUpload: {
      anyOf: [
        {
          type: 'null'
        },
        id
      ]
    },
    nftImageIdUpload: {
      anyOf: [
        {
          type: 'null'
        },
        id
      ]
    },
    name: longName,
    tags,
    description,
    video: {
      anyOf: [
        {
          type: 'null'
        },
        url
      ]
    },
    ticketPrice: price,
    ticketCount: {
      type: 'integer',
      minimum: 1
    },
    maxTicketsPerUser: {
      type: 'integer',
      minimum: 1
    },
    location: longName,
    street: name,
    postalCode,
    start: dateTime,
    publish: dateTime,
    draft: {
      type: 'boolean'
    },
    transferable: {
      type: 'boolean'
    },
    images: {
      type: 'array',
      items: id,
      maxItems: 5
    },
    artists: {
      type: 'array',
      items: id,
      maxItems: 5
    }
  },
  required: [
    'idSubcategory',
    'cityName',
    'statuteIdUpload',
    'nftImageIdUpload',
    'name',
    'tags',
    'description',
    'video',
    'ticketPrice',
    'ticketCount',
    'maxTicketsPerUser',
    'location',
    'street',
    'postalCode',
    'start',
    'publish',
    'draft',
    'transferable',
    'images',
    'artists'
  ],
  additionalProperties: false
}

// @ts-expect-error Types inconsistency
const updateEvent: JSONSchemaType<components['schemas']['UpdateEvent']> = {
  type: 'object',
  properties: {
    idSubcategory: id,
    cityName: name,
    statuteIdUpload: {
      anyOf: [
        {
          type: 'null'
        },
        id
      ]
    },
    nftImageIdUpload: {
      anyOf: [
        {
          type: 'null'
        },
        id
      ]
    },
    tags,
    description,
    video: {
      anyOf: [
        {
          type: 'null'
        },
        url
      ]
    },
    location: longName,
    street: name,
    postalCode,
    start: dateTime,
    draft: {
      type: 'boolean'
    },
    images: {
      type: 'array',
      items: id,
      maxItems: 5
    },
    artists: {
      type: 'array',
      items: id,
      maxItems: 5
    }
  },
  required: [
    'idSubcategory',
    'cityName',
    'statuteIdUpload',
    'nftImageIdUpload',
    'tags',
    'description',
    'video',
    'location',
    'street',
    'postalCode',
    'start',
    'draft',
    'images',
    'artists'
  ],
  additionalProperties: false
}

const updateUserRole: JSONSchemaType<components['schemas']['UpdateUserRole']> =
  {
    type: 'object',
    properties: {
      role: userRole
    },
    required: ['role'],
    additionalProperties: false
  }

const updateUser: JSONSchemaType<components['schemas']['UpdateUser']> = {
  type: 'object',
  properties: {
    name,
    surname: name,
    birthdate: date
  },
  required: ['name', 'surname', 'birthdate'],
  additionalProperties: false
}

const createReview: JSONSchemaType<components['schemas']['CreateReview']> = {
  type: 'object',
  properties: {
    title: name,
    eventLocation: longName,
    eventDate: date,
    content,
    rate
  },
  required: ['title', 'eventLocation', 'eventDate', 'content', 'rate'],
  additionalProperties: false
}

const passiveTicketVerification: JSONSchemaType<
  NonNullable<
    operations['PassiveTicketVerification']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    publicAddress
  },
  required: ['publicAddress'],
  additionalProperties: false
}

const activeTicketVerification: JSONSchemaType<
  NonNullable<
    operations['ActiveTicketVerification']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    uuid
  },
  required: ['uuid'],
  additionalProperties: false
}

const generateNonce: JSONSchemaType<
  NonNullable<
    operations['GenerateNonce']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    publicAddress
  },
  required: ['publicAddress'],
  additionalProperties: false
}

const signUp: JSONSchemaType<
  NonNullable<
    operations['SignUp']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    signUpToken: jwt,
    email,
    username: name,
    name,
    surname: name,
    birthdate: date
  },
  required: [
    'signUpToken',
    'email',
    'username',
    'name',
    'surname',
    'birthdate'
  ],
  additionalProperties: false
}

const activateUser: JSONSchemaType<
  NonNullable<
    operations['ActivateUser']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    activationToken: jwt
  },
  required: ['activationToken'],
  additionalProperties: false
}

const signIn: JSONSchemaType<
  NonNullable<
    operations['SignIn']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      minLength: 1
    },
    signature: {
      type: 'string',
      minLength: 1
    }
  },
  required: ['message', 'signature'],
  additionalProperties: false
}

const refreshTokens: JSONSchemaType<
  NonNullable<
    operations['RefreshTokens']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    refreshToken: jwt
  },
  required: ['refreshToken'],
  additionalProperties: false
}

const approveActiveTicketVerification: JSONSchemaType<
  NonNullable<
    operations['ApproveActiveTicketVerification']['requestBody']
  >['content']['application/json']
> = {
  type: 'object',
  properties: {
    uuid,
    signature: {
      type: 'string',
      minLength: 1
    }
  },
  required: ['uuid', 'signature'],
  additionalProperties: false
}

export default {
  id,
  createArtist,
  updateArtist,
  createEvent,
  updateEvent,
  updateUserRole,
  updateUser,
  createReview,
  passiveTicketVerification,
  activeTicketVerification,
  generateNonce,
  signUp,
  activateUser,
  signIn,
  refreshTokens,
  approveActiveTicketVerification
}
