import request from './request'

export const getItemsApi = params => {
  return request.get('/api/lost-found/items', {
    params
  })
}

export const getItemDetailApi = id => {
  return request.get(`/api/lost-found/items/${id}`)
}

export const getMyItemsApi = params => {
  return request.get('/api/my/lost-found/items', {
    params
  })
}

export const updateItemStatusApi = (id, data) => {
  return request.put(`/api/lost-found/items/${id}/status`, data)
}

export const deleteItemApi = id => {
  return request.delete(`/api/lost-found/items/${id}`)
}

export const createItemApi = data => {
  return request.post('/api/lost-found/items', {
    type: data.type,
    name: data.name,
    category_id: data.categoryId,
    location: data.location,
    happen_time: data.happenTime,
    description: data.description,
    contact: data.contact,
    visibility: data.visibility,
    is_valuable: data.isValuable
  })
}

export const uploadItemImagesApi = (id, images = []) => {
  const formData = new FormData()

  images
    .filter(image => image instanceof File)
    .forEach(image => {
      formData.append('images[]', image)
    })

  return request.post(`/api/lost-found/items/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}