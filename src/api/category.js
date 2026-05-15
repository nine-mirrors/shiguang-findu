import request from './request'

/**
 * 第一优先级：获取物品分类列表
 * 文档接口：GET /api/categories
 *
 * 用途：
 * - 首页分类入口
 * - 失物大厅分类筛选
 * - 发布信息页选择物品分类
 *
 * 注意：
 * - 这是公开接口
 * - 发布信息时 category_id 必须来自该接口返回的 id
 * - 分类接口加载失败时，不应把中文分类名当作 category_id 提交
 */
export const getCategoriesApi = () => {
  return request.get('/api/categories')
}

/**
 * 第一优先级：管理员新增分类
 * 文档接口：POST /api/admin/categories
 *
 * 用途：
 * - 管理员维护物品分类
 * - 可放在 AdminOperations.vue 的“分类管理”tab 中
 * - 不强制单独新建 AdminCategory.vue 页面
 *
 * 字段：
 * - name：分类名称
 * - sort：排序值
 */
export const createCategoryApi = data => {
  return request.post('/api/admin/categories', {
    name: data.name,
    sort: data.sort ?? 0
  })
}

/**
 * 第一优先级：管理员修改分类
 * 文档接口：PUT /api/admin/categories/{id}
 *
 * 用途：
 * - 管理员修改分类名称和排序
 */
export const updateCategoryApi = (id, data) => {
  return request.put(`/api/admin/categories/${id}`, {
    name: data.name,
    sort: data.sort ?? 0
  })
}

/**
 * 第一优先级：管理员删除分类
 * 文档接口：DELETE /api/admin/categories/{id}
 *
 * 用途：
 * - 管理员删除无效分类
 *
 * 注意：
 * - 如果分类已被物品使用，后端应禁止删除或返回明确错误提示
 */
export const deleteCategoryApi = id => {
  return request.delete(`/api/admin/categories/${id}`)
}