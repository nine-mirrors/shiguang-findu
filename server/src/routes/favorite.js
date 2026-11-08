import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { getPagination, paginated } from '../utils/pagination.js'
import { serializeFavorite } from '../utils/serialize.js'
import { assertId, readId } from '../utils/validate.js'

const router = Router()
const itemInclude = {
  category: true,
  user: { select: { id: true, username: true, avatar: true } }
}

function readItemId(payload) {
  const itemId = readId(payload?.itemId ?? payload?.item_id)
  if (!itemId) {
    throw new HttpError(422, '请选择要收藏的物品', { errors: { itemId: '请选择物品' } })
  }
  return itemId
}

/** 只允许收藏公开可见（已审核）的帖子 */
async function findFavoriteTarget(itemId, user) {
  const item = await prisma.item.findUnique({ where: { id: itemId } })
  if (!item) throw new HttpError(404, '未找到该信息')
  if (item.auditStatus !== 'approved' && item.userId !== user.id) {
    throw new HttpError(404, '未找到该信息')
  }
  return item
}

router.get(
  '/',
  authenticate,
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 10)
    const where = { userId: req.user.id }

    const [total, list] = await Promise.all([
      prisma.favorite.count({ where }),
      prisma.favorite.findMany({
        where,
        include: { item: { include: itemInclude } },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    res.json(paginated(list.map(serializeFavorite), total, page, size))
  })
)

router.post(
  '/',
  authenticate,
  wrap(async (req, res) => {
    const itemId = readItemId(req.body)
    await findFavoriteTarget(itemId, req.user)

    const favorite = await prisma.favorite.upsert({
      where: { userId_itemId: { userId: req.user.id, itemId } },
      update: {},
      create: { userId: req.user.id, itemId },
      include: { item: { include: itemInclude } }
    })

    res.status(201).json({ favorited: true, favorite: serializeFavorite(favorite) })
  })
)

router.post(
  '/toggle',
  authenticate,
  wrap(async (req, res) => {
    const itemId = readItemId(req.body)
    await findFavoriteTarget(itemId, req.user)

    const exists = await prisma.favorite.findUnique({
      where: { userId_itemId: { userId: req.user.id, itemId } }
    })

    if (exists) {
      await prisma.favorite.delete({ where: { id: exists.id } })
      return res.json({ favorited: false })
    }

    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, itemId },
      include: { item: { include: itemInclude } }
    })
    res.json({ favorited: true, favorite: serializeFavorite(favorite) })
  })
)

router.delete(
  '/:id',
  authenticate,
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该收藏')

    const byId = await prisma.favorite.findFirst({ where: { id, userId: req.user.id } })
    if (byId) {
      await prisma.favorite.delete({ where: { id: byId.id } })
      return res.json({ success: true, id: byId.id, itemId: byId.itemId })
    }

    const byItem = await prisma.favorite.findUnique({
      where: { userId_itemId: { userId: req.user.id, itemId: id } }
    })
    if (byItem) {
      await prisma.favorite.delete({ where: { id: byItem.id } })
      return res.json({ success: true, id: byItem.id, itemId: byItem.itemId })
    }

    throw new HttpError(404, '未找到该收藏')
  })
)

export default router
