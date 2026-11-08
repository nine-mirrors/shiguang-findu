import { prisma } from '../db.js'

/**
 * 管理员操作日志
 *
 * 设计约束：
 * - 日志写入失败不能影响管理操作本身，因此内部吞掉异常，只打 warn。
 * - action 直接存中文短语，管理端日志列表零映射即可展示。
 * - detail 限制 500 字，避免把整段驳回理由塞进日志表。
 */
export async function logAdminAction(req, { action, targetType = '', targetId = null, detail = '' }) {
  try {
    const numericId = targetId === null || targetId === undefined ? null : Number(targetId)

    await prisma.adminLog.create({
      data: {
        userId: req.user?.id ?? null,
        adminName: req.user?.username || '管理员',
        action: String(action || '未知操作').slice(0, 30),
        targetType: String(targetType || '').slice(0, 20),
        targetId: Number.isFinite(numericId) ? numericId : null,
        detail: String(detail || '').slice(0, 500)
      }
    })
  } catch (error) {
    console.warn('[findu] 管理员操作日志写入失败:', error.message)
  }
}
