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

/**
 * 第二优先级：用户注销账号
 * 文档补充接口：POST /api/user/cancel
 *
 * 用途：
 * - 当前登录用户申请注销账号
 * - 注销前需要校验密码和邮箱验证码
 * - 后端应采用软注销 / 停用账号，不建议物理删除用户记录
 *
 * 字段：
 * - email_code：邮箱验证码
 * - password：当前登录密码
 * - reason：注销原因，可选
 */
export const cancelUserAccountApi = data => {
  return request.post('/api/user/cancel', {
    email_code: data.emailCode,
    password: data.password,
    reason: data.reason || ''
  })
}