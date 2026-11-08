import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import {
  itemImageUpload,
  collectUploadedFiles,
  toPublicPath,
  assertImageFiles,
  removeUploadedFiles
} from '../middleware/upload.js'
import { HttpError, wrap } from '../utils/http.js'
import { getPagination, paginated, readBool } from '../utils/pagination.js'
import { serializeItem } from '../utils/serialize.js'
import { findActiveBlacklist, blockedMessage } from '../utils/blacklist.js'
import {
  assertId,
  readId,
  requiredText,
  optionalText
} from '../utils/validate.js'

const router = Router()

const ITEM_STATUSES = ['open', 'claiming', 'done', 'overdue']
const ITEM_TYPES = ['lost', 'found']
const MAX_IMAGES = 10
const MAX_UPLOADS_PER_REQUEST = 5

const itemInclude = {
  category: true,
  user: { select: { id: true, username: true, avatar: true } }
}

function parseImages(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readImageList(value, field = 'images') {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new HttpError(422, 'images 必须是数组', { errors: { [field]: 'images 必须是数组' } })
  }
  const list = value.map(item => String(item ?? '').trim()).filter(Boolean)
  if (list.length > MAX_IMAGES) {
    throw new HttpError(422, `最多只能保存 ${MAX_IMAGES} 张图片`, { errors: { [field]: '图片数量超出上限' } })
  }
  if (list.some(item => item.length > 300)) {
    throw new HttpError(422, '图片地址过长', { errors: { [field]: '图片地址过长' } })
  }
  return list
}

function readRetentionDays(value) {
  const days = Number(value ?? 30)
  if (!Number.isFinite(days)) return 30
  return Math.min(365, Math.max(1, Math.round(days)))
}

async function resolveCategoryId(payload) {
  const rawId = payload.categoryId ?? payload.category_id
  if (rawId !== undefined && rawId !== null && rawId !== '') {
    const id = readId(rawId)
    const found = id ? await prisma.category.findUnique({ where: { id } }) : null
    if (!found) throw new HttpError(422, '分类不存在', { errors: { category: '分类不存在' } })
    return found.id
  }

  const name = String(payload.category || '').trim()
  if (!name) throw new HttpError(422, '请选择分类', { errors: { category: '请选择分类' } })
  if (name.length > 30) throw new HttpError(422, '分类名称不合法', { errors: { category: '分类名称不合法' } })

  const found = await prisma.category.findFirst({ where: { name } })
  if (!found) throw new HttpError(422, '分类不存在', { errors: { category: '分类不存在' } })
  return found.id
}

async function findOwnedItem(id, user) {
  const item = await prisma.item.findUnique({ where: { id }, include: itemInclude })
  if (!item) throw new HttpError(404, '未找到该信息')
  if (user.role !== 'admin' && item.userId !== user.id) {
    throw new HttpError(403, '当前账号没有操作权限')
  }
  return item
}

