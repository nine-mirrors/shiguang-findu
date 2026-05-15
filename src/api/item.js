import request from './request'

/**
 * 第一优先级：获取失物招领列表
 * 文档接口：GET /api/lost-found/items
 * 用途：失物大厅、首页最新协寻、搜索筛选等公开列表。
 *
 * 图片规则：
 * - 大厅卡片需要后端返回 image_url 或 images[0].image_url
 * - 如果 image_url 为 lost-found/xxx.png，前端展示时拼接为 /storage/lost-found/xxx.png
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
 *
 * 图片规则：
 * - 详情页应返回完整 images[]
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
 * 第一优先级：发布失物 / 招领信息
 * 文档接口：POST /api/lost-found/items
 *
 * 字段：
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
    is_valuable: data.isValuable,
    claim_hint: data.claimHint || '',
    retention_days: data.retentionDays || 30
  })
}

/**
 * 第一优先级：编辑发布信息
 * 文档接口：PUT /api/lost-found/items/{id}
 * 用途：我的发布页编辑当前用户已发布的失物 / 招领信息。
 *
 * 注意：
 * - 图片仍然通过 POST /api/lost-found/items/{id}/images 单独上传
 * - 不在这里直接传 image / image_url
 */
export const updateItemApi = (id, data) => {
  return request.put(`/api/lost-found/items/${id}`, {
    type: data.type,
    name: data.name,
    category_id: data.categoryId,
    location: data.location,
    happen_time: data.happenTime,
    description: data.description,
    contact: data.contact,
    visibility: data.visibility,
    is_valuable: data.isValuable,
    claim_hint: data.claimHint || '',
    retention_days: data.retentionDays || 30
  })
}

/**
 * 第一优先级：修改物品状态
 * 文档接口：PUT /api/lost-found/items/{id}/status
 * 用途：发布人或管理员将物品标记为找回、已交接、关闭等状态。
 *
 * 推荐状态：
 * - open：进行中
 * - completed：已完成
 * - closed：已关闭
 */
export const updateItemStatusApi = (id, data) => {
  return request.put(`/api/lost-found/items/${id}/status`, {
    status: data.status
  })
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
 * 第一优先级：上传物品图片
 * 文档接口：POST /api/lost-found/items/{id}/images
 * 用途：发布信息创建成功后，继续上传 1-3 张物品照片。
 *
 * 注意：
 * - 这里只接收 File 对象
 * - 不传本地预览 URL
 * - 不传 base64 字符串
 * - 后端返回 image_url 后，列表和详情接口也应返回对应图片字段
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