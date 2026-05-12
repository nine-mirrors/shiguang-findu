import { storage } from '@/utils/storage'
import {
  seedItems, seedUsers, seedClaims, seedNotifications, seedFavorites, seedVerification,
  seedAnnouncements, seedBlacklist, seedDisputes, seedStorage, seedAdminTodos, categories, locations
} from './mockData'
// Laravel 对接时再启用真实接口封装；当前比赛演示版先使用 mock 数据。
// import request from './request'

const delay = (value, time = 180) => new Promise(resolve => setTimeout(() => resolve(value), time))
const nowText = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

const DATA_VERSION = 'v8-integrated-2026-05-doc-alignment'

function ensureData() {
  if (storage.get('mockDataVersion') !== DATA_VERSION) {
    storage.set('mockDataVersion', DATA_VERSION)
    storage.set('users', seedUsers)
    storage.set('items', seedItems)
    storage.set('claims', seedClaims)
    storage.set('notifications', seedNotifications)
    storage.set('favorites', seedFavorites)
    storage.set('verification', seedVerification)
    storage.set('announcements', seedAnnouncements)
    storage.set('blacklist', seedBlacklist)
    storage.set('disputes', seedDisputes)
    storage.set('storageRecords', seedStorage)
    storage.set('adminTodos', seedAdminTodos)
  }
  if (!storage.get('users')) storage.set('users', seedUsers)
  if (!storage.get('items')) storage.set('items', seedItems)
  if (!storage.get('claims')) storage.set('claims', seedClaims)
  if (!storage.get('notifications')) storage.set('notifications', seedNotifications)
  if (!storage.get('favorites')) storage.set('favorites', seedFavorites)
  if (!storage.get('verification')) storage.set('verification', seedVerification)
  if (!storage.get('announcements')) storage.set('announcements', seedAnnouncements)
  if (!storage.get('blacklist')) storage.set('blacklist', seedBlacklist)
  if (!storage.get('disputes')) storage.set('disputes', seedDisputes)
  if (!storage.get('storageRecords')) storage.set('storageRecords', seedStorage)
  if (!storage.get('adminTodos')) storage.set('adminTodos', seedAdminTodos)
}
function getItemsRaw() { ensureData(); return storage.get('items', []) }
function setItemsRaw(items) { storage.set('items', items) }
function getUsersRaw() { ensureData(); return storage.get('users', []) }
function getClaimsRaw() { ensureData(); return storage.get('claims', []) }
function setClaimsRaw(claims) { storage.set('claims', claims) }
function getNotificationsRaw() { ensureData(); return storage.get('notifications', []) }
function setNotificationsRaw(list) { storage.set('notifications', list) }
function getFavoritesRaw() { ensureData(); return storage.get('favorites', []) }
function setFavoritesRaw(list) { storage.set('favorites', list) }
function getVerificationRaw() { ensureData(); return storage.get('verification', []) }
function setVerificationRaw(list) { storage.set('verification', list) }
function getAnnouncementsRaw() { ensureData(); return storage.get('announcements', []) }
function getBlacklistRaw() { ensureData(); return storage.get('blacklist', []) }
function setBlacklistRaw(list) { storage.set('blacklist', list) }
function getDisputesRaw() { ensureData(); return storage.get('disputes', []) }
function setDisputesRaw(list) { storage.set('disputes', list) }
function getStorageRaw() { ensureData(); return storage.get('storageRecords', []) }
function setStorageRaw(list) { storage.set('storageRecords', list) }
function getAdminTodosRaw() { ensureData(); return storage.get('adminTodos', []) }
function publicItem(item) { return { ...item } }
function isUserBlocked(userId, action = 'all') {
  return getBlacklistRaw().some(item => {
    const limitType = item.limitType || item.limit_type || 'all'
    return String(item.userId) === String(userId)
      && item.status !== 'inactive'
      && ['blocked', 'all'].includes(item.level || limitType)
      && (limitType === 'all' || limitType === action)
  })
}

export async function loginApi({ email, password }) {
  ensureData()
  const user = getUsersRaw().find(u => u.email === email && u.password === password)
  if (!user) throw new Error('邮箱或密码错误')
  const { password: _password, ...safeUser } = user
  return delay({ token: `mock-token-${user.id}-${Date.now()}`, user: safeUser })
}

