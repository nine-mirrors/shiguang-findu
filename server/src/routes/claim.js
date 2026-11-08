import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import {
  itemImageUpload,
  collectUploadedFiles,
  toPublicPath,
  assertImageFiles,
  removeUploadedFiles
} from '../middleware/upload.js'
import { HttpError, wrap } from '../utils/http.js'
import { serializeClaim } from '../utils/serialize.js'
import { findActiveBlacklist, blockedMessage } from '../utils/blacklist.js'
import { assertId, readId, optionalText, optionalPhone, optionalUrl } from '../utils/validate.js'

const router = Router()
const MAX_PROOF_IMAGES = 5
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

/**
 * 读取认领凭证图片地址列表。
 * 只接受服务端已落盘、可持久化的地址：blob: / data: 是浏览器临时 URL，
 * 存进数据库后必然失效，直接丢弃，避免历史上「凭证上传成功但详情空白」的问题。
 */
function readProofImages(value) {
  if (value === undefined || value === null || value === '') return []
  if (!Array.isArray(value)) {
    throw new HttpError(422, 'proofImages 必须是数组', { errors: { proofImages: '凭证格式不正确' } })
  }

  return value
    .map(item => String(item ?? '').trim())
    .filter(Boolean)
    .filter(url => !/^(blob:|data:)/i.test(url))
    .filter(url => url.length <= 300)
    .slice(0, MAX_PROOF_IMAGES)
}

/** 认领凭证图片上传：返回可直接写入 claims.proof_images 的相对地址 */
router.post(
  '/proofs',
  authenticate,
  itemImageUpload,
  wrap(async (req, res) => {
    const files = collectUploadedFiles(req)

    try {
      if (!files.length) {
        throw new HttpError(422, '请选择要上传的凭证图片', { errors: { images: '请选择图片' } })
      }

      assertImageFiles(files)

      const paths = files.map(toPublicPath).slice(0, MAX_PROOF_IMAGES)
      const base = `${req.protocol}://${req.get('host')}`

      res.status(201).json({
        images: paths,
        urls: paths.map(path => `${base}${path}`)
      })
    } catch (error) {
      removeUploadedFiles(files)
      throw error
    }
  })
)

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

    // 兼容三套字段名：method / pickupMethod / pickup_method；
    // 前端“邮寄”传的是 delivery，这里统一映射为库内的 mail。
    const methodRaw = String(
      payload.method ?? payload.pickupMethod ?? payload.pickup_method ?? 'offline'
    ).trim()
    const method = ['mail', 'delivery', 'express'].includes(methodRaw) ? 'mail' : 'offline'

    // clue（我有线索）是独立申请类型，不能落成 claim，否则管理端会把线索当认领去核验
    const typeRaw = String(payload.claimType ?? payload.claim_type ?? 'claim').trim()
    const claimType = typeRaw === 'wrong_return' ? 'wrong_return' : typeRaw === 'clue' ? 'clue' : 'claim'

    const proofText = optionalText(payload.proofText ?? payload.proof_text, {
      field: 'proofText',
      label: '证明材料',
      max: 1000
    })
    const proofImages = readProofImages(payload.proofImages ?? payload.proof_images)
    const proofImage =
      proofImages[0] ||
      optionalUrl(payload.proofImage ?? payload.proof_image, {
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
        proofImages: JSON.stringify(proofImages),
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
