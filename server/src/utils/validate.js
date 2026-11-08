import { HttpError } from './http.js'

/** 读取正整数 id，非法时返回 null（避免把 NaN 传给 Prisma 导致 500） */
export function readId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** 路径参数 id 校验，非法统一按「不存在」处理 */
export function assertId(value, message = '未找到该记录') {
  const id = readId(value)
  if (!id) throw new HttpError(404, message)
  return id
}

function invalid(message, field) {
  return new HttpError(422, message, { errors: { [field]: message } })
}

/** 必填文本：去空格、长度区间校验 */
export function requiredText(value, { field = 'value', label = '内容', min = 1, max = 200 } = {}) {
  const text = String(value ?? '').trim()
  if (!text) throw invalid(`请填写${label}`, field)
  if (text.length < min) throw invalid(`${label}至少 ${min} 个字符`, field)
  if (text.length > max) throw invalid(`${label}不能超过 ${max} 个字符`, field)
  return text
}

/** 选填文本：只做长度上限校验 */
export function optionalText(value, { field = 'value', label = '内容', max = 200 } = {}) {
  const text = String(value ?? '').trim()
  if (text.length > max) throw invalid(`${label}不能超过 ${max} 个字符`, field)
  return text
}

export function assertEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email) throw invalid('请输入邮箱地址', 'email')
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw invalid('请输入正确的邮箱地址', 'email')
  }
  return email
}

/** 密码：6-32 位，且同时包含字母和数字 */
export function assertPassword(value) {
  const password = String(value ?? '')
  if (!/^(?=.*[A-Za-z])(?=.*\d)\S{6,32}$/.test(password)) {
    throw invalid('密码需 6-32 位，且同时包含字母和数字', 'password')
  }
  return password
}

/** 选填手机号：为空允许，非空必须是 11 位大陆手机号 */
export function optionalPhone(value, field = 'phone') {
  const phone = String(value ?? '').trim()
  if (!phone) return ''
  if (!/^1[3-9]\d{9}$/.test(phone)) throw invalid('请输入正确的手机号', field)
  return phone
}

/** 选填学号：4-20 位字母或数字 */
export function optionalStudentNo(value, field = 'studentNo') {
  const studentNo = String(value ?? '').trim()
  if (!studentNo) return ''
  if (!/^[A-Za-z0-9]{4,20}$/.test(studentNo)) throw invalid('学号应为 4-20 位字母或数字', field)
  return studentNo
}

/** 选填 URL / 图片路径，限制长度 */
export function optionalUrl(value, { field = 'url', label = '链接', max = 300 } = {}) {
  return optionalText(value, { field, label, max })
}