export async function registerApi(form) {
  ensureData()
  const users = getUsersRaw()
  if (users.some(u => u.email === form.email)) throw new Error('该邮箱已注册')
  if (form.emailCode !== '123456') throw new Error('邮箱验证码错误（演示版验证码：123456）')
  const newUser = {
    id: Date.now(), username: form.username, email: form.email, password: form.password,
    role: 'student', avatar: '', verificationLevel: 'basic'
  }
  storage.set('users', [...users, newUser])
  const { password: _password, ...safeUser } = newUser
  return delay({ token: `mock-token-${newUser.id}-${Date.now()}`, user: safeUser })
}

export async function fetchItems(params = {}) {
  const keyword = String(params.keyword || '').trim().toLowerCase()
  let list = getItemsRaw().filter(item => item.auditStatus === 'approved')
  if (params.type && params.type !== 'all') list = list.filter(item => item.type === params.type)
  if (params.category && params.category !== 'all') list = list.filter(item => item.category === params.category)
  if (params.status && params.status !== 'all') list = list.filter(item => item.status === params.status)
  if (params.location && params.location !== 'all') list = list.filter(item => item.location === params.location)
  if (params.hasPhoto === 'with') list = list.filter(item => Boolean(item.image))
  if (keyword) {
    list = list.filter(item => `${item.name}${item.category}${item.location}${item.description}`.toLowerCase().includes(keyword))
  }
  list = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(publicItem)
  return delay(list)
}

export async function fetchAllItems() {
  return delay(getItemsRaw().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(publicItem))
}

export async function fetchItemDetail(id) {
  const item = getItemsRaw().find(item => String(item.id) === String(id))
  if (!item) throw new Error('未找到该信息')
  return delay(publicItem(item))
}

export async function createItem(form, user) {
  if (isUserBlocked(user?.id, 'publish')) throw new Error('当前账号已被限制发布，请联系管理员')
  const items = getItemsRaw()
  const item = {
    id: Date.now(),
    userId: user?.id || 0,
    type: form.type,
    name: form.name,
    category: form.category,
    location: form.location,
    happenTime: form.happenTime,
    description: form.description,
    contact: form.contact,
    image: form.image || '',
    visibility: form.visibility || 'public',
    isValuable: Boolean(form.isValuable),
    claimHint: form.claimHint || '',
    storageCode: form.type === 'found' ? `LF-${String(Date.now()).slice(-6)}` : '待找到',
    retentionDays: form.type === 'found' ? 30 : 30,
    status: 'open',
    auditStatus: 'pending',
    createdAt: nowText()
  }
  setItemsRaw([item, ...items])
  return delay(publicItem(item), 240)
}

