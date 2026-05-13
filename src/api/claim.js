import request from './request'

/**
 * 第一优先级：提交认领 / 线索 / 领错归还申请
 * 文档接口：POST /api/claims
 *
 * 默认方案：JSON 版
 *
 * 适用情况：
 * - 后端 proof_images 字段按 json 处理
 * - 前端传图片 URL / base64 / 已上传后的图片地址数组
 * - 当前需求文档 claim_requests 表中 proof_images 类型为 json
 *
 * 注意：
 * 如果后端要接收真实 File 文件，请改用下面注释的 multipart/form-data 版。
 */
export const createClaimApi = data => {
  const isDelivery = data.pickupMethod === 'delivery'

  return request.post('/api/claims', {
    item_id: data.itemId,
    claim_type: data.claimType,
    proof_text: data.proofText,
    proof_images: data.proofImage ? [data.proofImage] : [],
    pickup_method: data.pickupMethod,
    phone: data.phone,
    delivery_address: isDelivery ? data.deliveryAddress : '',
    remark: data.remark || ''
  })
}

/**
 * 第一优先级：提交认领申请 multipart/form-data 版
 *
 * 暂时注释原因：
 * - 当前需求文档没有单独写证明图片上传接口
 * - proof_images 字段在表结构里是 json
 * - 后端如果没有配置 multipart 接收，直接启用会失败
 *
 * 适用情况：
 * - 后端明确要求 proof_images[] 接收 File 文件
 * - ClaimApply.vue 里 proofImage 保存的是 File 对象，而不是预览地址
 * - 后端接口 POST /api/claims 支持 multipart/form-data
 */

// export const createClaimApi = data => {
//   const isDelivery = data.pickupMethod === 'delivery'
//   const formData = new FormData()
//
//   formData.append('item_id', data.itemId)
//   formData.append('claim_type', data.claimType)
//   formData.append('proof_text', data.proofText)
//   formData.append('pickup_method', data.pickupMethod)
//   formData.append('phone', data.phone)
//   formData.append('delivery_address', isDelivery ? data.deliveryAddress : '')
//   formData.append('remark', data.remark || '')
//
//   if (data.proofImage instanceof File) {
//     formData.append('proof_images[]', data.proofImage)
//   }
//
//   return request.post('/api/claims', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   })
// }

/**
 * 第一优先级：获取我的认领申请
 * 文档接口：GET /api/my/claims
 *
 * 用途：
 * - 我的发布 / 我的认领页面
 * - 查看当前用户提交过的认领、线索、领错归还申请
 * - 跟踪 pending / approved / rejected / handover_pending / completed 等状态
 */
export const getMyClaimsApi = params => {
  return request.get('/api/my/claims', {
    params
  })
}

/**
 * 第一优先级：获取认领申请详情
 * 文档接口：GET /api/claims/{id}
 *
 * 用途：
 * - 申请人查看自己的认领申请详情
 * - 发布人 / 管理员查看证明信息和审核状态
 */
export const getClaimDetailApi = id => {
  return request.get(`/api/claims/${id}`)
}