import request from './request'

export const getUserProfileApi = () => {
  return request.get('/api/user/profile')
}

export const updateUserProfileApi = data => {
  return request.put('/api/user/profile', {
    username: data.username,
    phone: data.phone,
    avatar: data.avatar
  })
}