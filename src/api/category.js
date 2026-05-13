import request from './request'

export const getCategoriesApi = () => {
  return request.get('/api/categories')
}