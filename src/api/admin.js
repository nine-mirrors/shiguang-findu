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
 * 用途：管理员删除违规或重复的失物 / 招领信息。
 */
export const deleteAdminItemApi = id => {
  return request.delete(`/api/admin/lost-found/items/${id}`)
}

/**
 * 第一优先级：管理员获取认领申请列表
 * 文档接口：GET /api/admin/claims
 * 用途：认领审核页，查看用户提交的认领申请和线索说明。
 *
 * 注意：
 * 第一优先级只处理 claim / clue。
 * wrong_return 属于第二优先级“领错归还”，不要混进第一阶段认领审核。
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
    status: data.status,
    audit_reason: data.auditReason || ''
  })
}

/**
 * 第二优先级：创建交接记录
 * 文档接口：POST /api/handover-records
 * 用途：管理员完成线下 / 邮寄交接后生成交接记录。
 *
 * 注意：
 * 工作人员职责已经并入 admin，不再单独使用 staff 角色。
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
 */
export const addAdminBlacklistApi = data => {
  return request.post('/api/admin/blacklists', {
    user_id: data.userId,
    reason: data.reason || '',
    limit_type: data.limitType || 'all'
  })
}

/**
 * 第二优先级：管理员数据分析
 * 文档接口：GET /api/admin/analytics
 * 用途：展示类别统计、地点统计、成功率、热点区域等运营数据。
 */
export const getAdminAnalyticsApi = () => {
  return request.get('/api/admin/analytics')
}

/**
 * 第二优先级：管理员审核实名认证
 * 文档接口：PUT /api/admin/verifications/{id}/audit
 * 用途：审核某一条实名认证申请。
 *
 * 注意：
 * 当前阶段不新增 GET /api/admin/verifications。
 * 所以这个接口可以保留，但页面不主动接认证申请列表。
 */
export const auditAdminVerificationApi = (id, data) => {
  return request.put(`/api/admin/verifications/${id}/audit`, {
    status: data.status,
    reject_reason: data.rejectReason || ''
  })
}

/**
 * 停用接口：以下接口不是当前 V2.9 需求文档明确接口。
 * 当前只保留注释说明，避免后续误接。
 */

/**
 * 停用原因：
 * 需求文档没有 GET /api/admin/handover/claims。
 *
 * 替代方案：
 * 使用第一优先级接口 GET /api/admin/claims 获取认领申请列表，
 * 前端筛选 status 为 approved / handover_pending 的记录作为待交接队列。
 */
// export const getAdminHandoverClaimsApi = params => {
//   return request.get('/api/admin/handover/claims', {
//     params
//   })
// }

/**
 * 停用原因：
 * 需求文档没有 POST /api/admin/handover/claims/{id}/complete。
 *
 * 替代方案：
 * 使用第二优先级接口 POST /api/handover-records 创建交接记录。
 */
// export const completeHandoverApi = (id, data) => {
//   return request.post(`/api/admin/handover/claims/${id}/complete`, {
//     method: data.method,
//     remark: data.remark || ''
//   })
// }

/**
 * 停用原因：
 * 需求文档没有 GET /api/admin/users。
 *
 * 替代方案：
 * 当前阶段不做管理员用户列表。
 * 黑名单管理直接使用 GET /api/admin/blacklists 和 POST /api/admin/blacklists。
 */
// export const getAdminUsersApi = params => {
//   return request.get('/api/admin/users', {
//     params
//   })
// }

/**
 * 停用原因：
 * 需求文档没有 POST /api/admin/risk-actions。
 *
 * 替代方案：
 * 使用第二优先级接口 POST /api/admin/blacklists。
 */
// export const createRiskActionApi = data => {
//   return request.post('/api/admin/risk-actions', {
//     action: data.action,
//     user_id: data.userId,
//     reason: data.reason || ''
//   })
// }

/**
 * 第二优先级缺口接口：当前不新增。
 *
 * 停用原因：
 * 需求文档只有 PUT /api/admin/verifications/{id}/audit，
 * 没有明确写 GET /api/admin/verifications。
 *
 * 当前策略：
 * 实名认证审核作为第二优先级预留能力，
 * 暂不向后端新增认证申请列表接口。
 */
// export const getAdminVerificationsApi = params => {
//   return request.get('/api/admin/verifications', {
//     params
//   })
// }