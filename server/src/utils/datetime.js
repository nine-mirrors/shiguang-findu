const pad = value => String(value).padStart(2, '0')

/** 输出与前端 mock 一致的 `YYYY-MM-DD HH:mm` 文本 */
export function formatDateTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 解析前端传来的时间文本，失败时返回 null */
export function parseDateTime(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const text = String(value).trim()
  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const date = new Date(normalized)
  if (!Number.isNaN(date.getTime())) return date
  const fallback = new Date(text.replace(/-/g, '/'))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}
