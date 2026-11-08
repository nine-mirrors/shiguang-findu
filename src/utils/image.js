/**
 * 统一图片地址解析
 *
 * 后端有两种图片地址：
 * - /uploads/xxx.jpg   新后端本地上传（Express 静态目录）
 * - lost-found/xxx.png 历史资源，需要拼到 /storage/ 下
 *
 * 之前的页面各自实现了一份，只处理 /storage/，导致新上传的图片被拼成
 * /storage/uploads/xxx.jpg 而 404。这里统一收口。
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export function resolveImageUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  if (/^(https?:)?\/\//i.test(value)) return value
  if (/^(blob:|data:)/i.test(value)) return value

  if (value.startsWith('/uploads/')) return `${baseURL}${value}`
  if (value.startsWith('uploads/')) return `${baseURL}/${value}`
  if (value.startsWith('/storage/')) return `${baseURL}${value}`
  if (value.startsWith('storage/')) return `${baseURL}/${value}`

  return `${baseURL}/storage/${value.startsWith('/') ? value.slice(1) : value}`
}

export default resolveImageUrl
