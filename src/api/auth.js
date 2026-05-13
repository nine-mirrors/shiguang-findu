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
 */
export const registerApi = data => {
  return request.post('/api/auth/register', {
    username: data.username,
    email: data.email,
    password: data.password,
    password_confirmation: data.password_confirmation,
    email_code: data.emailCode
  })
}

/**
 * 第一优先级：发送邮箱验证码
 * 文档接口：POST /api/auth/send-email-code
 */
export const sendEmailCodeApi = (email, type = 'register') => {
  return request.post('/api/auth/send-email-code', {
    email,
    type
  })
}

/**
 * 第一优先级：退出登录
 * 文档接口：POST /api/auth/logout
 */
export const logoutApi = () => {
  return request.post('/api/auth/logout')
}