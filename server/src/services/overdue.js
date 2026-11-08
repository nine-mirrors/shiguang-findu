import { prisma } from '../db.js'

const DAY = 86400000
const REMIND_BEFORE_DAYS = 3
const TITLE_PREFIX = '保管期'

/**
 * 扫描招领物品的保管期：
 * 1. 已过期且仍在寻找中的，置为 overdue（关闭招领），并通知发布人及管理员跟进。
 * 2. 3 天内到期的，给出临期提醒，并把保管记录标记为 near_expired。
 *
 * 幂等：同一物品同一类提醒只发一次（按 userId + relatedId + 标题前缀去重），
 * 因此可以在服务启动时和定时任务里反复执行。
 */
export async function runOverdueScan({ now = new Date() } = {}) {
  const items = await prisma.item.findMany({
    where: {
      auditStatus: 'approved',
      type: 'found',
      status: 'open'
    },
    select: {
      id: true,
      userId: true,
      name: true,
      retentionDays: true,
      createdAt: true
    }
  })

  const result = { scanned: items.length, expired: 0, reminded: 0, nearExpired: 0 }

  const remind = async (item, title, content) => {
    const exists = await prisma.notification.findFirst({
      where: {
        userId: item.userId,
        relatedId: item.id,
        type: 'system',
        title: { startsWith: TITLE_PREFIX }
      },
      select: { id: true }
    })
    if (exists) return false

    await prisma.notification.create({
      data: { userId: item.userId, type: 'system', title, content, relatedId: item.id }
    })
    return true
  }

  for (const item of items) {
    const days = Number(item.retentionDays || 30)
    const expireAt = new Date(item.createdAt).getTime() + days * DAY
    const left = expireAt - now.getTime()

    if (left <= 0) {
      await prisma.item.update({
        where: { id: item.id },
        data: { status: 'overdue' }
      })
      await prisma.storageRecord.updateMany({
        where: { itemId: item.id },
        data: { disposalStatus: 'near_expired' }
      })

      const sent = await remind(
        item,
        '保管期已到期，招领信息已关闭',
        `你发布的招领「${item.name}」已超过 ${days} 天保管期，信息状态已自动置为“已关闭”。如物品仍在保管点，请及时联系管理员延长保管或安排移交。`
      )

      result.expired += 1
      if (sent) result.reminded += 1
      continue
    }

    if (left <= REMIND_BEFORE_DAYS * DAY) {
      await prisma.storageRecord.updateMany({
        where: { itemId: item.id, disposalStatus: 'normal' },
        data: { disposalStatus: 'near_expired' }
      })

      const sent = await remind(
        item,
        '保管期即将到期',
        `你发布的招领「${item.name}」将在 ${Math.max(1, Math.ceil(left / DAY))} 天后到达 ${days} 天保管期。请尽快跟进认领或联系管理员延长保管。`
      )

      result.nearExpired += 1
      if (sent) result.reminded += 1
    }
  }

  return result
}
