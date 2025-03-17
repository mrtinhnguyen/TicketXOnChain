import express from 'express'
import type { RequestHandler } from 'express'
import { Category } from '../models/Category.js'
import redis from '../redis.js'
import { redisJsonSet } from '../utils/index.js'
import type { RedisJSON } from '@redis/json/dist/commands/index.js'

const router = express.Router()

router.get('/', async function (req, res) {
  const key = 'ListCategories'
  let categories = (await redis.json.get(key)) as unknown as Category[]

  if (categories === null) {
    categories = await Category.findAll({
      attributes: ['idCategory', 'name'],
      include: {
        association: 'subcategories',
        attributes: ['idSubcategory', 'name'],
        order: [['name', 'ASC']]
      },
      order: [['name', 'ASC']]
    })

    await redisJsonSet(key, categories as unknown as RedisJSON)
  }

  res.json(categories)
} as RequestHandler)

export default router
