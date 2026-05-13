import axios from 'axios'
import { ElMessage } from 'element-plus'
import { storage } from '@/utils/storage'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    Accept: 'application/json'
  }
})

// 明确声明公开接口，不能只用 startsWith 判断
const publicApis = [
  { method: 'post', url: '/api/auth/login' },
  { method: 'post', url: '/api/auth/register' },
  { method: 'post', url: '/api/auth/send-email-code' },
  { method: 'get', url: '/api/categories' },
  { method: 'get', url: '/api/lost-found/items' }
]

function isPublicApi(config) {
  const method = String(config.method || 'get').toLowerCase()
  const url = config.url || ''

  return publicApis.some(item => {
    if (item.method !== method) {
      return false
    }

    if (item.url === '/api/lost-found/items') {
      return url === '/api/lost-found/items' || /^\/api\/lost-found\/items\/\d+$/.test(url)
    }

    return url === item.url
  })
}

request.interceptors.request.use(
  config => {
    const token = storage.get('token', '')

    if (token && !isPublicApi(config)) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const status = error.response?.status
    const validation = error.response?.data?.errors
    const firstField = validation && Object.keys(validation)[0]

    const message = firstField
      ? validation[firstField]?.[0]
      : error.response?.data?.message || error.message || '请求失败'

    if (status === 401) {
      storage.remove('token')
      storage.remove('user')
      ElMessage.error('登录状态已失效，请重新登录')
      window.location.href = '/login'
    } else if (status === 403) {
      ElMessage.error('当前账号没有操作权限')
    } else if (status === 404) {
      ElMessage.error('接口不存在，请检查请求地址')
    } else if (status === 422) {
      ElMessage.error(message || '表单校验失败')
    } else if (status >= 500) {
      ElMessage.error('服务器异常，请稍后再试')
    } else {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  }
)

export default request