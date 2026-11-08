import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { getPagination, paginated } from '../utils/pagination.js'
import { parseDateTime } from '../utils/datetime.js'
import { assertId, readId, requiredText, optionalText } from '../utils/validate.js'
import {
  serializeItem,
  serializeClaim,
  serializeStorage,
  serializeAnnouncement,
  serializeDispute,
  serializeBlacklist,
  serializeVerification,
  serializeUser,
  serializeAdminLog
} from '../utils/serialize.js'
import { logAdminAction } from '../utils/adminLog.js'
import { runOverdueScan } from '../services/overdue.js'

const router = Router()

router.use(authenticate, requireAdmin)

const itemInclude = {
  category: true,
  user: { select: { id: true, username: true, avatar: true } }
}

/** 物品状态展示口径：status 为库内值，name/type 供前端直接渲染 */
const ITEM_STATUS_META = [
  { status: 'open', name: '寻找中', type: 'primary' },
  { status: 'claiming', name: '认领中', type: 'warning' },
  { status: 'done', name: '已完成', type: 'success' },
  { status: 'overdue', name: '已关闭', type: 'info' }
]

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 生成含今天在内、按日期升序的最近 N 天日期键 */
function recentDateKeys(days) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (days - 1 - index))
    return localDateKey(day)
  })
}

async function notify(data) {
  return prisma.notification.create({ data })
}

/* ============================== 总览 ============================== */

