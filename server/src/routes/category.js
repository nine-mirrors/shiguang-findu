import { Router } from 'express'
import { prisma } from '../db.js'
import { wrap } from '../utils/http.js'

const router = Router()

router.get(
  '/',
  wrap(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    })
    res.json(categories.map(item => ({ id: item.id, name: item.name, icon: item.icon || '' })))
  })
)

export default router