export async function fetchMyItems(userId) {
  return delay(getItemsRaw().filter(item => String(item.userId) === String(userId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
}

export async function createClaim(form, user) {
  if (isUserBlocked(user?.id, 'claim')) throw new Error('当前账号已被限制认领，请联系管理员')
  const claims = getClaimsRaw()
  const scoreBase = form.proofImage ? 58 : 36
  const textScore = Math.min(34, String(form.proofText || '').length / 4)
  const claim = {
    id: Date.now(),
    itemId: Number(form.itemId),
    userId: user?.id || 0,
    claimantName: user?.username || '匿名用户',
    claimType: form.claimType || 'claim',
    method: form.method || 'offline',
    proofText: form.proofText || '',
    proofImage: form.proofImage || '',
    deliveryAddress: form.method === 'mail' ? (form.deliveryAddress || '') : '',
    phone: form.phone || '',
    status: 'pending',
    progress: '待审核',
    ownerAudit: 'pending',
    adminAudit: 'pending',
    handoverStatus: 'waiting',
    score: Math.min(96, Math.round(scoreBase + textScore)),
    createdAt: nowText()
  }
  setClaimsRaw([claim, ...claims])
  createNotification({
    userId: claim.userId,
    type: 'claim',
    title: '认领申请已提交',
    content: `你对“${getItemsRaw().find(i => String(i.id) === String(claim.itemId))?.name || '相关物品'}”提交的申请已进入审核流程。`,
    relatedId: claim.id
  })
  return delay(claim, 240)
}

export async function fetchMyClaims(userId) {
  const items = getItemsRaw()
  const claims = getClaimsRaw().filter(c => String(c.userId) === String(userId)).map(c => ({
    ...c, item: items.find(i => String(i.id) === String(c.itemId))
  }))
  return delay(claims)
}

export async function fetchAllClaims() {
  const items = getItemsRaw()
  return delay(getClaimsRaw().map(c => ({ ...c, item: items.find(i => String(i.id) === String(c.itemId)) })))
}

export async function auditClaim(id, status, remark = '') {
  let updated = null
  const list = getClaimsRaw().map(claim => {
    if (String(claim.id) !== String(id)) return claim
    const nextStatus = status === 'approved' ? 'handover_pending' : status
    const nextProgress = status === 'approved' ? '审核通过，等待交接' : status === 'rejected' ? '审核驳回' : '待补充材料'
    updated = { ...claim, status: nextStatus, adminAudit: status, progress: nextProgress, auditRemark: remark, auditedAt: nowText() }
    return updated
  })
  setClaimsRaw(list)
  if (updated) {
    if (status === 'approved') {
      setItemsRaw(getItemsRaw().map(item => String(item.id) === String(updated.itemId) ? { ...item, status: 'claiming' } : item))
    }
    createNotification({
      userId: updated.userId,
      type: 'claim',
      title: status === 'approved' ? '认领申请审核通过' : '认领申请已驳回',
      content: status === 'approved' ? '请登录平台查看线下领取或邮寄交接安排。' : (remark || '物品细节不匹配或证明材料不足。'),
      relatedId: updated.id
    })
  }
  return delay(true)
}

export async function updateItemStatus(id, status) {
  const list = getItemsRaw().map(item => String(item.id) === String(id) ? { ...item, status } : item)
  setItemsRaw(list)
  return delay(true)
}

export async function deleteItem(id) {
  setItemsRaw(getItemsRaw().filter(item => String(item.id) !== String(id)))
  return delay(true)
}

export async function auditItem(id, auditStatus, rejectReason = '') {
  let updated = null
  const list = getItemsRaw().map(item => {
    if (String(item.id) !== String(id)) return item
    updated = { ...item, auditStatus, rejectReason, auditedAt: nowText() }
    return updated
  })
  setItemsRaw(list)
  if (updated) {
    createNotification({
      userId: updated.userId,
      type: 'audit',
      title: auditStatus === 'approved' ? '发布信息审核通过' : '发布信息审核未通过',
      content: auditStatus === 'approved' ? `你发布的「${updated.name}」已展示到失物大厅。` : (rejectReason || '信息不完整，请修改后重新提交。'),
      relatedId: updated.id
    })
    if (auditStatus === 'approved' && updated.type === 'found') {
      const hasRecord = getStorageRaw().some(r => String(r.itemId) === String(updated.id))
      if (!hasRecord) {
        setStorageRaw([{
          id: Date.now() + 7,
          itemId: updated.id,
          storageCode: updated.storageCode || `LF-${String(Date.now()).slice(-6)}`,
          storageLocation: `${updated.location} 服务点`,
          expireAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16).replace('T', ' '),
          disposalStatus: 'normal',
          handoverTarget: '',
          handoverTime: '',
          remark: '审核通过后自动生成保管记录。'
        }, ...getStorageRaw()])
      }
    }
  }
  return delay(true)
}

export async function fetchDashboard() {
  const items = getItemsRaw()
  const approved = items.filter(item => item.auditStatus === 'approved')
  return delay({
    total: items.length,
    approved: approved.length,
    pending: items.filter(item => item.auditStatus === 'pending').length,
    done: items.filter(item => item.status === 'done').length,
    claims: getClaimsRaw().length,
    claimPending: getClaimsRaw().filter(c => c.status === 'pending').length,
    retained: items.filter(item => item.auditStatus === 'approved' && item.type === 'found' && item.status === 'open').length,
    overdue: items.filter(item => { const days = Number(item.retentionDays || 30); const t = new Date(String(item.createdAt || '').replace(/-/g, '/')).getTime(); return item.auditStatus === 'approved' && item.type === 'found' && item.status === 'open' && Number.isFinite(t) && Date.now() > t + days * 86400000 }).length,
    retainedItems: items.filter(item => item.auditStatus === 'approved' && item.type === 'found' && item.status === 'open').slice(0, 5),
    disputes: getDisputesRaw().filter(d => d.status !== 'resolved').length,
    blacklist: getBlacklistRaw().filter(b => b.status !== 'inactive').length,
    verifications: getVerificationRaw().filter(v => v.status === 'pending').length,
    todos: getAdminTodosRaw(),
    lost: approved.filter(item => item.type === 'lost').length,
    found: approved.filter(item => item.type === 'found').length,
    categories: categories.map(name => ({ name, value: approved.filter(item => item.category === name).length })),
    locations: locations.map(name => ({ name, value: approved.filter(item => item.location === name).length })).sort((a, b) => b.value - a.value)
  })
}

export { categories, locations }


// ===== 真实接口对接说明：以下函数当前全部走 mock；接 Laravel 时把函数体替换为 request 调用即可 =====
// 示例：export const fetchNotifications = () => request.get('/api/notifications')
// 示例：export const createClaim = (payload) => request.post('/api/claims', payload)
// 示例：export const submitVerification = (payload) => request.post('/api/verification', payload)

function createNotification(payload) {
  const item = {
    id: Date.now() + Math.floor(Math.random() * 999),
    userId: payload.userId,
    type: payload.type || 'system',
    title: payload.title,
    content: payload.content,
    relatedId: payload.relatedId || null,
    read: false,
    createdAt: nowText()
  }
  setNotificationsRaw([item, ...getNotificationsRaw()])
  return item
}

export async function fetchNotifications(userId) {
  // return request.get('/api/notifications')
  return delay(getNotificationsRaw().filter(n => String(n.userId) === String(userId) || n.userId === 'all').sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)))
}