router.get(
  '/dashboard',
  wrap(async (req, res) => {
    const [items, claims, disputes, blacklist, verifications, categories] = await Promise.all([
      prisma.item.findMany({ include: itemInclude }),
      prisma.claim.findMany(),
      prisma.dispute.findMany(),
      prisma.blacklist.findMany(),
      prisma.verification.findMany(),
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
    ])

    const approved = items.filter(item => item.auditStatus === 'approved')
    const now = Date.now()

    const isOverdue = item => {
      if (item.auditStatus !== 'approved' || item.type !== 'found' || item.status !== 'open') return false
      const days = Number(item.retentionDays || 30)
      return now > new Date(item.createdAt).getTime() + days * 86400000
    }

    const retainedItems = items.filter(
      item => item.auditStatus === 'approved' && item.type === 'found' && item.status === 'open'
    )

    const todos = [
      ...items
        .filter(item => item.auditStatus === 'pending')
        .slice(0, 10)
        .map(item => ({
          id: `item-${item.id}`,
          type: 'content',
          title: `${item.name}待审核`,
          level: 'medium',
          target: '/admin/review'
        })),
      ...claims
        .filter(claim => claim.status === 'pending')
        .slice(0, 10)
        .map(claim => ({
          id: `claim-${claim.id}`,
          type: 'claim',
          title: `认领申请 #${claim.id} 待核验`,
          level: 'high',
          target: '/admin/review'
        })),
      ...retainedItems
        .filter(isOverdue)
        .slice(0, 10)
        .map(item => ({
          id: `storage-${item.id}`,
          type: 'storage',
          title: `${item.name}已超保管期`,
          level: 'medium',
          target: '/admin/operations'
        }))
    ]

    const locationMap = new Map()
    approved.forEach(item => {
      if (!item.location) return
      locationMap.set(item.location, (locationMap.get(item.location) || 0) + 1)
    })
    const locations = [...locationMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    res.json({
      total: items.length,
      approved: approved.length,
      pending: items.filter(item => item.auditStatus === 'pending').length,
      done: items.filter(item => item.status === 'done').length,
      claims: claims.length,
      claimPending: claims.filter(claim => claim.status === 'pending').length,
      retained: retainedItems.length,
      overdue: retainedItems.filter(isOverdue).length,
      retainedItems: retainedItems.slice(0, 5).map(serializeItem),
      disputes: disputes.filter(dispute => dispute.status !== 'resolved').length,
      blacklist: blacklist.filter(record => record.status === 'active').length,
      verifications: verifications.filter(record => record.status === 'pending').length,
      todos,
      lost: approved.filter(item => item.type === 'lost').length,
      found: approved.filter(item => item.type === 'found').length,
      categories: categories.map(category => ({
        name: category.name,
        value: approved.filter(item => item.categoryId === category.id).length
      })),
      locations
    })
  })
)

/* ============================== 信息审核 ============================== */

async function listAdminItems(req, res) {
  const query = req.query || {}
  const { page, size, skip, take } = getPagination(query, 20)
  const where = {}

  const auditStatus = query.auditStatus ?? query.audit_status
  if (auditStatus && auditStatus !== 'all') where.auditStatus = String(auditStatus)

  if (query.status && query.status !== 'all') where.status = String(query.status)
  if (query.type && query.type !== 'all') where.type = String(query.type)
  if (query.category && query.category !== 'all') {
    where.category = { is: { name: String(query.category) } }
  }

  const keyword = String(query.keyword || '').trim()
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
      { contact: { contains: keyword } },
      { location: { contains: keyword } },
      { user: { is: { username: { contains: keyword } } } }
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
}

router.get('/items', wrap(listAdminItems))
router.get('/lost-found/items', wrap(listAdminItems))

async function auditItem(req, res) {
  const id = assertId(req.params.id, '未找到该信息')

  const payload = req.body || {}
  const auditStatus = String(payload.auditStatus ?? payload.audit_status ?? payload.status ?? '').trim()
  const rejectReason = optionalText(payload.rejectReason ?? payload.reject_reason, {
    field: 'rejectReason',
    label: '驳回原因',
    max: 300
  })

  if (!['approved', 'rejected', 'pending'].includes(auditStatus)) {
    throw new HttpError(422, '审核状态不合法', { errors: { auditStatus: '可选值：approved / rejected' } })
  }

  const item = await prisma.item.findUnique({ where: { id }, include: itemInclude })
  if (!item) throw new HttpError(404, '未找到该信息')

  const updated = await prisma.item.update({
    where: { id },
    data: {
      auditStatus,
      rejectReason: auditStatus === 'rejected' ? rejectReason : '',
      auditedAt: auditStatus === 'pending' ? null : new Date()
    },
    include: itemInclude
  })

  await notify({
    userId: item.userId,
    type: 'audit',
    title:
      auditStatus === 'approved'
        ? '发布信息审核通过'
        : auditStatus === 'rejected'
          ? '发布信息审核未通过'
          : '发布信息已重新进入待审核',
    content:
      auditStatus === 'approved'
        ? `你发布的「${item.name}」已展示到失物大厅。`
        : auditStatus === 'rejected'
          ? rejectReason || '信息不完整，请修改后重新提交。'
          : `你发布的「${item.name}」已重新进入待审核队列。`,
    relatedId: item.id
  })

  await logAdminAction(req, {
    action:
      auditStatus === 'approved' ? '审核通过物品' : auditStatus === 'rejected' ? '驳回物品' : '重置为待审核',
    targetType: 'item',
    targetId: item.id,
    detail: rejectReason ? `「${item.name}」：${rejectReason}` : `「${item.name}」`
  })

  if (auditStatus === 'approved' && item.type === 'found') {
    const days = Number(item.retentionDays || 30)
    const expireAt = new Date(Date.now() + days * 86400000)
    await prisma.storageRecord.upsert({
      where: { itemId: item.id },
      update: {},
      create: {
        itemId: item.id,
        storageCode: item.storageCode || `LF-${String(item.id).padStart(6, '0')}`,
        storageLocation: `${item.location || '校园'} 服务点`,
        expireAt,
        disposalStatus: 'normal',
        remark: '审核通过后自动生成保管记录。'
      }
    })
  }

  res.json(serializeItem(updated))
}

router.put('/items/:id/audit', wrap(auditItem))
router.put('/lost-found/items/:id/audit', wrap(auditItem))

async function deleteAdminItem(req, res) {
  const id = assertId(req.params.id, '未找到该信息')

  const item = await prisma.item.findUnique({ where: { id } })
  if (!item) throw new HttpError(404, '未找到该信息')

  await prisma.item.delete({ where: { id } })
  await notify({
    userId: item.userId,
    type: 'audit',
    title: '发布信息已被管理员下架',
    content: `你发布的「${item.name}」因违规或信息错误已被下架。`,
    relatedId: item.id
  })

  await logAdminAction(req, {
    action: '下架物品',
    targetType: 'item',
    targetId: item.id,
    detail: `「${item.name}」`
  })

  res.json({ success: true, id })
}

router.delete('/items/:id', wrap(deleteAdminItem))
router.delete('/lost-found/items/:id', wrap(deleteAdminItem))

/* ============================== 认领审核 ============================== */

router.get(
  '/claims',
  wrap(async (req, res) => {
    const query = req.query || {}
    const { page, size, skip, take } = getPagination(query, 20)
    const where = {}

    const status = String(query.status || '').trim()
    if (status && status !== 'all') {
      const statuses = status.split(',').map(item => item.trim()).filter(Boolean)
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0]
    }

    const keyword = String(query.keyword || '').trim()
    if (keyword) {
      where.OR = [
        { claimantName: { contains: keyword } },
        { proofText: { contains: keyword } },
        { phone: { contains: keyword } },
        { item: { is: { name: { contains: keyword } } } }
      ]
    }

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

    res.json(paginated(list.map(serializeClaim), total, page, size))
  })
)

