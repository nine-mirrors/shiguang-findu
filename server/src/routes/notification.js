import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { getPagination, paginated } from '../utils/pagination.js'
import { serializeNotification } from '../utils/serialize.js'
import { assertId } from '../utils/validate.js'

const router = Router()

router.get(
  '/',
  authenticate,
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 10)
    const where = {
      OR: [{ userId: req.user.id }, { userId: null }]
    }

    if (String(req.query.unread || '') === '1') where.read = false

    const [total, unread, list] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { OR: [{ userId: req.user.id }, { userId: null }], read: false }
      }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    res.json({ ...paginated(list.map(serializeNotification), total, page, size), unread })
  })
)

router.put(
  '/read-all',
  authenticate,
  wrap(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { OR: [{ userId: req.user.id }, { userId: null }], read: false },
      data: { read: true }
    })
    res.json({ success: true, updated: result.count })
  })
)

async function markRead(req, res) {
  const id = assertId(req.params.id, '未找到该通知')

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) throw new HttpError(404, '未找到该通知')
  if (notification.userId && notification.userId !== req.user.id) {
    throw new HttpError(403, '当前账号没有操作权限')
  }

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } })
  res.json(serializeNotification(updated))
}

router.put('/:id/read', authenticate, wrap(markRead))
router.post('/:id/read', authenticate, wrap(markRead))

export default router
