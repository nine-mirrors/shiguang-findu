import request from './request'

/**
 * 第一优先级：管理员后台首页统计
 * 文档接口：GET /api/admin/dashboard
 * 用途：管理员进入后台后的总览数据，如待审核信息、待核验认领、通知待处理等。
 */
export const getAdminDashboardApi = () => {
  return request.get('/api/admin/dashboard')
}

/**
 * 第一优先级：管理员获取发布信息审核列表
 * 文档接口：GET /api/admin/lost-found/items
 * 用途：内容审核页，查看用户提交的失物 / 招领信息。
 */
export const getAdminItemsApi = params => {
  return request.get('/api/admin/lost-found/items', {
    params
  })
}

/**
 * 第一优先级：管理员审核发布信息
 * 文档接口：PUT /api/admin/lost-found/items/{id}/audit
 * 用途：通过或驳回用户发布的失物 / 招领信息。
 *
 * 字段：
 * - audit_status：approved / rejected
 * - reject_reason：驳回原因
 */
export const auditAdminItemApi = (id, data) => {
  return request.put(`/api/admin/lost-found/items/${id}/audit`, {
    audit_status: data.auditStatus,
    reject_reason: data.rejectReason || ''
  })
}

/**
 * 第一优先级：管理员删除发布信息
 * 文档接口：DELETE /api/admin/lost-found/items/{id}
 * 用途：管理员删除违规、重复或错误的失物 / 招领信息。
 */
export const deleteAdminItemApi = id => {
  return request.delete(`/api/admin/lost-found/items/${id}`)
}

/**
 * 第一优先级：管理员获取认领申请列表
 * 文档接口：GET /api/admin/claims
 * 用途：认领审核页，查看用户提交的认领申请、线索说明和归还说明。
 */
export const getAdminClaimsApi = params => {
  return request.get('/api/admin/claims', {
    params
  })
}

/**
 * 第一优先级：管理员审核认领申请
 * 文档接口：PUT /api/admin/claims/{id}/audit
 * 用途：通过或驳回认领申请。
 *
 * 字段：
 * - status：approved / rejected
 * - audit_reason：审核意见 / 驳回原因
 */
export const auditAdminClaimApi = (id, data) => {
  return request.put(`/api/admin/claims/${id}/audit`, {
    action: data.status,
    audit_reason: data.auditReason || ''
  })
}

/**
 * 第二优先级：创建交接记录
 * 文档接口：POST /api/handover-records
 * 用途：管理员完成线下 / 邮寄交接后生成交接记录。
 */
export const createHandoverRecordApi = data => {
  return request.post('/api/handover-records', {
    claim_id: data.claimId,
    item_id: data.itemId,
    method: data.method,
    photo_url: data.photoUrl || '',
    signature_url: data.signatureUrl || '',
    remark: data.remark || ''
  })
}

/**
 * 第二优先级：获取滞留物品列表
 * 文档接口：GET /api/admin/overdue-items
 * 用途：管理员查看超过保管期或临近到期的物品。
 */
export const getAdminOverdueItemsApi = params => {
  return request.get('/api/admin/overdue-items', {
    params
  })
}

/**
 * 第二优先级：移交滞留物品
 * 文档接口：PUT /api/admin/overdue-items/{id}/transfer
 * 用途：管理员登记滞留物品移交去向。
 *
 * 字段：
 * - handover_target：移交对象
 * - remark：移交备注
 */
export const transferOverdueItemApi = (id, data) => {
  return request.put(`/api/admin/overdue-items/${id}/transfer`, {
    handover_target: data.handoverTarget || data.target,
    remark: data.remark || ''
  })
}

/**
 * 第二优先级：获取公告列表
 * 文档接口：GET /api/announcements
 * 用途：获取平台公告，公开接口。
 */
export const getAnnouncementsApi = params => {
  return request.get('/api/announcements', {
    params
  })
}

/**
 * 第二优先级：管理员发布公告
 * 文档接口：POST /api/admin/announcements
 * 用途：管理员发布平台公告、安全提醒、规则说明。
 */
export const createAnnouncementApi = data => {
  return request.post('/api/admin/announcements', {
    title: data.title,
    content: data.content,
    status: data.status || 'published'
  })
}

/**
 * 第二优先级：获取争议列表
 * 文档接口：GET /api/admin/disputes
 * 用途：管理员查看认领纠纷、领错归还等争议记录。
 */
export const getDisputesApi = params => {
  return request.get('/api/admin/disputes', {
    params
  })
}

/**
 * 第二优先级：创建争议记录
 * 文档接口：POST /api/admin/disputes
 * 用途：管理员登记争议原因。
 */
export const createDisputeApi = data => {
  return request.post('/api/admin/disputes', {
    item_id: data.itemId,
    claim_id: data.claimId,
    reason: data.reason
  })
}

/**
 * 第二优先级：处理争议
 * 文档接口：PUT /api/admin/disputes/{id}/resolve
 * 用途：管理员填写争议处理结论。
 */
