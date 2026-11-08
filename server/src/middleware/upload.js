import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import { config } from '../config.js'
import { HttpError } from '../utils/http.js'

fs.mkdirSync(config.uploadDir, { recursive: true })

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
  }
})

const uploader = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 5, fields: 20 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    if (!ALLOWED_MIME.test(file.mimetype || '') || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new HttpError(422, '只允许上传 jpg / png / gif / webp 图片', { errors: { images: '图片格式不支持' } }))
    }
    cb(null, true)
  }
})

export const itemImageUpload = uploader.fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 5 },
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
])

export function collectUploadedFiles(req) {
  const groups = req.files || {}
  return Object.values(groups).flat()
}

export function toPublicPath(file) {
  return `/uploads/${path.basename(file.path)}`
}

export function removeUploadedFiles(files = []) {
  files.forEach(file => {
    try {
      fs.unlinkSync(file.path)
    } catch {
      // 文件可能已被清理，忽略
    }
  })
}

/** 读取文件头，确认确实是图片（防止伪造 Content-Type 上传任意文件） */
function looksLikeImage(filePath) {
  let fd
  try {
    fd = fs.openSync(filePath, 'r')
    const buffer = Buffer.alloc(12)
    const read = fs.readSync(fd, buffer, 0, 12, 0)
    if (read < 12) return false

    const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    const jpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    const gif = buffer.subarray(0, 4).toString('ascii') === 'GIF8'
    const webp =
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    return png || jpg || gif || webp
  } catch {
    return false
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}

/** 校验落盘文件的真实内容，发现非图片立即删除并抛出 422 */
export function assertImageFiles(files = []) {
  const invalid = files.filter(file => !looksLikeImage(file.path))
  if (invalid.length) {
    removeUploadedFiles(files)
    throw new HttpError(422, '上传的文件不是有效的图片', { errors: { images: '文件内容不是图片' } })
  }
}