router.put(
  '/claims/:id/audit',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该申请')

    const payload = req.body || {}
    const action = String(payload.status ?? payload.action ?? '').trim().toLowerCase()
    const remark = optionalText(payload.auditRemark ?? payload.audit_reason ?? payload.reason, {
      field: 'auditRemark',
      label: '审核备注',
      max: 300
    })

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: { include: itemInclude } }
    })
    if (!claim) throw new HttpError(404, '未找到该申请')

    let status = 'pending'
    let progress = '待补充材料'
    let adminAudit = 'pending'

    if (['approved', 'approve'].includes(action)) {
      adminAudit = 'approved'
      if (claim.status === 'wrong_return_pending') {
        status = 'completed'
        progress = '已确认归还入库'
      } else {
        status = 'handover_pending'
        progress = '审核通过，等待交接'
      }
    } else if (['rejected', 'reject'].includes(action)) {
      adminAudit = 'rejected'
      status = 'rejected'
      progress = '审核驳回'
    } else if (['pending', 'supplement', 'need_more'].includes(action)) {
      status = 'pending'
      progress = '待补充材料'
    } else {
      throw new HttpError(422, '审核动作不合法', { errors: { status: '可选值：approved / rejected' } })
    }

    const now = new Date()
    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status,
        progress,
        adminAudit,
        auditRemark: remark,
        auditedAt: now,
        ...(status === 'completed' ? { completedAt: now, handoverStatus: 'returned' } : {})
      },
      include: { item: { include: itemInclude } }
    })

    if (status === 'handover_pending') {
      await prisma.item.update({ where: { id: claim.itemId }, data: { status: 'claiming' } })
    } else if (status === 'completed' && claim.status === 'wrong_return_pending') {
      await prisma.item.update({ where: { id: claim.itemId }, data: { status: 'open', completedAt: null } })
    }

    await notify({
      userId: claim.userId,
      type: 'claim',
      title:
        adminAudit === 'approved'
          ? claim.status === 'wrong_return_pending'
            ? '领错归还已确认'
            : '认领申请审核通过'
          : adminAudit === 'rejected'
            ? '认领申请已驳回'
            : '认领申请待补充材料',
      content:
        adminAudit === 'approved'
          ? claim.status === 'wrong_return_pending'
            ? '物品已重新入库，感谢你的配合。'
            : '请登录平台查看线下领取或邮寄交接安排。'
          : remark || (adminAudit === 'rejected' ? '物品细节不匹配或证明材料不足。' : '请补充更完整的物品特征或证明材料。'),
      relatedId: claim.id
    })

    await logAdminAction(req, {
      action: adminAudit === 'approved' ? '通过认领申请' : adminAudit === 'rejected' ? '驳回认领申请' : '要求补充材料',
      targetType: 'claim',
      targetId: claim.id,
      detail: `物品「${claim.item?.name || claim.itemId}」·申请人 ${claim.claimantName || claim.userId}${remark ? `·${remark}` : ''}`
    })

    res.json(serializeClaim(updated))
  })
)

/* ============================== 滞留物品 ============================== */

router.get(
  '/overdue-items',
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 20)
    const where = {}
    if (req.query.disposalStatus && req.query.disposalStatus !== 'all') {
      where.disposalStatus = String(req.query.disposalStatus)
    }

    const [total, list] = await Promise.all([
      prisma.storageRecord.count({ where }),
      prisma.storageRecord.findMany({
        where,
        include: { item: { include: itemInclude } },
        orderBy: { expireAt: 'asc' },
        skip,
        take
      })
    ])

    res.json(paginated(list.map(serializeStorage), total, page, size))
  })
)

