import { formatDateTime } from './datetime.js'

function parseImages(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 手机号脱敏：11 位手机号保留前 3 后 4，已脱敏或非手机号原样返回 */
export function maskPhone(value) {
  const phone = String(value || '').trim()
  if (!phone) return ''
  if (phone.includes('*')) return phone
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  if (phone.length >= 7) return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  return phone
}

/** self 为 true 时返回完整手机号，否则脱敏 */
function phoneFor(value, self) {
  return self ? value || '' : maskPhone(value)
}

export function serializeUser(user, { self = false } = {}) {
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    phone: phoneFor(user.phone, self),
    studentNo: user.studentNo || '',
    verificationLevel: user.verificationLevel || 'basic',
    createdAt: formatDateTime(user.createdAt),
    updatedAt: formatDateTime(user.updatedAt)
  }
}

export function serializeItem(item) {
  if (!item) return null
  return {
    id: item.id,
    userId: item.userId,
    user: item.user
      ? { id: item.user.id, username: item.user.username, avatar: item.user.avatar || '' }
      : undefined,
    type: item.type,
    name: item.name,
    category: item.category?.name || item.categoryName || '',
    categoryId: item.categoryId ?? null,
    location: item.location || '',
    happenTime: item.happenTime || '',
    description: item.description || '',
    contact: item.contact || '',
    image: item.image || '',
    images: parseImages(item.images),
    visibility: item.visibility || 'public',
    isValuable: Boolean(item.isValuable),
    claimHint: item.claimHint || '',
    storageCode: item.storageCode || '',
    retentionDays: item.retentionDays ?? 30,
    status: item.status,
    auditStatus: item.auditStatus,
    rejectReason: item.rejectReason || '',
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt),
    auditedAt: formatDateTime(item.auditedAt),
    completedAt: formatDateTime(item.completedAt)
  }
}

export function serializeClaim(claim, { self = false } = {}) {
  if (!claim) return null
  return {
    id: claim.id,
    itemId: claim.itemId,
    userId: claim.userId,
    claimantName: claim.claimantName || '',
    claimType: claim.claimType,
    method: claim.method,
    proofText: claim.proofText || '',
    proofImage: claim.proofImage || '',
    deliveryAddress: claim.deliveryAddress || '',
    phone: phoneFor(claim.phone, self),
    status: claim.status,
    progress: claim.progress,
    ownerAudit: claim.ownerAudit,
    adminAudit: claim.adminAudit,
    handoverStatus: claim.handoverStatus,
    score: claim.score,
    auditRemark: claim.auditRemark || '',
    wrongReturnReason: claim.wrongReturnReason || '',
    handoverMethod: claim.handoverMethod || '',
    handoverRemark: claim.handoverRemark || '',
    createdAt: formatDateTime(claim.createdAt),
    updatedAt: formatDateTime(claim.updatedAt),
    auditedAt: formatDateTime(claim.auditedAt),
    completedAt: formatDateTime(claim.completedAt),
    ...(claim.item ? { item: serializeItem(claim.item) } : {})
  }
}

export function serializeFavorite(favorite) {
  if (!favorite) return null
  return {
    id: favorite.id,
    userId: favorite.userId,
    itemId: favorite.itemId,
    createdAt: formatDateTime(favorite.createdAt),
    ...(favorite.item ? { item: serializeItem(favorite.item) } : {})
  }
}

export function serializeNotification(notification) {
  if (!notification) return null
  return {
    id: notification.id,
    userId: notification.userId ?? null,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    relatedId: notification.relatedId ?? null,
    read: Boolean(notification.read),
    createdAt: formatDateTime(notification.createdAt)
  }
}

export function serializeVerification(record, { self = false } = {}) {
  if (!record) return null
  return {
    id: record.id,
    userId: record.userId,
    level: record.level,
    realName: record.realName || '',
    studentNo: record.studentNo || '',
    phone: phoneFor(record.phone, self),
    status: record.status,
    rejectReason: record.rejectReason || '',
    createdAt: formatDateTime(record.createdAt),
    updatedAt: formatDateTime(record.updatedAt),
    auditedAt: formatDateTime(record.auditedAt)
  }
}

export function serializeAnnouncement(record) {
  if (!record) return null
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    status: record.status,
    createdAt: formatDateTime(record.createdAt),
    updatedAt: formatDateTime(record.updatedAt)
  }
}

export function serializeStorage(record) {
  if (!record) return null
  return {
    id: record.id,
    itemId: record.itemId,
    storageCode: record.storageCode || '',
    storageLocation: record.storageLocation || '',
    expireAt: formatDateTime(record.expireAt),
    disposalStatus: record.disposalStatus,
    handoverTarget: record.handoverTarget || '',
    handoverTime: formatDateTime(record.handoverTime),
    remark: record.remark || '',
    createdAt: formatDateTime(record.createdAt),
    ...(record.item ? { item: serializeItem(record.item) } : {})
  }
}

export function serializeDispute(record) {
  if (!record) return null
  return {
    id: record.id,
    itemId: record.itemId ?? null,
    claimId: record.claimId ?? null,
    claimantName: record.claimantName || '',
    reason: record.reason || '',
    status: record.status,
    result: record.result || '',
    createdAt: formatDateTime(record.createdAt),
    resolvedAt: formatDateTime(record.resolvedAt),
    ...(record.item ? { item: serializeItem(record.item) } : {})
  }
}

export function serializeBlacklist(record) {
  if (!record) return null
  return {
    id: record.id,
    userId: record.userId ?? null,
    username: record.username || record.user?.username || '',
    reason: record.reason || '',
    level: record.level,
    limitType: record.limitType,
    status: record.status,
    startedAt: formatDateTime(record.startedAt),
    expiresAt: formatDateTime(record.expiresAt),
    releaseReason: record.releaseReason || '',
    createdAt: formatDateTime(record.createdAt),
    ...(record.user ? { user: serializeUser(record.user) } : {})
  }
}