export async function markNotificationRead(id) {
  // return request.put(`/api/notifications/${id}/read`)
  setNotificationsRaw(getNotificationsRaw().map(n => String(n.id) === String(id) ? { ...n, read: true } : n))
  return delay(true)
}

export async function fetchFavorites(userId) {
  // return request.get('/api/favorites')
  const ids = getFavoritesRaw().filter(f => String(f.userId) === String(userId)).map(f => String(f.itemId))
  return delay(getItemsRaw().filter(i => ids.includes(String(i.id))).map(publicItem))
}

export async function toggleFavorite(userId, itemId) {
  // return request.post('/api/favorites/toggle', { item_id: itemId })
  const list = getFavoritesRaw()
  const exists = list.some(f => String(f.userId) === String(userId) && String(f.itemId) === String(itemId))
  setFavoritesRaw(exists ? list.filter(f => !(String(f.userId) === String(userId) && String(f.itemId) === String(itemId))) : [{ id: Date.now(), userId, itemId: Number(itemId), createdAt: nowText() }, ...list])
  return delay(!exists)
}

export async function isFavorite(userId, itemId) {
  return delay(getFavoritesRaw().some(f => String(f.userId) === String(userId) && String(f.itemId) === String(itemId)))
}

export async function fetchVerification(userId) {
  // return request.get('/api/verification')
  return delay(getVerificationRaw().find(v => String(v.userId) === String(userId)) || { userId, level: 'basic', status: 'none' })
}

export async function submitVerification(form, user) {
  // return request.post('/api/verification', form)
  const list = getVerificationRaw().filter(v => String(v.userId) !== String(user?.id))
  const record = { id: Date.now(), userId: user?.id, level: form.level, realName: form.realName, studentNo: form.studentNo, status: 'pending', createdAt: nowText() }
  setVerificationRaw([record, ...list])
  createNotification({ userId: user?.id, type: 'security', title: '实名认证申请已提交', content: '工作人员审核后会通过站内消息和邮箱提醒你。', relatedId: record.id })
  return delay(record)
}

export async function fetchAnnouncements() {
  // return request.get('/api/announcements')
  return delay(getAnnouncementsRaw())
}