router.put(
  '/overdue-items/:id/transfer',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该保管记录')

    const record = await prisma.storageRecord.findUnique({ where: { id } })
    if (!record) throw new HttpError(404, '未找到该保管记录')

    const target = requiredText(
      req.body?.handoverTarget ?? req.body?.handover_target ?? req.body?.target,
      { field: 'target', label: '移交去向', max: 100 }
    )
    if (record.disposalStatus === 'transferred') {
      throw new HttpError(409, '该保管记录已完成移交，请勿重复操作', {
        errors: { target: '已完成移交' }
      })
    }

    const updated = await prisma.storageRecord.update({
      where: { id },
      data: {
        disposalStatus: 'transferred',
        handoverTarget: target,
        handoverTime: new Date(),
        remark: optionalText(req.body?.remark, {
          field: 'remark',
          label: '备注',
          max: 300
        }) || record.remark
      },
      include: { item: { include: itemInclude } }
    })

    await logAdminAction(req, {
      action: '移交滞留物品',
      targetType: 'storage',
      targetId: record.id,
      detail: `物品「${record.item?.name || record.itemId}」→ ${target}`
    })

    res.json(serializeStorage(updated))
  })
)

/* ============================== 公告 ============================== */

router.get(
  '/announcements',
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 20)
    const where = {}
    if (req.query.status && req.query.status !== 'all') where.status = String(req.query.status)

    const [total, list] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take })
    ])

    res.json(paginated(list.map(serializeAnnouncement), total, page, size))
  })
)

router.post(
  '/announcements',
  wrap(async (req, res) => {
    const { title, content, status } = req.body || {}
    const safeTitle = requiredText(title, { field: 'title', label: '公告标题', max: 100 })
    const safeContent = requiredText(content, { field: 'content', label: '公告内容', max: 5000 })

    const announcement = await prisma.announcement.create({
      data: {
        title: safeTitle,
        content: safeContent,
        status: status === 'draft' ? 'draft' : 'published'
      }
    })

    if (announcement.status === 'published') {
      await notify({
        userId: null,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        relatedId: announcement.id
      })
    }

    await logAdminAction(req, {
      action: announcement.status === 'published' ? '发布公告' : '保存公告草稿',
      targetType: 'announcement',
      targetId: announcement.id,
      detail: announcement.title
    })

    res.status(201).json(serializeAnnouncement(announcement))
  })
)

/* ============================== 操作日志 / 维护任务 ============================== */

router.get(
  '/logs',
  wrap(async (req, res) => {
    const query = req.query || {}
    const { page, size, skip, take } = getPagination(query, 20)
    const where = {}

    const action = String(query.action || '').trim()
    if (action && action !== 'all') where.action = action

    const targetType = String(query.targetType || query.target_type || '').trim()
    if (targetType && targetType !== 'all') where.targetType = targetType

    const keyword = String(query.keyword || '').trim()
    if (keyword) {
      where.OR = [
        { adminName: { contains: keyword } },
        { action: { contains: keyword } },
        { detail: { contains: keyword } }
      ]
    }

    const [total, list] = await Promise.all([
      prisma.adminLog.count({ where }),
      prisma.adminLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take })
    ])

    res.json(paginated(list.map(serializeAdminLog), total, page, size))
  })
)

/** 手动触发一次逾期扫描（服务启动时和定时任务也会自动执行） */
router.post(
  '/maintenance/overdue-scan',
  wrap(async (req, res) => {
    const result = await runOverdueScan()

    await logAdminAction(req, {
      action: '触发逾期扫描',
      targetType: 'maintenance',
      detail: `扫描 ${result.scanned} 条，到期关闭 ${result.expired} 条，临期提醒 ${result.nearExpired} 条`
    })

    res.json({ success: true, ...result })
  })
)

/* ============================== 争议 ============================== */

router.get(
  '/disputes',
  wrap(async (req, res) => {
    const { page, size, skip, take } = getPagination(req.query, 20)
    const where = {}
    if (req.query.status && req.query.status !== 'all') where.status = String(req.query.status)

    const [total, list] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        include: { item: { include: itemInclude } },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    res.json(paginated(list.map(serializeDispute), total, page, size))
  })
)

