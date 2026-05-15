import request from './request'

/**
 * 第一优先级：获取通知列表
 * 文档接口：GET /api/notifications
 *
 * 用途：
 * - 通知中心页面展示系统消息
 * - 包括发布审核结果、认领状态变化、管理员提醒、平台公告等
 *
 * 注意：
 * - match 类型通知可以预留
 * - 正式自动匹配提醒属于第二优先级，第一阶段不强制实现
 */
export const getNotificationsApi = params => {
  return request.get('/api/notifications', {
    params
  })
}

/**
 * 第一优先级：标记单条通知已读
 * 文档接口：PUT /api/notifications/{id}/read
 *
 * 用途：
 * - 用户点击某条通知并查看详情后，将该通知标记为已读
 */
export const readNotificationApi = id => {
  return request.put(`/api/notifications/${id}/read`)
}

/**
 * 第一优先级：全部通知标记已读
 * 文档接口：PUT /api/notifications/read-all
 *
 * 用途：
 * - 通知中心一键清空未读状态
 */
export const readAllNotificationsApi = () => {
  return request.put('/api/notifications/read-all')
}