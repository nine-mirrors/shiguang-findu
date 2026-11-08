import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { serializeVerification } from '../utils/serialize.js'
import { requiredText, optionalPhone, optionalStudentNo } from '../utils/validate.js'

const router = Router()

async function readVerification(req, res) {
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
}

router.get('/', authenticate, wrap(readVerification))

router.post(
  '/',
  authenticate,
  wrap(async (req, res) => {
    const payload = req.body || {}

    const realName = requiredText(payload.realName ?? payload.real_name, {
      field: 'realName',
      label: '真实姓名',
      min: 2,
      max: 30
    })
    const studentNo = optionalStudentNo(payload.studentNo ?? payload.student_no, 'studentNo')
    if (!studentNo) {
      throw new HttpError(422, '请填写学号', { errors: { studentNo: '请填写学号' } })
    }
    const phone = optionalPhone(payload.phone)
    const level = payload.level === 'full' ? 'full' : 'basic'

    const record = await prisma.verification.upsert({
      where: { userId: req.user.id },
      update: {
        level,
        realName,
        studentNo,
        phone,
        status: 'pending',
        rejectReason: '',
        auditedAt: null
      },
      create: {
        userId: req.user.id,
        level,
        realName,
        studentNo,
        phone,
        status: 'pending'
      }
    })

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'security',
        title: '实名认证申请已提交',
        content: '工作人员审核后会通过站内消息提醒你。',
        relatedId: record.id
      }
    })

    res.status(201).json(serializeVerification(record, { self: true }))
  })
)

export default router