router.post(
  '/disputes',
  wrap(async (req, res) => {
    const payload = req.body || {}
    const itemId = readId(payload.itemId ?? payload.item_id)
    const claimId = readId(payload.claimId ?? payload.claim_id)
    const reason = requiredText(payload.reason, { field: 'reason', label: '争议原因', max: 500 })

    let claimantName = optionalText(payload.claimantName, {
      field: 'claimantName',
      label: '申请人',
      max: 30
    })
    let claim = null
    if (claimId) {
      claim = await prisma.claim.findUnique({ where: { id: claimId } })
      if (claim) claimantName = claimantName || claim.claimantName
    }

    const dispute = await prisma.dispute.create({
      data: {
        itemId: itemId || claim?.itemId || null,
        claimId: claimId || null,
        claimantName,
        reason,
        status: 'processing'
      },
      include: { item: { include: itemInclude } }
    })

    res.status(201).json(serializeDispute(dispute))
  })
)

router.put(
  '/disputes/:id/resolve',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该争议')

    const result = requiredText(req.body?.result, { field: 'result', label: '处理结论', max: 500 })

    const updated = await prisma.dispute.update({
      where: { id },
      data: { status: 'resolved', result, resolvedAt: new Date() },
      include: { item: { include: itemInclude } }
    })

    await logAdminAction(req, {
      action: '处理争议',
      targetType: 'dispute',
      targetId: updated.id,
      detail: result
    })

    res.json(serializeDispute(updated))
  })
)

/* ============================== 风险用户 / 黑名单 ============================== */

async function listBlacklists(req, res) {
  const { page, size, skip, take } = getPagination(req.query, 20)
  const where = {}
  if (req.query.status && req.query.status !== 'all') where.status = String(req.query.status)
  if (req.query.level && req.query.level !== 'all') where.level = String(req.query.level)

  const [total, list] = await Promise.all([
    prisma.blacklist.count({ where }),
    prisma.blacklist.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    })
  ])

  res.json(paginated(list.map(serializeBlacklist), total, page, size))
}

router.get('/risk-users', wrap(listBlacklists))
router.get('/blacklists', wrap(listBlacklists))

router.post(
  '/risk-users/:id/blacklist',
  wrap(async (req, res) => {
    const userId = assertId(req.params.id, '未找到该用户')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new HttpError(404, '未找到该用户')

    const record = await prisma.blacklist.create({
      data: {
        userId,
        username: user.username,
        reason: optionalText(req.body?.reason, { field: 'reason', label: '限制原因', max: 200 }),
        level: req.body?.level === 'warning' ? 'warning' : 'blocked',
        limitType: ['publish', 'claim', 'all'].includes(req.body?.limitType ?? req.body?.limit_type)
          ? (req.body?.limitType ?? req.body?.limit_type)
          : 'all',
        expiresAt: parseDateTime(req.body?.expiresAt ?? req.body?.expires_at),
        status: 'active'
      },
      include: { user: true }
    })

    await logAdminAction(req, {
      action: '加入风险名单',
      targetType: 'blacklist',
      targetId: record.id,
      detail: `用户 ${user.username} · 限制 ${record.limitType}`
    })

    res.status(201).json(serializeBlacklist(record))
  })
)

router.post(
  '/risk-users/:id/remove-blacklist',
  wrap(async (req, res) => {
    const rawId = assertId(req.params.id, '未找到该记录')
    const releaseReason = optionalText(req.body?.releaseReason ?? req.body?.reason, {
      field: 'releaseReason',
      label: '解除原因',
      max: 200
    })

    // 兼容两种语义：传黑名单记录 id，或传用户 id
    const byRecord = await prisma.blacklist.findUnique({ where: { id: rawId } })
    const released = byRecord
      ? await prisma.blacklist.updateMany({
          where: { id: byRecord.id },
          data: { status: 'inactive', releaseReason }
        })
      : await prisma.blacklist.updateMany({
          where: { userId: rawId, status: 'active' },
          data: { status: 'inactive', releaseReason }
        })

    if (!released.count) throw new HttpError(404, '未找到生效中的限制记录')

    await logAdminAction(req, {
      action: '解除风险限制',
      targetType: 'blacklist',
      targetId: byRecord?.id ?? rawId,
      detail: releaseReason || `解除 ${released.count} 条限制`
    })

    res.json({ success: true, released: released.count })
  })
)

