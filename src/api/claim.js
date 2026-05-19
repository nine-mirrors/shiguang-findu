import request from './request'

/**
 * 第一优先级：提交认领申请 / 线索说明
 * 文档接口：POST /api/claims
 *
 * 用途：
 * - claim：认领申请
 * - clue：线索说明
 *
 * 注意：
 * - 第一优先级只处理 claim / clue
 * - wrong_return 属于第二优先级“领错归还”，不要在第一阶段提交
 * - proof_images 在 V2.9 文档中为 json 字段，当前使用 JSON 数组提交
 */
export const createClaimApi = data => {
  const isDelivery = data.pickupMethod === 'delivery'

  const allowedClaimTypes = ['claim', 'clue', 'wrong_return']
  const claimType = allowedClaimTypes.includes(data.claimType) ? data.claimType : 'clue'

  const proofImages = Array.isArray(data.proofImages) && data.proofImages.length
    ? data.proofImages
    : (data.proofImage ? [data.proofImage] : [])

  const payload = {
    item_id: data.itemId,
    claim_type: claimType,
    proof_text: data.proofText,
    proof_images: proofImages,
    pickup_method: data.pickupMethod,
    phone: data.phone,
    remark: data.remark || ''
  }

  if (isDelivery) {
    payload.delivery_address = data.deliveryAddress
  }

  return request.post('/api/claims', payload)
}

/**
 * 预留：提交认领申请 multipart/form-data 版
 *
 * 暂时不启用原因：
 * - V2.9 没有单独的认领证明图片上传接口
 * - claim_requests.proof_images 是 json 字段
 * - 当前第一阶段按 JSON 数组提交 proof_images
 *
 * 只有当后端明确要求 proof_images[] 接收 File 文件时，才启用这一版。
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
//   const proofImages = data.proofImages || (data.proofImage ? [data.proofImage] : [])
//
//   proofImages
//     .filter(image => image instanceof File)
//     .forEach(image => {
//       formData.append('proof_images[]', image)
//     })
//
//   return request.post('/api/claims', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     }
//   })
// }

/**
 * 第一优先级：获取我的认领 / 线索申请
 * 文档接口：GET /api/my/claims
 *
 * 用途：
 * - 我的发布页中的“我的认领/线索”Tab
 * - 查看当前用户提交过的认领申请和线索说明
 * - 跟踪 pending / approved / rejected / handover_pending / completed 等状态
 *
 * 注意：
 * - 第一版不强制拆出独立 /my-claims 页面
 * - wrong_return 属于第二优先级，不纳入第一阶段说明
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
 * - 申请人查看自己的认领 / 线索申请详情
 * - 发布人 / 管理员查看证明信息和审核状态
 */
export const getClaimDetailApi = id => {
  return request.get(`/api/claims/${id}`)
}