export async function fetchBlacklist() {
  // return request.get('/api/admin/blacklist')
  return delay(getBlacklistRaw())
}

export async function addBlacklist(payload) {
  // return request.post('/api/admin/blacklist', payload)
  const record = { id: Date.now(), ...payload, createdAt: nowText() }
  setBlacklistRaw([record, ...getBlacklistRaw()])
  return delay(record)
}

export async function fetchAnalytics() {
  // return request.get('/api/admin/analytics')
  const items = getItemsRaw()
  const claims = getClaimsRaw()
  const users = getUsersRaw()
  const approved = items.filter(i => i.auditStatus === 'approved')
  const now = Date.now()
  const recentStart = now - 7 * 86400000
  const userIdsWithRecentActivity = new Set()
  const isRecent = (value) => {
    const time = new Date(String(value || '').replace(/-/g, '/')).getTime()
    return Number.isFinite(time) && time >= recentStart && time <= now
  }
  items.forEach(item => { if (isRecent(item.createdAt)) userIdsWithRecentActivity.add(String(item.userId)) })
  claims.forEach(claim => { if (isRecent(claim.createdAt)) userIdsWithRecentActivity.add(String(claim.userId)) })
  const activeUsers = users.filter(user => user.role !== 'admin' && userIdsWithRecentActivity.has(String(user.id))).length
  const successfulClaims = claims.filter(c => c.status === 'completed').length
  const recentPublished = items.filter(item => isRecent(item.createdAt)).length
  return delay({
    activeUsers,
    successRate: claims.length ? Math.round(successfulClaims / claims.length * 100) : 0,
    publishFrequency: `${(recentPublished / 7).toFixed(1)}/日`,
    riskUsers: getBlacklistRaw().filter(b => b.status !== 'inactive').length,
    hotLocations: locations.map(name => ({ name, value: approved.filter(i => i.location === name).length })).sort((a,b)=>b.value-a.value),
    claimStages: [
      { name: '待审核', value: claims.filter(c=>c.status==='pending').length },
      { name: '待交接', value: claims.filter(c=>['approved', 'handover_pending'].includes(c.status)).length },
      { name: '已完成', value: successfulClaims },
      { name: '已驳回', value: claims.filter(c=>c.status==='rejected').length }
    ]
  })
}

export async function sendEmailCode(email, type = 'register') {
  // return request.post('/api/auth/send-email-code', { email, type })
  return delay({ email, type, message: '验证码已发送（mock：123456）' })
}


export async function fetchAdminTodos() {
  // return request.get('/api/admin/todos')
  return delay(getAdminTodosRaw())
}

export async function fetchAdminVerifications() {
  // return request.get('/api/admin/verifications')
  return delay(getVerificationRaw().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)))
}

export async function auditVerification(id, status, reason = '') {
  // return request.put(`/api/admin/verifications/${id}/audit`, { status, reason })
  const list = getVerificationRaw().map(v => String(v.id) === String(id) ? { ...v, status, rejectReason: reason, auditedAt: nowText() } : v)
  setVerificationRaw(list)
  const record = list.find(v => String(v.id) === String(id))
  if (record) createNotification({ userId: record.userId, type: 'security', title: status === 'approved' ? '实名认证审核通过' : '实名认证被驳回', content: status === 'approved' ? '你已解锁对应认领权限。' : (reason || '认证信息不完整，请重新提交。'), relatedId: record.id })
  return delay(true)
}

export async function fetchOverdueItems() {
  // return request.get('/api/admin/overdue-items')
  const items = getItemsRaw()
  return delay(getStorageRaw().map(r => ({ ...r, item: items.find(i => String(i.id) === String(r.itemId)) })).sort((a,b)=> new Date(a.expireAt)-new Date(b.expireAt)))
}

export async function transferOverdueItem(id, target, remark = '') {
  // return request.put(`/api/admin/overdue-items/${id}/transfer`, { target, remark })
  const list = getStorageRaw().map(r => String(r.id) === String(id) ? { ...r, disposalStatus: 'transferred', handoverTarget: target, handoverTime: nowText(), remark: remark || r.remark } : r)
  setStorageRaw(list)
  return delay(true)
}

