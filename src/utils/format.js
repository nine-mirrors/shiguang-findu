export function formatDateTime(value) {
  if (!value) return '时间待补充'

  const str = String(value).replace('T', ' ').replace(/\.\d+Z?$/, '')
  const date = new Date(str.replace(/-/g, '/'))

  if (Number.isNaN(date.getTime())) return String(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}
