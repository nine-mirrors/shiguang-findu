import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { serializeClaim } from '../utils/serialize.js'
import { readId, optionalText } from '../utils/validate.js'

const router = Router()
const itemInclude = {
  category: true,
  user: { select: { id: true, username: true, avatar: true } }
}

router.post(
  '/',
  authenticate,
  requireAdmin,
  wrap(async (req, res) => {
    const payload = req.body || {}
    const claimId = readId(payload.claimId ?? payload.claim_id)
    if (!claimId) {
      throw new HttpError(422, '请选择认领申请', { errors: { claimId: '请选择认领申请' } })
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: { include: itemInclude } }
    })
    if (!claim) throw new HttpError(404, '未找到该申请')

    // 已完成的交接重复调用时直接返回，保持幂等
    if (claim.status === 'completed') {
      return res.json(serializeClaim(claim))
    }
    if (!['handover_pending', 'approved'].includes(claim.status)) {
      throw new HttpError(422, '当前申请状态不支持交接', { errors: { status: '请先通过认领审核' } })
    }

    const now = new Date()
    const updated = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'completed',
        progress: '已完成交接',
        handoverStatus: 'completed',
        handoverMethod: String(payload.method || claim.method || 'offline'),
        handoverRemark: optionalText(payload.remark, {
          field: 'remark',
          label: '交接备注',
          max: 300
        }),
        completedAt: now
      },
      include: { item: { include: itemInclude } }
    })

    await prisma.item.update({
      where: { id: claim.itemId },
      data: { status: 'done', completedAt: now }
    })

    await prisma.notification.create({
      data: {
        userId: claim.userId,
        type: 'claim',
        title: '物品交接已完成',
        content: `你关于「${claim.item?.name || '相关物品'}」的认领流程已完成。`,
        relatedId: claim.id
      }
    })

    res.status(201).json(serializeClaim(updated))
  })
)

export default router
