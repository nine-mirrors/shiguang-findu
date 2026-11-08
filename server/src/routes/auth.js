import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db.js'
import { config, isDev } from '../config.js'
import { signToken } from '../middleware/auth.js'
import { HttpError, wrap } from '../utils/http.js'
import { serializeUser } from '../utils/serialize.js'
import {
  assertEmail,
  assertPassword,
  requiredText,
  optionalUrl
} from '../utils/validate.js'

const router = Router()

// 演示环境的邮箱验证码存放在内存中，5 分钟有效
const emailCodes = new Map()
const EMAIL_CODE_TTL = 5 * 60 * 1000

function verifyEmailCode(email, code) {
  const key = String(email || '').toLowerCase()
  const record = emailCodes.get(key)

  if (record && record.expiresAt > Date.now() && record.code === String(code || '')) {
    emailCodes.delete(key)
    return true
  }

  // 演示模式允许使用固定验证码，便于零配置联调
  if (isDev && String(code || '') === config.emailCodeDev) return true

  throw new HttpError(422, '邮箱验证码错误', { errors: { emailCode: '邮箱验证码错误' } })
}

router.post(
  '/register',
  wrap(async (req, res) => {
    const payload = req.body || {}
    const emailCode = payload.emailCode ?? payload.email_code

    const safeUsername = requiredText(payload.username, {
      field: 'username',
      label: '用户名',
      min: 2,
      max: 20
    })
    const safeEmail = assertEmail(payload.email)
    const password = assertPassword(payload.password)
    const avatar = optionalUrl(payload.avatar, { field: 'avatar', label: '头像地址', max: 300 })

    verifyEmailCode(safeEmail, emailCode)

    const exists = await prisma.user.findUnique({ where: { email: safeEmail } })
    if (exists) {
      throw new HttpError(409, '该邮箱已注册', { errors: { email: '该邮箱已注册' } })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username: safeUsername,
        email: safeEmail,
        password: hashed,
        role: 'student',
        avatar,
        verificationLevel: 'basic'
      }
    })

    res.status(201).json({ token: signToken(user), user: serializeUser(user, { self: true }) })
  })
)

router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body || {}
    const safeEmail = String(email || '').trim().toLowerCase()

    if (!safeEmail || !password) {
      throw new HttpError(422, '请输入邮箱和密码', { errors: { email: '请输入邮箱和密码' } })
    }

    const user = await prisma.user.findUnique({ where: { email: safeEmail } })
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      throw new HttpError(401, '邮箱或密码错误')
    }

    res.json({ token: signToken(user), user: serializeUser(user, { self: true }) })
  })
)

router.post(
  '/send-email-code',
  wrap(async (req, res) => {
    const payload = req.body || {}
    const email = assertEmail(payload.email)
    const type = ['register', 'reset'].includes(payload.type) ? payload.type : 'register'

    const code = String(Math.floor(100000 + Math.random() * 900000))
    emailCodes.set(email, { code, expiresAt: Date.now() + EMAIL_CODE_TTL })

    console.log(`[findu] 邮箱验证码 ${email} -> ${code}`)

    res.json({
      email,
      type,
      message: '验证码已发送，5 分钟内有效',
      ...(isDev ? { devCode: code } : {})
    })
  })
)

router.post(
  '/logout',
  wrap(async (req, res) => {
    // JWT 无状态，登出由前端清除 token 即可
    res.json({ success: true })
  })
)

export default router