export async function createAnnouncement(payload) {
  // return request.post('/api/admin/announcements', payload)
  const record = { id: Date.now(), title: payload.title, content: payload.content, status: payload.status || 'published', createdAt: nowText() }
  const list = [record, ...getAnnouncementsRaw()]
  storage.set('announcements', list)
  if (record.status === 'published') {
    createNotification({ userId: 'all', type: 'announcement', title: record.title, content: record.content, relatedId: record.id })
  }
  return delay(record)
}

export async function fetchDisputes() {
  // return request.get('/api/admin/disputes')
  const items = getItemsRaw()
  return delay(getDisputesRaw().map(d => ({ ...d, item: items.find(i => String(i.id) === String(d.itemId)) })).sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)))
}

export async function resolveDispute(id, result) {
  // return request.put(`/api/admin/disputes/${id}/resolve`, { result })
  const list = getDisputesRaw().map(d => String(d.id) === String(id) ? { ...d, status: 'resolved', result, resolvedAt: nowText() } : d)
  setDisputesRaw(list)
  return delay(true)
}

export async function fetchAdminUsers() {
  // return request.get('/api/admin/users')
  const verifications = getVerificationRaw()
  const blacklist = getBlacklistRaw()
  const claims = getClaimsRaw()
  return delay(getUsersRaw().filter(u => u.role !== 'admin').map(u => ({
    ...u,
    verification: verifications.find(v => String(v.userId) === String(u.id)),
    blacklist: blacklist.find(b => b.userId && String(b.userId) === String(u.id)),
    claimFailed: claims.filter(c => String(c.userId) === String(u.id) && c.status === 'rejected').length,
    claimTotal: claims.filter(c => String(c.userId) === String(u.id)).length,
    publishTotal: getItemsRaw().filter(i => String(i.userId) === String(u.id)).length
  })))
}

export async function publishRiskAction(payload) {
  // return request.post('/api/admin/risk-actions', payload)
  if (payload.action === 'blacklist') {
    return addBlacklist({ userId: payload.userId, username: payload.username, reason: payload.reason, level: 'blocked', limitType: 'all', status: 'active' })
  }
  return delay({ ok: true })
}

export async function completeHandover(claimId, payload = {}) {
  // return request.post(`/api/handover-records`, { claim_id: claimId, ...payload })
  let completed = null
  const claims = getClaimsRaw().map(claim => {
    if (String(claim.id) !== String(claimId)) return claim
    completed = { ...claim, status: 'completed', progress: '已完成交接', handoverStatus: 'completed', handoverMethod: payload.method || claim.method, handoverRemark: payload.remark || '', completedAt: nowText() }
    return completed
  })
  setClaimsRaw(claims)
  if (completed) {
    setItemsRaw(getItemsRaw().map(item => String(item.id) === String(completed.itemId) ? { ...item, status: 'done', completedAt: nowText() } : item))
    createNotification({
      userId: completed.userId,
      type: 'claim',
      title: '物品交接已完成',
      content: `你关于「${getItemsRaw().find(i => String(i.id) === String(completed.itemId))?.name || '相关物品'}」的认领流程已完成。`,
      relatedId: completed.id
    })
  }
  return delay(completed || true)
}

export async function requestWrongReturn(claimId, reason = '') {
  // return request.put(`/api/claims/${claimId}/return-wrong`, { reason })
  let updated = null
  const claims = getClaimsRaw().map(claim => {
    if (String(claim.id) !== String(claimId)) return claim
    updated = { ...claim, claimType: 'wrong_return', status: 'wrong_return_pending', wrongReturnReason: reason, progress: '领错归还待审核', updatedAt: nowText() }
    return updated
  })
  setClaimsRaw(claims)
  return delay(updated)
}

export async function fetchAdminHandoverClaims() {
  // return request.get('/api/admin/claims?status=approved,handover_pending')
  const items = getItemsRaw()
  return delay(getClaimsRaw()
    .filter(c => ['approved', 'handover_pending'].includes(c.status))
    .map(c => ({ ...c, item: items.find(i => String(i.id) === String(c.itemId)) }))
    .sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)))
}
