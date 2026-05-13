import request from './request'

/**
 * 第一优先级：获取物品分类列表
 * 文档接口：GET /api/categories
 *
 * 用途：
 * - 首页分类入口
 * - 失物大厅分类筛选
 * - 发布信息页选择物品分类
 */
export const getCategoriesApi = () => {
  return request.get('/api/categories')
}

/**
 * 第一优先级：管理员新增分类
 * 文档接口：POST /api/admin/categories
 *
 * 可能使用页面：
 * - 后续 AdminCategory.vue
 * - 或 AdminOperations.vue 中新增“分类管理”tab
 *
 * 当前状态：
 * - 已封装
 * - 暂无页面调用
 */
export const createCategoryApi = data => {
  return request.post('/api/admin/categories', {
    name: data.name,
    icon: data.icon || '',
    sort: data.sort || 0
  })
}

/**
 * 第一优先级：管理员修改分类
 * 文档接口：PUT /api/admin/categories/{id}
 *
 * 可能使用页面：
 * - 后续 AdminCategory.vue
 * - 或 AdminOperations.vue 中新增“分类管理”tab
 *
 * 当前状态：
 * - 已封装
 * - 暂无页面调用
 */
export const updateCategoryApi = (id, data) => {
  return request.put(`/api/admin/categories/${id}`, {
    name: data.name,
    icon: data.icon || '',
    sort: data.sort || 0
  })
}

/**
 * 第一优先级：管理员删除分类
 * 文档接口：DELETE /api/admin/categories/{id}
 *
 * 可能使用页面：
 * - 后续 AdminCategory.vue
 * - 或 AdminOperations.vue 中新增“分类管理”tab
 *
 * 当前状态：
 * - 已封装
 * - 暂无页面调用
 */
export const deleteCategoryApi = id => {
  return request.delete(`/api/admin/categories/${id}`)
}