router.post(
  '/blacklists',
  wrap(async (req, res) => {
    const payload = req.body || {}
    const userId = readId(payload.userId ?? payload.user_id)
    if (!userId) throw new HttpError(422, '请选择用户', { errors: { userId: '请选择用户' } })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new HttpError(404, '未找到该用户')

    const record = await prisma.blacklist.create({
      data: {
        userId,
        username: user.username,
        reason: optionalText(payload.reason, { field: 'reason', label: '限制原因', max: 200 }),
        level: payload.level === 'warning' ? 'warning' : 'blocked',
        limitType: ['publish', 'claim', 'all'].includes(payload.limitType) ? payload.limitType : 'all',
        startedAt: parseDateTime(payload.startedAt) || new Date(),
        expiresAt: parseDateTime(payload.expiresAt),
        status: 'active'
      },
      include: { user: true }
    })

    res.status(201).json(serializeBlacklist(record))
  })
)

router.put(
  '/blacklists/:id/release',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该记录')
    const record = await prisma.blacklist.findUnique({ where: { id } })
    if (!record) throw new HttpError(404, '未找到该记录')

    const updated = await prisma.blacklist.update({
      where: { id },
      data: {
        status: 'inactive',
        releaseReason: optionalText(req.body?.releaseReason ?? req.body?.reason, {
          field: 'releaseReason',
          label: '解除原因',
          max: 200
        })
      },
      include: { user: true }
    })

    await logAdminAction(req, {
      action: '解除风险限制',
      targetType: 'blacklist',
      targetId: updated.id,
      detail: updated.releaseReason || `用户 ${updated.username || updated.userId}`
    })

    res.json(serializeBlacklist(updated))
  })
)

router.delete(
  '/blacklists/:id',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该记录')
    const record = await prisma.blacklist.findUnique({ where: { id } })
    if (!record) throw new HttpError(404, '未找到该记录')

    await prisma.blacklist.delete({ where: { id } })

    await logAdminAction(req, {
      action: '删除风险记录',
      targetType: 'blacklist',
      targetId: id,
      detail: record.username || `用户 ${record.userId}`
    })

    res.json({ success: true, id })
  })
)

/* ============================== 数据分析 ============================== */

router.get(
  '/analytics',
  wrap(async (req, res) => {
    const [items, claims, users] = await Promise.all([
      prisma.item.findMany(),
      prisma.claim.findMany(),
      prisma.user.findMany({ where: { role: { not: 'admin' } } })
    ])

    const now = Date.now()
    const recentStart = now - 7 * 86400000
    const activeUserIds = new Set()

    items.forEach(item => {
      if (item.createdAt.getTime() >= recentStart) activeUserIds.add(item.userId)
    })
    claims.forEach(claim => {
      if (claim.createdAt.getTime() >= recentStart) activeUserIds.add(claim.userId)
    })

    const approved = items.filter(item => item.auditStatus === 'approved')
    const successfulClaims = claims.filter(claim => claim.status === 'completed').length
    const recentPublished = items.filter(item => item.createdAt.getTime() >= recentStart).length

    const locationMap = new Map()
    approved.forEach(item => {
      if (!item.location) return
      locationMap.set(item.location, (locationMap.get(item.location) || 0) + 1)
    })

    const activeBlacklist = await prisma.blacklist.count({ where: { status: 'active' } })

    const totalItems = items.length
    const itemStatusStats = ITEM_STATUS_META.map(meta => {
      const value = items.filter(item => item.status === meta.status).length
      return {
        status: meta.status,
        name: meta.name,
        type: meta.type,
        value,
        percent: totalItems ? Math.round((value / totalItems) * 100) : 0
      }
    })

    const itemCountByDay = new Map()
    items.forEach(item => {
      const key = localDateKey(item.createdAt)
      itemCountByDay.set(key, (itemCountByDay.get(key) || 0) + 1)
    })
    const claimCountByDay = new Map()
    claims.forEach(claim => {
      const key = localDateKey(claim.createdAt)
      claimCountByDay.set(key, (claimCountByDay.get(key) || 0) + 1)
    })
    const dailyTrend = recentDateKeys(7).map(date => ({
      date,
      items: itemCountByDay.get(date) || 0,
      claims: claimCountByDay.get(date) || 0
    }))

    res.json({
      activeUsers: users.filter(user => activeUserIds.has(user.id)).length,
      successRate: claims.length ? Math.round((successfulClaims / claims.length) * 100) : 0,
      publishFrequency: `${(recentPublished / 7).toFixed(1)}/日`,
      riskUsers: activeBlacklist,
      hotLocations: [...locationMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      claimStages: [
        { name: '待审核', value: claims.filter(claim => claim.status === 'pending').length },
        {
          name: '待交接',
          value: claims.filter(claim => ['approved', 'handover_pending'].includes(claim.status)).length
        },
        { name: '已完成', value: successfulClaims },
        { name: '已驳回', value: claims.filter(claim => claim.status === 'rejected').length }
      ],
      itemStatusStats,
      dailyTrend
    })
  })
)

/* ============================== 用户 / 实名认证 ============================== */

router.get(
  '/users',
  wrap(async (req, res) => {
    const query = req.query || {}
    const { page, size, skip, take } = getPagination(query, 20)
    const where = { role: { not: 'admin' } }

    const keyword = String(query.keyword || '').trim()
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { studentNo: { contains: keyword } }
      ]
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          verifications: true,
          blacklists: { where: { status: 'active' } },
          claims: { select: { status: true } },
          items: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    const list = users.map(user => ({
      ...serializeUser(user),
      verification: user.verifications[0] ? serializeVerification(user.verifications[0]) : null,
      blacklist: user.blacklists[0] ? serializeBlacklist(user.blacklists[0]) : null,
      claimFailed: user.claims.filter(claim => claim.status === 'rejected').length,
      claimTotal: user.claims.length,
      publishTotal: user.items.length
    }))

    res.json(paginated(list, total, page, size))
  })
)