export const resolveDisputeApi = (id, data) => {
  return request.put(`/api/admin/disputes/${id}/resolve`, {
    result: data.result
  })
}

/**
 * 第二优先级：获取黑名单列表
 * 文档接口：GET /api/admin/blacklists
 * 用途：管理员查看被限制的异常用户。
 */
export const getAdminBlacklistsApi = params => {
  return request.get('/api/admin/blacklists', {
    params
  })
}

/**
 * 第二优先级：添加黑名单
 * 文档接口：POST /api/admin/blacklists
 * 用途：限制恶意发布、频繁认领失败、疑似冒领等异常用户。
 *
 * 字段：
 * - user_id：用户 ID
 * - reason：限制原因
 * - limit_type：publish / claim / all
 * - started_at：限制开始时间，不传则后端默认当前时间
 * - expires_at：限制到期时间，null 表示长期限制
 */
export const addAdminBlacklistApi = data => {
  return request.post('/api/admin/blacklists', {
    user_id: data.userId,
    reason: data.reason || '',
    limit_type: data.limitType || 'all',
    started_at: data.startedAt || '',
    expires_at: data.expiresAt || null
  })
}

/**
 * 第二优先级：解除黑名单限制
 * 文档接口：PUT /api/admin/blacklists/{id}/release
 *
 * 用途：
 * - 管理员解除某条黑名单限制
 * - 不删除原记录，只把状态改为 inactive
 *
 * 字段：
 * - release_reason：解除原因
 */
export const releaseAdminBlacklistApi = (id, data) => {
  return request.put(`/api/admin/blacklists/${id}/release`, {
    release_reason: data.releaseReason || ''
  })
}

/**
 * 第二优先级：删除黑名单记录
 * 文档接口：DELETE /api/admin/blacklists/{id}
 *
 * 用途：
 * - 删除误添加、测试误加或重复添加的黑名单记录
 * - 正常解除限制请使用 release 接口
 */
export const deleteAdminBlacklistApi = id => {
  return request.delete(`/api/admin/blacklists/${id}`)
}

/**
 * 第二优先级：管理员获取实名认证申请列表
 * 文档接口：GET /api/admin/verifications
 *
 * 查询参数：
 * - page
 * - page_size
 * - status：pending / approved / rejected
 * - level：basic / full
 * - keyword：真实姓名 / 学号 / 手机号 / 邮箱
 */
export const getAdminVerificationsApi = params => {
  return request.get('/api/admin/verifications', {
    params
  })
}

/**
 * 第二优先级：管理员审核实名认证申请
 * 文档接口：PUT /api/admin/verifications/{id}/audit
 *
 * 字段：
 * - status：approved / rejected
 * - reject_reason：驳回原因
 */
export const auditAdminVerificationApi = (id, data) => {
  return request.put(`/api/admin/verifications/${id}/audit`, {
    status: data.status,
    reject_reason: data.rejectReason || ''
  })
}

/**
 * 第二优先级：管理员数据分析
 * 文档接口：GET /api/admin/analytics
 *
 * 用途：
 * - 展示活跃用户
 * - 成功找回率
 * - 发布频率
 * - 风险用户数量
 * - 高频丢失地点
 * - 认领阶段统计
 *
 * 注意：
 * 该接口需要后端实现。如果后端暂未实现，数据分析页会收到 404。
 */
export const getAdminAnalyticsApi = () => {
  return request.get('/api/admin/analytics')
}

/**
 * 第二优先级：管理员获取用户列表（用于黑名单添加时搜索用户）
 * 文档接口：GET /api/admin/users
 *
 * 用途：
 * - 管理员在添加黑名单时搜索并选择目标用户
 * - 支持按用户名、邮箱、学号模糊搜索
 *
 * 查询参数：
 * - keyword：搜索关键词（可选），支持模糊匹配 username / email / student_no
 * - page：页码，默认 1
 * - page_size：每页数量，默认 20
 *
 * 响应字段（每个用户）：
 * - id：用户 ID（数字）
 * - username：用户名
 * - email：邮箱
 * - phone：手机号
 * - role：角色（只返回 student，不返回 admin）
 * - verification_level：认证等级（none / basic / full）
 * - avatar：头像 URL
 * - student_no：学号（如有）
 *
 * 注意：
 * - 只返回 role = student 的普通用户，不返回管理员
 * - keyword 为空时返回所有普通用户（分页）
 */
export const getAdminUsersApi = params => {
  return request.get('/api/admin/users', {
    params
  })
}

/**
 * 管理员操作日志
 * 接口：GET /api/admin/logs
 * 参数：page / page_size / keyword / targetType
 */
export const getAdminLogsApi = params => {
  return request.get('/api/admin/logs', { params })
}

/**
 * 手动触发逾期扫描
 * 接口：POST /api/admin/maintenance/overdue-scan
 */
export const triggerOverdueScanApi = () => {
  return request.post('/api/admin/maintenance/overdue-scan')
}