router.get(
  '/',
  wrap(async (req, res) => {
    const query = req.query || {}
    const { page, size, skip, take } = getPagination(query, 10)
    const where = { auditStatus: 'approved' }

    if (query.type && query.type !== 'all') where.type = String(query.type)
    if (query.status && query.status !== 'all') where.status = String(query.status)
    if (query.location && query.location !== 'all') where.location = String(query.location)
    if (query.category && query.category !== 'all') {
      where.category = { is: { name: String(query.category) } }
    }

    const hasPhoto = String(query.hasPhoto ?? query.has_photo ?? '').toLowerCase()
    if (hasPhoto === 'with' || readBool(query.hasPhoto)) where.image = { not: '' }
    if (hasPhoto === 'without') where.image = ''

    const keyword = String(query.keyword || '').trim().slice(0, 50)
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        { location: { contains: keyword } },
        { contact: { contains: keyword } },
        { category: { is: { name: { contains: keyword } } } }
      ]
    }

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

/** 名称二元组：中文没有空格分词，用相邻两字切分做近似匹配 */
function nameTokens(text) {
  const clean = String(text || '').replace(/[\s\p{P}]/gu, '')
  const grams = new Set()
  for (let index = 0; index < clean.length - 1; index += 1) {
    grams.add(clean.slice(index, index + 2))
  }
  return grams
}

/** 相似度打分：类型互补、同分类、名称相近、地点相近 */
function scoreSimilar(base, candidate) {
  const reasons = []
  let score = 0

  const oppositeType = base.type === 'lost' ? 'found' : base.type === 'found' ? 'lost' : ''
  if (oppositeType && candidate.type === oppositeType) {
    score += 2
    reasons.push('失物 / 招领正好互补')
  }

  if (base.categoryId && candidate.categoryId === base.categoryId) {
    score += 3
    reasons.push('同一分类')
  }

  const baseTokens = nameTokens(base.name)
  const tokens = nameTokens(candidate.name)
  let overlap = 0
  tokens.forEach(token => {
    if (baseTokens.has(token)) overlap += 1
  })
  if (overlap > 0) {
    score += Math.min(4, overlap)
    reasons.push('名称关键词相近')
  }

  const baseLocation = String(base.location || '').trim()
  const candidateLocation = String(candidate.location || '').trim()
  if (
    baseLocation &&
    candidateLocation &&
    (candidateLocation.includes(baseLocation) || baseLocation.includes(candidateLocation))
  ) {
    score += 2
    reasons.push('地点相同或相近')
  }

  return { score, reasons }
}

/** 发布页相似提示：物品还没创建，按表单字段即时匹配 */
router.get(
  '/similar',
  wrap(async (req, res) => {
    const query = req.query || {}
    const type = ITEM_TYPES.includes(String(query.type)) ? String(query.type) : ''
    const name = String(query.name || '').trim().slice(0, 60)
    const location = String(query.location || '').trim().slice(0, 100)
    const categoryId = readId(query.categoryId ?? query.category_id)

    if (!name && !categoryId) {
      return res.json({ total: 0, items: [] })
    }

    const oppositeType = type === 'lost' ? 'found' : type === 'found' ? 'lost' : ''
    const candidates = await prisma.item.findMany({
      where: {
        auditStatus: 'approved',
        status: { in: ['open', 'claiming'] },
        ...(oppositeType || categoryId
          ? {
              OR: [
                ...(oppositeType ? [{ type: oppositeType }] : []),
                ...(categoryId ? [{ categoryId }] : [])
              ]
            }
          : {})
      },
      include: itemInclude,
      orderBy: { createdAt: 'desc' },
      take: 60
    })

    const items = candidates
      .map(candidate => {
        const { score, reasons } = scoreSimilar({ type, name, location, categoryId }, candidate)
        return { candidate, score, reasons }
      })
      .filter(entry => entry.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ candidate, score, reasons }) => ({
        ...serializeItem(candidate),
        matchScore: score,
        matchReasons: reasons
      }))

    res.json({ total: items.length, items })
  })
)

router.get(
  '/:id/similar',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该信息')

    const item = await prisma.item.findUnique({ where: { id }, select: {
      id: true,
      type: true,
      name: true,
      location: true,
      categoryId: true
    } })
    if (!item) throw new HttpError(404, '未找到该信息')

    const oppositeType = item.type === 'lost' ? 'found' : 'lost'
    const candidates = await prisma.item.findMany({
      where: {
        id: { not: id },
        auditStatus: 'approved',
        status: { in: ['open', 'claiming'] },
        OR: [
          { type: oppositeType },
          ...(item.categoryId ? [{ categoryId: item.categoryId }] : [])
        ]
      },
      include: itemInclude,
      orderBy: { createdAt: 'desc' },
      take: 60
    })

    const items = candidates
      .map(candidate => {
        const { score, reasons } = scoreSimilar(item, candidate)
        return { candidate, score, reasons }
      })
      .filter(entry => entry.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ candidate, score, reasons }) => ({
        ...serializeItem(candidate),
        matchScore: score,
        matchReasons: reasons
      }))

    res.json({ total: items.length, items })
  })
)

router.get(
  '/:id',
  optionalAuthenticate,
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该信息')

    const item = await prisma.item.findUnique({ where: { id }, include: itemInclude })
    if (!item) throw new HttpError(404, '未找到该信息')

    const isOwner = req.user && item.userId === req.user.id
    const isAdmin = req.user && req.user.role === 'admin'
    if (item.auditStatus !== 'approved' && !isOwner && !isAdmin) {
      throw new HttpError(404, '未找到该信息')
    }

    res.json(serializeItem(item))
  })
)

