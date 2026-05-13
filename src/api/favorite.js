import request from './request'

export const getFavoritesApi = params => {
  return request.get('/api/favorites', {
    params
  })
}

export const addFavoriteApi = itemId => {
  return request.post('/api/favorites', {
    item_id: itemId
  })
}

export const removeFavoriteApi = itemId => {
  return request.delete(`/api/favorites/${itemId}`)
}