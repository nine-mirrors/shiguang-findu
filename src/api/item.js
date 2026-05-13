import request from './request'

/**
 * 第一优先级：获取失物招领列表
 * 文档接口：GET /api/lost-found/items
 * 用途：失物大厅、首页最新协寻、搜索筛选等公开列表。
 */
export const getItemsApi = params => {
  return request.get('/api/lost-found/items', {
    params
  })
}

/**
 * 第一优先级：获取失物招领详情
 * 文档接口：GET /api/lost-found/items/{id}
 * 用途：物品详情页，展示图片、描述、状态时间线、认领入口等。
 */
export const getItemDetailApi = id => {
  return request.get(`/api/lost-found/items/${id}`)
}

/**
 * 第一优先级：获取我的发布
 * 文档接口：GET /api/my/lost-found/items
 * 用途：我的发布页，查看当前用户发布过的失物 / 招领信息。
 */
export const getMyItemsApi = params => {
  return request.get('/api/my/lost-found/items', {
    params
  })
}

/**
 * 第一优先级：修改物品状态
 * 文档接口：PUT /api/lost-found/items/{id}/status
 * 用途：发布人或管理员将物品标记为找回、已交接、关闭等状态。
 */
export const updateItemStatusApi = (id, data) => {
  return request.put(`/api/lost-found/items/${id}/status`, data)
}

/**
 * 第一优先级：删除发布信息
 * 文档接口：DELETE /api/lost-found/items/{id}
 * 用途：发布人或管理员删除错误、过期、违规的失物 / 招领信息。
 */
export const deleteItemApi = id => {
  return request.delete(`/api/lost-found/items/${id}`)
}

/**
 * 第一优先级：发布失物 / 招领信息
 * 文档接口：POST /api/lost-found/items
 *
 * 第一优先级字段：
 * - type
 * - name
 * - category_id
 * - location
 * - happen_time
 * - description
 * - contact
 * - visibility
 * - is_valuable
 *
 * 注意：
 * 图片不在这里直接传，图片通过 POST /api/lost-found/items/{id}/images 单独上传。
 */
export const createItemApi = data => {
  return request.post('/api/lost-found/items', {
    type: data.type,
    name: data.name,
    category_id: data.categoryId,
    location: data.location,
    happen_time: data.happenTime,
    description: data.description,
    contact: data.contact,
    visibility: data.visibility,
    is_valuable: data.isValuable

    /**
     * 第二优先级 / 扩展字段：当前先不默认传给后端。
     *
     * claim_hint：
     * - 前端发布页用于“认领核验提示”。
     * - 需求文档第一优先级 lost_found_items 表没有该字段。
     * - 如果后端愿意扩展字段，再打开。
     *
     * retention_days：
     * - 前端发布页用于保管天数预览。
     * - 需求文档第二优先级滞留处理使用 storage_records / storage_days / expire_at 等字段。
     * - 不建议第一阶段直接塞进 lost_found_items。
     */
    // claim_hint: data.claimHint || '',
    // retention_days: data.retentionDays || 30
  })
}

/**
 * 第一优先级：上传物品图片
 * 文档接口：POST /api/lost-found/items/{id}/images
 * 用途：发布信息创建成功后，继续上传 1-3 张物品照片。
 *
 * 注意：
 * 这里只接收 File 对象，避免把本地预览 URL 或 base64 字符串误传给后端。
 */
export const uploadItemImagesApi = (id, images = []) => {
  const formData = new FormData()

  images
    .filter(image => image instanceof File)
    .forEach(image => {
      formData.append('images[]', image)
    })

  return request.post(`/api/lost-found/items/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}