router.post(
  '/',
  authenticate,
  wrap(async (req, res) => {
    const payload = req.body || {}
    const type = String(payload.type || '').trim()

    if (!ITEM_TYPES.includes(type)) {
      throw new HttpError(422, '信息类型必须是 lost 或 found', { errors: { type: '请选择失物或招领' } })
    }

    const name = requiredText(payload.name, { field: 'name', label: '物品名称', max: 60 })
    const location = optionalText(payload.location, { field: 'location', label: '地点', max: 100 })
    const happenTime = optionalText(payload.happenTime ?? payload.happen_time, {
      field: 'happenTime',
      label: '发生时间',
      max: 40
    })
    const description = optionalText(payload.description, {
      field: 'description',
      label: '描述',
      max: 1000
    })
    const contact = optionalText(payload.contact, { field: 'contact', label: '联系方式', max: 100 })
    const claimHint = optionalText(payload.claimHint ?? payload.claim_hint, {
      field: 'claimHint',
      label: '认领提示',
      max: 200
    })
    const images = readImageList(payload.images)

    const blocked = await findActiveBlacklist(req.user.id, 'publish')
    if (blocked) {
      throw new HttpError(403, blockedMessage(blocked), { code: 'user_blocked', blocked: true })
    }

    const categoryId = await resolveCategoryId(payload)
    const image = optionalText(payload.image, { field: 'image', label: '图片地址', max: 300 }) || images[0] || ''

    const item = await prisma.item.create({
      data: {
        userId: req.user.id,
        type,
        name,
        categoryId,
        location,
        happenTime,
        description,
        contact,
        image,
        images: JSON.stringify(images),
        visibility: payload.visibility === 'private' ? 'private' : 'public',
        isValuable: readBool(payload.isValuable ?? payload.is_valuable),
        claimHint,
        storageCode: type === 'found' ? `LF-${String(Date.now()).slice(-6)}` : '待找到',
        retentionDays: readRetentionDays(payload.retentionDays ?? payload.retention_days),
        status: 'open',
        auditStatus: 'pending'
      },
      include: itemInclude
    })

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'audit',
        title: '发布信息已提交审核',
        content: `你发布的「${item.name}」已提交，管理员审核通过后会展示到失物大厅。`,
        relatedId: item.id
      }
    })

    res.status(201).json(serializeItem(item))
  })
)

router.put(
  '/:id/status',
  authenticate,
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该信息')

    const status = String(req.body?.status || '').trim()
    if (!ITEM_STATUSES.includes(status)) {
      throw new HttpError(422, '状态不合法', { errors: { status: `可选值：${ITEM_STATUSES.join(' / ')}` } })
    }

    const current = await findOwnedItem(id, req.user)
    if (current.auditStatus === 'rejected') {
      throw new HttpError(422, '该信息未通过审核，无法修改状态', {
        errors: { status: '该信息未通过审核' }
      })
    }

    const item = await prisma.item.update({
      where: { id },
      data: { status, ...(status === 'done' ? { completedAt: new Date() } : {}) },
      include: itemInclude
    })

    res.json(serializeItem(item))
  })
)

router.delete(
  '/:id',
  authenticate,
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该信息')

    await findOwnedItem(id, req.user)
    await prisma.item.delete({ where: { id } })

    res.json({ success: true, id })
  })
)

router.post(
  '/:id/images',
  authenticate,
  itemImageUpload,
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该信息')
    const files = collectUploadedFiles(req)

    try {
      const item = await findOwnedItem(id, req.user)
      if (!files.length) {
        throw new HttpError(422, '请选择要上传的图片', { errors: { images: '请选择图片' } })
      }

      assertImageFiles(files)

      const existing = parseImages(item.images)
      if (existing.length + files.length > MAX_IMAGES) {
        throw new HttpError(422, `每件物品最多保存 ${MAX_IMAGES} 张图片`, {
          errors: { images: '图片数量超出上限' }
        })
      }

      const uploaded = files.map(toPublicPath).slice(0, MAX_UPLOADS_PER_REQUEST)
      const merged = [...existing, ...uploaded]

      const updated = await prisma.item.update({
        where: { id },
        data: {
          image: item.image || uploaded[0],
          images: JSON.stringify(merged)
        },
        include: itemInclude
      })

      const base = `${req.protocol}://${req.get('host')}`
      res.json({
        item: serializeItem(updated),
        image: updated.image,
        images: merged,
        urls: uploaded.map(path => `${base}${path}`)
      })
    } catch (error) {
      removeUploadedFiles(files)
      throw error
    }
  })
)

export default router