router.get(
  '/verifications',
  wrap(async (req, res) => {
    const query = req.query || {}
    const { page, size, skip, take } = getPagination(query, 20)
    const where = {}

    if (query.status && query.status !== 'all') where.status = String(query.status)
    if (query.level && query.level !== 'all') where.level = String(query.level)

    const keyword = String(query.keyword || '').trim()
    if (keyword) {
      where.OR = [
        { realName: { contains: keyword } },
        { studentNo: { contains: keyword } },
        { phone: { contains: keyword } },
        { user: { is: { email: { contains: keyword } } } }
      ]
    }

    const [total, list] = await Promise.all([
      prisma.verification.count({ where }),
      prisma.verification.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ])

    res.json(
      paginated(
        list.map(record => ({
          ...serializeVerification(record),
          username: record.user?.username || '',
          email: record.user?.email || ''
        })),
        total,
        page,
        size
      )
    )
  })
)

router.put(
  '/verifications/:id/audit',
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该认证申请')
    const payload = req.body || {}
    const status = String(payload.status || '').trim()

    if (!['approved', 'rejected'].includes(status)) {
      throw new HttpError(422, '审核状态不合法', { errors: { status: '可选值：approved / rejected' } })
    }

    const record = await prisma.verification.findUnique({ where: { id } })
    if (!record) throw new HttpError(404, '未找到该认证申请')

    const reason = optionalText(payload.rejectReason ?? payload.reject_reason, {
      field: 'rejectReason',
      label: '驳回原因',
      max: 300
    })
    const updated = await prisma.verification.update({
      where: { id },
      data: {
        status,
        rejectReason: status === 'rejected' ? reason : '',
        auditedAt: new Date()
      }
    })

    if (status === 'approved') {
      await prisma.user.update({
        where: { id: record.userId },
        data: { verificationLevel: record.level }
      })
    }

    await notify({
      userId: record.userId,
      type: 'security',
      title: status === 'approved' ? '实名认证审核通过' : '实名认证被驳回',
      content: status === 'approved' ? '你已解锁对应认领权限。' : reason || '认证信息不完整，请重新提交。',
      relatedId: record.id
    })

    await logAdminAction(req, {
      action: status === 'approved' ? '通过实名认证' : '驳回实名认证',
      targetType: 'verification',
      targetId: record.id,
      detail: `${record.realName || '未填写姓名'}${reason ? `·${reason}` : ''}`
    })

    res.json(serializeVerification(updated))
  })
)

export default router
