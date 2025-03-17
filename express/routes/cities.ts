import express from 'express'
import type { RequestHandler } from 'express'
import { City } from '../models/City.js'
import redis from '../redis.js'
import { redisJsonSet } from '../utils/index.js'
import type { RedisJSON } from '@redis/json/dist/commands/index.js'

const router = express.Router()

router.get('/', async function (req, res) {
  const key = 'ListCities'
  let cities = (await redis.json.get(key)) as unknown as City[]

  if (cities === null) {
    cities = await City.findAll({
      attributes: ['idCity', 'name'],
      order: [['name', 'ASC']]
    })

    await redisJsonSet(key, cities as unknown as RedisJSON)
  }

  res.json(cities)
} as RequestHandler)

export default router
