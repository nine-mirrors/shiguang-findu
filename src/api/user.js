import request from './request'

/**
 * 第一优先级：获取当前用户资料
 * 文档接口：GET /api/user/profile
 *
 * 用途：
 * - 个人中心展示用户资料
 * - 页面刷新后重新拉取当前登录用户信息
 * - 补充用户角色、认证等级、手机号、头像等字段
 *
 * 文档要求：
 * - 登录接口和获取个人信息接口必须返回 user.role
 * - role 只允许 student / admin
 * - verification_level 只表示认证等级，不作为系统角色
 */
export const getUserProfileApi = () => {
  return request.get('/api/user/profile')
}

/**
 * 第一优先级：修改当前用户资料
 * 文档接口：PUT /api/user/profile
 *
 * 用途：
 * - 修改昵称
 * - 修改手机号
 * - 修改头像
 *
 * 字段说明：
 * - 前端页面变量可以叫 username
 * - 提交接口时必须映射为 name
 */
export const updateUserProfileApi = data => {
  return request.put('/api/user/profile', {
    name: data.username,
    phone: data.phone || '',
    avatar: data.avatar || ''
  })
}