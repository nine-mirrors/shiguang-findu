import axios from 'axios'
import { ElMessage } from 'element-plus'
import { storage } from '@/utils/storage'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: { Accept: 'application/json' }
})

request.interceptors.request.use(config => {
  const token = storage.get('token', '')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    const validation = error.response?.data?.errors
    const firstField = validation && Object.keys(validation)[0]
    const message = firstField ? validation[firstField]?.[0] : error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
