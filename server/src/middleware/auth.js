import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { HttpError } from '../utils/http.js'

function readToken(req) {
  const header = req.headers.authorization || ''
  if (!header.toLowerCase().startsWith('bearer ')) return ''
  return header.slice(7).trim()
}

async function resolveUser(token) {
  const payload = jwt.verify(token, config.jwtSecret)
  const id = Number(payload.sub)
  if (!Number.isFinite(id)) return null
  return prisma.user.findUnique({ where: { id } })
}

export async function authenticate(req, res, next) {
  try {
    const token = readToken(req)
    if (!token) throw new HttpError(401, '未登录或登录已过期')

    let user = null
    try {
      user = await resolveUser(token)
    } catch {
      throw new HttpError(401, '未登录或登录已过期')
    }

    if (!user) throw new HttpError(401, '未登录或登录已过期')
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export async function optionalAuthenticate(req, res, next) {
  try {
    const token = readToken(req)
    if (!token) return next()
    const user = await resolveUser(token).catch(() => null)
    if (user) req.user = user
    next()
  } catch {
    next()
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return next(new HttpError(401, '未登录或登录已过期'))
  if (req.user.role !== 'admin') return next(new HttpError(403, '当前账号没有操作权限'))
  next()
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  })
}
