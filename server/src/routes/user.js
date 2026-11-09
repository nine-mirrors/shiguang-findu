import { Router } from 'express'
import { prisma } from '../db.js'
import { authenticate } from '../middleware/auth.js'
import {
  avatarUpload,
  collectUploadedFiles,
  toPublicPath,
  assertImageFiles,
  removeUploadedFiles,
  removePublicFile
} from '../middleware/upload.js'
import { HttpError, wrap } from '../utils/http.js'
import { serializeUser } from '../utils/serialize.js'
import {
  requiredText,
  optionalUrl,
  optionalPhone,
  optionalStudentNo
} from '../utils/validate.js'

const router = Router()

router.get(
  '/profile',
  authenticate,
  wrap(async (req, res) => {
    res.json(serializeUser(req.user, { self: true }))
  })
)

/** 上传头像：multipart 字段名 file，只允许图片；成功后清理旧头像文件 */
router.post(
  '/avatar',
  authenticate,
  avatarUpload,
  wrap(async (req, res) => {
    const files = collectUploadedFiles(req)

    try {
      const targetId = String(req.body?.userId ?? '').trim()
      if (targetId && targetId !== String(req.user.id)) {
        throw new HttpError(403, '只能修改自己的头像')
      }

      const file = files[0]
      if (!file) {
        throw new HttpError(422, '请选择要上传的头像图片', { errors: { file: '请选择头像图片' } })
      }

      assertImageFiles(files)

      const avatar = toPublicPath(file)
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatar }
      })

      removePublicFile(req.user.avatar)

      res.json({ avatar, user: serializeUser(user, { self: true }) })
    } catch (error) {
      removeUploadedFiles(files)
      throw error
    }
  })
)

router.put(
  '/profile',
  authenticate,
  wrap(async (req, res) => {
    const { username, avatar, phone, studentNo } = req.body || {}
    const data = {}

    if (username !== undefined) {
      data.username = requiredText(username, {
        field: 'username',
        label: '用户名',
        min: 2,
        max: 20
      })
    }
    if (avatar !== undefined) {
      data.avatar = optionalUrl(avatar, { field: 'avatar', label: '头像地址', max: 300 })
    }
    if (phone !== undefined) data.phone = optionalPhone(phone)
    if (studentNo !== undefined) data.studentNo = optionalStudentNo(studentNo)

    if (!Object.keys(data).length) {
      throw new HttpError(422, '没有需要更新的字段', { errors: { body: '没有需要更新的字段' } })
    }

    const user = await prisma.user.update({ where: { id: req.user.id }, data })
    res.json(serializeUser(user, { self: true }))
  })
)

export default router
