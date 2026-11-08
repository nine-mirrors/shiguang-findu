import { HttpError } from '../utils/http.js'
import { config } from '../config.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ message: '接口不存在' })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, ...error.extra })
  }

  if (error?.code === 'P2002') {
    const fields = error.meta?.target
    return res.status(409).json({
      message: Array.isArray(fields) && fields.length ? `数据重复：${fields.join(', ')}` : '数据已存在'
    })
  }

  if (error?.code === 'P2025') {
    return res.status(404).json({ message: '记录不存在' })
  }

  if (error?.code === 'P2003') {
    return res.status(422).json({ message: '关联数据不存在' })
  }

  // Prisma 参数类型不合法（如 NaN、超范围），属于请求问题而非服务器故障
  if (error?.name === 'PrismaClientValidationError') {
    return res.status(400).json({ message: '请求参数不合法' })
  }

  if (error?.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: `图片体积超出限制（单张最大 ${config.maxUploadBytes / 1024 / 1024}MB）`
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(422).json({ message: '最多只能上传 5 张图片，且字段名需为 images / files / file / image' })
    }
    return res.status(422).json({ message: `上传失败：${error.message}` })
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: '请求体不是合法 JSON' })
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ message: '请求体过大' })
  }

  console.error('[findu] 未捕获异常:', error)
  return res.status(500).json({ message: '服务器异常，请稍后再试' })
}
