import request from './request'

/**
 * 第一优先级：用户登录
 * 文档接口：POST /api/auth/login
 */
export const loginApi = data => {
  return request.post('/api/auth/login', {
    email: data.email,
    password: data.password
  })
}

/**
 * 第一优先级：用户注册
 * 文档接口：POST /api/auth/register
 *
 * V2.9 字段约定：
 * - 前端 username -> 接口字段 name
 * - 前端 emailCode -> 接口字段 code
 */
export const registerApi = data => {
  return request.post('/api/auth/register', {
    name: data.username,
    email: data.email,
    password: data.password,
    password_confirmation: data.password_confirmation,
    code: data.emailCode
  })
}

/**
 * 第一优先级：发送邮箱验证码
 * 文档接口：POST /api/auth/send-email-code
 *
 * type：
 * - register：注册验证码
 * - forgot_password：忘记密码验证码
 * - cancel_account：注销账号验证码
 */
export const sendEmailCodeApi = (email, type = 'register') => {
  return request.post('/api/auth/send-email-code', {
    email,
    type
  })
}

/**
 * 第一优先级：忘记密码 / 重置密码
 * 文档接口：POST /api/auth/forgot-password
 *
 * V2.9 字段约定：
 * - 前端 emailCode -> 接口字段 code
 */
export const forgotPasswordApi = data => {
  return request.post('/api/auth/forgot-password', {
    email: data.email,
    code: data.emailCode,
    password: data.password,
    password_confirmation: data.password_confirmation
  })
}

/**
 * 第一优先级：退出登录
 * 文档接口：POST /api/auth/logout
 */
export const logoutApi = () => {
  return request.post('/api/auth/logout')
}