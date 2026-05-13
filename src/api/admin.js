export const getAdminDashboardApi = () => {
  return request.get('/api/admin/dashboard')
}

export const getAdminItemsApi = params => {
  return request.get('/api/admin/lost-found/items', {
    params
  })
}

export const auditAdminItemApi = (id, data) => {
  return request.put(`/api/admin/lost-found/items/${id}/audit`, {
    audit_status: data.auditStatus,
    reject_reason: data.rejectReason || ''
  })
}

export const getAdminClaimsApi = params => {
  return request.get('/api/admin/claims', {
    params
  })
}

export const auditAdminClaimApi = (id, data) => {
  return request.put(`/api/admin/claims/${id}/audit`, {
    status: data.status,
    remark: data.remark || ''
  })
}

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

export const getAdminOverdueItemsApi = params => {
  return request.get('/api/admin/overdue-items', {
    params
  })
}

export const transferOverdueItemApi = (id, data) => {
  return request.put(`/api/admin/overdue-items/${id}/transfer`, {
    target: data.target,
    remark: data.remark || ''
  })
}

export const getAnnouncementsApi = params => {
  return request.get('/api/announcements', {
    params
  })
}

export const createAnnouncementApi = data => {
  return request.post('/api/admin/announcements', {
    title: data.title,
    content: data.content,
    status: data.status || 'published'
  })
}

export const getDisputesApi = params => {
  return request.get('/api/admin/disputes', {
    params
  })
}

export const createDisputeApi = data => {
  return request.post('/api/admin/disputes', {
    item_id: data.itemId,
    claim_id: data.claimId,
    reason: data.reason,
    remark: data.remark || ''
  })
}

export const resolveDisputeApi = (id, data) => {
  return request.put(`/api/admin/disputes/${id}/resolve`, {
    result: data.result
  })
}

export const getAdminBlacklistsApi = params => {
  return request.get('/api/admin/blacklists', {
    params
  })
}

export const addAdminBlacklistApi = data => {
  return request.post('/api/admin/blacklists', {
    user_id: data.userId,
    reason: data.reason || '',
    limit_type: data.limitType || 'all'
  })
}

export const getAdminAnalyticsApi = () => {
  return request.get('/api/admin/analytics')
}

export const auditAdminVerificationApi = (id, data) => {
  return request.put(`/api/admin/verifications/${id}/audit`, {
    status: data.status,
    reject_reason: data.rejectReason || ''
  })
}


/**
 * 以下接口不是当前需求文档明确接口。
 * 暂时保留是为了避免页面 import 立刻报错。
 * 后续页面改完后，再统一删除或注释。
 */

// 非文档接口：需求文档没有 GET /api/admin/handover/claims
// export const getAdminHandoverClaimsApi = params => {
//   return request.get('/api/admin/handover/claims', {
//     params
//   })
// }

// 非文档接口：需求文档没有 POST /api/admin/handover/claims/{id}/complete
// 后续应改为 POST /api/handover-records
// export const completeHandoverApi = (id, data) => {
//   return request.post(`/api/admin/handover/claims/${id}/complete`, {
//     method: data.method,
//     remark: data.remark || ''
//   })
// }

// 非文档接口：需求文档没有 GET /api/admin/users
// 黑名单功能后续应优先使用 GET /api/admin/blacklists
// export const getAdminUsersApi = params => {
//   return request.get('/api/admin/users', {
//     params
//   })
// }

// 非文档接口：需求文档没有 POST /api/admin/risk-actions
// 黑名单功能后续应改为 POST /api/admin/blacklists
// export const createRiskActionApi = data => {
//   return request.post('/api/admin/risk-actions', {
//     action: data.action,
//     user_id: data.userId,
//     reason: data.reason || ''
//   })
// }

// 第二优先级缺口接口：当前先不新增后端
// 后续如果要做实名认证审核列表，再和后端确认是否补 GET /api/admin/verifications
// export const getAdminVerificationsApi = params => {
//   return request.get('/api/admin/verifications', {
//     params
//   })
// }