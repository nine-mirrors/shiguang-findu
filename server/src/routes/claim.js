import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { serializeClaim } from '../utils/serialize.js'
import { findActiveBlacklist, blockedMessage } from '../utils/blacklist.js'
import { assertId, readId, optionalText, optionalPhone, optionalUrl } from '../utils/validate.js'

const router = Router()
const itemInclude = {
  category: true,
  user: { select: { id: true, username: true, avatar: true } }
}

const ACTIVE_CLAIM_STATUSES = ['pending', 'handover_pending', 'wrong_return_pending']

function computeScore({ proofImage, proofText }) {
  const base = proofImage ? 58 : 36
  const textScore = Math.min(34, String(proofText || '').length / 4)
  return Math.min(96, Math.round(base + textScore))
}

router.post(
  '/',
  authenticate,
  wrap(async (req, res) => {
    const payload = req.body || {}
    const itemId = readId(payload.itemId ?? payload.item_id)

    if (!itemId) {
      throw new HttpError(422, '请选择要认领的物品', { errors: { itemId: '请选择物品' } })
    }

    const blocked = await findActiveBlacklist(req.user.id, 'claim')
    if (blocked) {
      throw new HttpError(403, blockedMessage(blocked), { code: 'user_blocked', blocked: true })
    }

    const item = await prisma.item.findUnique({ where: { id: itemId }, include: itemInclude })
    if (!item || item.auditStatus !== 'approved') throw new HttpError(404, '未找到该信息')

    if (item.userId === req.user.id) {
      throw new HttpError(422, '不能认领自己发布的信息', { errors: { itemId: '不能认领自己发布的信息' } })
    }
    if (['done', 'overdue'].includes(item.status)) {
      throw new HttpError(422, '该物品已结束招领，无法提交申请', { errors: { itemId: '该物品已结束招领' } })
    }

    const duplicated = await prisma.claim.findFirst({
      where: { itemId, userId: req.user.id, status: { in: ACTIVE_CLAIM_STATUSES } }
    })
    if (duplicated) {
      throw new HttpError(409, '你已提交过该物品的申请，请等待审核', {
        errors: { itemId: '请勿重复提交' }
      })
    }

    const method = payload.method === 'mail' ? 'mail' : 'offline'
    const claimType = payload.claimType === 'wrong_return' ? 'wrong_return' : 'claim'
    const proofText = optionalText(payload.proofText ?? payload.proof_text, {
      field: 'proofText',
      label: '证明材料',
      max: 1000
    })
    const proofImage = optionalUrl(payload.proofImage ?? payload.proof_image, {
      field: 'proofImage',
      label: '证明图片',
      max: 300
    })
    const phone = optionalPhone(payload.phone)
    const deliveryAddress =
      method === 'mail'
        ? optionalText(payload.deliveryAddress ?? payload.delivery_address, {
            field: 'deliveryAddress',
            label: '收货地址',
            max: 200
          })
        : ''

    if (method === 'mail' && !deliveryAddress) {
      throw new HttpError(422, '邮寄认领请填写收货地址', {
        errors: { deliveryAddress: '请填写收货地址' }
      })
    }

    const claim = await prisma.claim.create({
      data: {
        itemId,
        userId: req.user.id,
        claimantName: req.user.username,
        claimType,
        method,
        proofText,
        proofImage,
        deliveryAddress,
        phone,
        status: 'pending',
        progress: '待审核',
        ownerAudit: 'pending',
        adminAudit: 'pending',
        handoverStatus: 'waiting',
        score: computeScore({ proofImage, proofText })
      },
      include: { item: { include: itemInclude } }
    })

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'claim',
        title: '认领申请已提交',
        content: `你对「${item.name}」提交的申请已进入审核流程。`,
        relatedId: claim.id
      }
    })

    res.status(201).json(serializeClaim(claim, { self: true }))
  })
)

router.put(
  '/:id/return-wrong',
  authenticate,
  wrap(async (req, res) => {
    const id = assertId(req.params.id, '未找到该申请')

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: { include: itemInclude } }
    })
    if (!claim) throw new HttpError(404, '未找到该申请')
    if (req.user.role !== 'admin' && claim.userId !== req.user.id) {
      throw new HttpError(403, '当前账号没有操作权限')
    }
    if (claim.status === 'wrong_return_pending') {
      throw new HttpError(409, '该申请已在领错归还审核中', { errors: { status: '请等待管理员处理' } })
    }
    if (claim.status !== 'completed') {
      throw new HttpError(422, '只有已完成交接的认领才能发起领错归还', {
        errors: { status: '当前状态不支持领错归还' }
      })
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: 'wrong_return_pending',
        progress: '领错归还待审核',
        wrongReturnReason: optionalText(req.body?.reason, {
          field: 'reason',
          label: '归还原因',
          max: 300
        })
      },
      include: { item: { include: itemInclude } }
    })

    res.json(serializeClaim(updated, { self: claim.userId === req.user.id }))
  })
)

export default router
