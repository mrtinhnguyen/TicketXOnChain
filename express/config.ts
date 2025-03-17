import dotenv from 'dotenv'

dotenv.config()

const {
  PORT,
  FRONTEND_BASE_URL,
  BACKEND_BASE_URL,
  WEB3_PRIVATE_KEY,
  WEB3_PROVIDER,
  SUPPORTED_CHAIN_ID,
  JWT_SECRET,
  TICKET_FACTORY_ADDRESS,
  TICKET_HANDLER_ADDRESS,
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD,
  REDIS_HOST,
  REDIS_USER,
  REDIS_PASSWORD,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_PASS,
  STORAGE_BUCKET,
  FIREBASE_ADMINSDK_LOCATION,
  GOOGLE_GEOCODING_API,
  GOOGLE_MAPS_EMBED_API,
  TZ,
  NODE_ENV
} = process.env

const production = NODE_ENV === 'production'
const test = NODE_ENV === 'test'

const config = {
  production,
  test,
  port: PORT,
  frontendBaseUrl: FRONTEND_BASE_URL,
  backendBaseUrl: BACKEND_BASE_URL,
  web3Provider: {
    provider: WEB3_PROVIDER,
    privateKey: WEB3_PRIVATE_KEY
  },
  supportedChainId: Number(SUPPORTED_CHAIN_ID),
  smartContracts: {
    ticketFactoryAddress: TICKET_FACTORY_ADDRESS,
    ticketHandlerAddress: TICKET_HANDLER_ADDRESS
  },
  blockDistance: production ? 14n : 0n,
  jwt: {
    secret: JWT_SECRET,
    signUpTokenExpirationTime: '1h',
    activationTokenExpirationTime: '15min',
    authenticationTokenExpirationTime: '1h',
    refreshTokenExpirationTime: '7d'
  },
  database: {
    host: DATABASE_HOST,
    database: DATABASE_NAME,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    timezone: TZ,
    logging:
      !production && !test
        ? (log: string) => {
            console.log(log)
          }
        : false
  },
  redis: {
    host: REDIS_HOST,
    user: REDIS_USER,
    password: REDIS_PASSWORD,
    expire: 60,
    blockchainExpire: 43200
  },
  amqp: {
    host: AMQP_HOST,
    user: AMQP_USER,
    password: AMQP_PASSWORD
  },
  mail: {
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE === 'true',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS
    }
  },
  storageBucket: STORAGE_BUCKET,
  firebaseAdminSdkLocation: FIREBASE_ADMINSDK_LOCATION,
  pagination: 3,
  longPollingTimeout: 15000,
  maxFileSize: 1024 * 1024 * 2, // 2MB
  googleGeocodingApi: {
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    key: GOOGLE_GEOCODING_API
  },
  googleMapsEmbedApi: {
    url: 'https://www.google.com/maps/embed/v1/place',
    key: GOOGLE_MAPS_EMBED_API
  },
  rateLimiter: {
    limit: !test ? 10 : 9999
  }
} as const

export default config
