import { Router } from 'express'
import { prisma } from '../db.js'
import { wrap } from '../utils/http.js'
import { getPagination, paginated } from '../utils/pagination.js'
import { serializeAnnouncement } from '../utils/serialize.js'

const router = Router()

router.get(
  '/',
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 10)
    const where = { status: 'published' }

    const [total, list] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take })
    ])

    res.json(paginated(list.map(serializeAnnouncement), total, page, size))
  })
)

export default router
