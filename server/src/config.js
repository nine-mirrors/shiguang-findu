import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = path.resolve(__dirname, '..')

const parseOrigins = value => {
  const raw = String(value || '*').trim()
  if (raw === '*') return '*'
  return raw.split(',').map(item => item.trim()).filter(Boolean)
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  jwtSecret: process.env.JWT_SECRET || 'findu-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: path.resolve(ROOT_DIR, process.env.UPLOAD_DIR || 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024,
  emailCodeDev: process.env.EMAIL_CODE_DEV || '123456'
}

export const isDev = config.nodeEnv !== 'production'
