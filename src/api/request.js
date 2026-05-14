import axios from 'axios'
import { ElMessage } from 'element-plus'
import { storage } from '@/utils/storage'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    Accept: 'application/json'
  }
})

const isNetworkError = error => {
  return !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error') || error.message.includes('timeout')
}

/**
 * 公开接口白名单
 *
 * 这些接口不强制携带 token：
 * - 登录
 * - 注册
 * - 发送邮箱验证码
 * - 分类列表
 * - 失物招领大厅列表
 * - 失物招领详情
 *
 * 注意：
 * 不要简单用 startsWith('/api/lost-found/items')，
 * 否则 POST /api/lost-found/items 这种需要登录的接口也会被误判成公开接口。
 */
const publicApis = [
  { method: 'post', url: '/api/auth/login' },
  { method: 'post', url: '/api/auth/register' },
  { method: 'post', url: '/api/auth/send-email-code' },
  { method: 'get', url: '/api/categories' },
  { method: 'get', url: '/api/lost-found/items' }
]

const normalizeUrl = url => {
  return String(url || '').split('?')[0]
}

const isPublicApi = config => {
  const method = String(config.method || 'get').toLowerCase()
  const url = normalizeUrl(config.url)

  return publicApis.some(item => {
    if (item.method !== method) return false

    if (item.url === '/api/lost-found/items') {
      return url === '/api/lost-found/items' || /^\/api\/lost-found\/items\/[^/]+$/.test(url)
    }

    return url === item.url
  })
}

const redirectToLogin = () => {
  const currentPath = window.location.pathname + window.location.search

  if (window.location.pathname === '/login') return

  router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
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
    if (response.config.responseType === 'blob') {
      return response.data
    }

    return response.data
  },
  error => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    const validation = error.response?.data?.errors
    const firstField = validation && Object.keys(validation)[0]

    const message = firstField
      ? validation[firstField]?.[0]
      : error.response?.data?.message || error.message || '请求失败'

    if (isNetworkError(error)) {
      if (window.location.pathname !== '/network-error') {
        router.push('/network-error')
      }
      return Promise.reject(error)
    } else if (status === 401) {
      storage.remove('token')
      storage.remove('user')
      ElMessage.error('登录状态已失效，请重新登录')
      redirectToLogin()
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