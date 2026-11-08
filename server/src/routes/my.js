import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { wrap } from '../utils/http.js'
import { getPagination, paginated } from '../utils/pagination.js'
import { serializeItem, serializeClaim, serializeVerification } from '../utils/serialize.js'

const router = Router()
const itemInclude = {
  category: true,
  user: { select: { id: true, username: true, avatar: true } }
}

router.get(
  '/lost-found/items',
  authenticate,
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 10)
    const where = { userId: req.user.id }

    const [total, list] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        include: itemInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    res.json(paginated(list.map(serializeItem), total, page, size))
  })
)

router.get(
  '/claims',
  authenticate,
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 10)
    const where = { userId: req.user.id }

    const [total, list] = await Promise.all([
      prisma.claim.count({ where }),
      prisma.claim.findMany({
        where,
        include: { item: { include: itemInclude } },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    res.json(paginated(list.map(claim => serializeClaim(claim, { self: true })), total, page, size))
  })
)

router.get(
  '/verification',
  authenticate,
  wrap(async (req, res) => {
    const record = await prisma.verification.findUnique({ where: { userId: req.user.id } })
    if (!record) {
      return res.json({
        userId: req.user.id,
        level: req.user.verificationLevel || 'basic',
        status: 'none',
        realName: '',
        studentNo: '',
        rejectReason: '',
        createdAt: '',
        auditedAt: ''
      })
    }
    res.json(serializeVerification(record, { self: true }))
  })
)

export default router
