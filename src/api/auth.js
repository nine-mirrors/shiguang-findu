import request from './request'

export const loginApi = data => {
  return request.post('/api/auth/login', {
    email: data.email,
    password: data.password
  })
}

export const registerApi = data => {
  return request.post('/api/auth/register', {
    username: data.username,
    email: data.email,
    password: data.password,
    password_confirmation: data.password_confirmation,
    email_code: data.emailCode
  })
}

export const sendEmailCodeApi = (email, type = 'register') => {
  return request.post('/api/auth/send-email-code', {
    email,
    type
  })
}

export const logoutApi = () => {
  return request.post('/api/auth/logout')
}