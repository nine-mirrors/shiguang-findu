import request from './request'

/**
 * 第一优先级：获取收藏列表
 * 文档接口：GET /api/favorites
 *
 * 用途：
 * - 收藏夹页面展示用户收藏过的失物 / 招领信息
 * - 方便用户持续关注物品状态变化
 */
export const getFavoritesApi = params => {
  return request.get('/api/favorites', {
    params
  })
}

/**
 * 第一优先级：添加收藏
 * 文档接口：POST /api/favorites
 *
 * 用途：
 * - 用户在失物大厅或物品详情页收藏感兴趣的信息
 *
 * 请求字段：
 * - item_id：被收藏的物品 ID
 */
export const addFavoriteApi = itemId => {
  return request.post('/api/favorites', {
    item_id: itemId
  })
}

/**
 * 第一优先级：取消收藏
 * 文档接口：DELETE /api/favorites/{item_id}
 *
 * 用途：
 * - 用户取消收藏某条失物 / 招领信息
 */
export const removeFavoriteApi = itemId => {
  return request.delete(`/api/favorites/${itemId}`)
}