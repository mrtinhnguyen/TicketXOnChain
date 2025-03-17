import { createClient } from 'redis'
import config from './config.js'

const { host, user, password } = config.redis

const redis = createClient({
  url: `redis://${user}:${password}@${host}:6379`
})

await redis.connect()

export default redis
