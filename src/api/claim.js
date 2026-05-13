import request from './request'

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

export const getMyClaimsApi = params => {
  return request.get('/api/my/claims', {
    params
  })
}

export const getClaimDetailApi = id => {
  return request.get(`/api/claims/${id}`)
}