import request from './request'

export const getNotificationsApi = params => {
  return request.get('/api/notifications', {
    params
  })
}

export const readNotificationApi = id => {
  return request.put(`/api/notifications/${id}/read`)
}

export const readAllNotificationsApi = () => {
  return request.put('/api/notifications/read-all')
}