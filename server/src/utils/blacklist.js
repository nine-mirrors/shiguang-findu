import { prisma } from '../db.js'

/** 判断用户是否存在生效中的限制记录 */
export async function findActiveBlacklist(userId, action = 'all') {
  if (!userId) return null
  const records = await prisma.blacklist.findMany({
    where: { userId: Number(userId), status: 'active' }
  })
  const now = Date.now()
  return (
    records.find(record => {
      if (record.expiresAt && record.expiresAt.getTime() < now) return false
      if (!['blocked', 'all'].includes(record.level)) return false
      if (record.limitType === 'all') return true
      return action === 'all' || record.limitType === action
    }) || null
  )
}

export function blockedMessage(record) {
  if (record?.limitType === 'publish') return '当前账号已被限制发布，请联系管理员'
  if (record?.limitType === 'claim') return '当前账号已被限制认领，请联系管理员'
  return '当前账号已被限制操作，请联系管理员'
}
