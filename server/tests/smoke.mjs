/**
 * FindU 后端接口冒烟测试
 * 运行前请先启动服务：npm start
 * 使用：npm run test:api
 */

const BASE = process.env.API_BASE || 'http://127.0.0.1:4000'

let passCount = 0
let failCount = 0
const failures = []

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

async function test(name, fn) {
  try {
    await fn()
    passCount += 1
    console.log(`PASS  ${name}`)
  } catch (error) {
    failCount += 1
    failures.push({ name, message: error.message })
    console.log(`FAIL  ${name}\n      ${error.message}`)
  }
}

async function request(method, path, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const response = await fetch(`${BASE}${path}`, { method, headers, body: payload })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: response.status, data }
}

function assertStatus(result, expected, label) {
  expect(
    result.status === expected,
    `${label} 期望 HTTP ${expected}，实际 ${result.status}，响应：${JSON.stringify(result.data)?.slice(0, 300)}`
  )
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

async function main() {
  console.log(`\n=== FindU API 冒烟测试 @ ${BASE} ===\n`)

  const ctx = {}

  await test('GET /api/health 健康检查', async () => {
    const res = await request('GET', '/api/health')
    assertStatus(res, 200, 'health')
    expect(res.data.status === 'ok', 'health.status 应为 ok')
  })

  await test('GET /api/categories 分类列表', async () => {
    const res = await request('GET', '/api/categories')
    assertStatus(res, 200, 'categories')
    expect(Array.isArray(res.data) && res.data.length >= 5, '分类数量应 >= 5')
    ctx.category = res.data.find(item => item.name === '电子产品')
    expect(ctx.category, '应包含“电子产品”分类')
  })

  await test('POST /api/auth/login 学生登录', async () => {
    const res = await request('POST', '/api/auth/login', {
      body: { email: 'student@example.com', password: '123456' }
    })
    assertStatus(res, 200, 'login')
    expect(res.data.token, '应返回 token')
    expect(res.data.user.role === 'student', '角色应为 student')
    expect(res.data.user.password === undefined, '不应返回密码')
    ctx.studentToken = res.data.token
    ctx.student = res.data.user
  })

  await test('POST /api/auth/login 管理员登录', async () => {
    const res = await request('POST', '/api/auth/login', {
      body: { email: 'admin@example.com', password: '123456' }
    })
    assertStatus(res, 200, 'admin login')
    expect(res.data.user.role === 'admin', '角色应为 admin')
    ctx.adminToken = res.data.token
    ctx.admin = res.data.user
  })

  await test('POST /api/auth/login 密码错误返回 401', async () => {
    const res = await request('POST', '/api/auth/login', {
      body: { email: 'student@example.com', password: 'wrong-password' }
    })
    assertStatus(res, 401, 'bad login')
  })

  await test('GET /api/user/profile 需要登录（401）', async () => {
    const res = await request('GET', '/api/user/profile')
    assertStatus(res, 401, 'profile no token')
  })

  await test('GET /api/user/profile 读取当前用户', async () => {
    const res = await request('GET', '/api/user/profile', { token: ctx.studentToken })
    assertStatus(res, 200, 'profile')
    expect(res.data.email === 'student@example.com', 'profile.email 不匹配')
  })

  await test('PUT /api/user/profile 更新资料', async () => {
    const res = await request('PUT', '/api/user/profile', {
      token: ctx.studentToken,
      body: { phone: '13800001111' }
    })
    assertStatus(res, 200, 'update profile')
    expect(res.data.phone === '13800001111', 'phone 未更新')
  })

  await test('POST /api/user/avatar 需要登录（401）', async () => {
    const form = new FormData()
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'avatar.png')
    const res = await request('POST', '/api/user/avatar', { form })
    assertStatus(res, 401, 'avatar no token')
  })

  await test('POST /api/user/avatar 上传头像并可通过 /uploads 访问', async () => {
    const form = new FormData()
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'avatar.png')
    const res = await request('POST', '/api/user/avatar', { token: ctx.studentToken, form })
    assertStatus(res, 200, 'upload avatar')
    expect(res.data.avatar && res.data.avatar.startsWith('/uploads/'), '应返回 /uploads 头像地址')
    ctx.avatarPath = res.data.avatar

    const profile = await request('GET', '/api/user/profile', { token: ctx.studentToken })
    assertStatus(profile, 200, 'avatar profile')
    expect(profile.data.avatar === ctx.avatarPath, 'profile.avatar 应与上传结果一致')

    const staticRes = await fetch(`${BASE}${ctx.avatarPath}`)
    expect(staticRes.status === 200, `头像应可访问，实际 ${staticRes.status}`)
    expect(
      (staticRes.headers.get('content-type') || '').includes('image'),
      '头像 content-type 不是图片'
    )
  })

  await test('POST /api/user/avatar 再次上传会清理旧头像文件', async () => {
    const oldPath = ctx.avatarPath
    const form = new FormData()
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'avatar-2.png')
    const res = await request('POST', '/api/user/avatar', { token: ctx.studentToken, form })
    assertStatus(res, 200, 're-upload avatar')
    expect(res.data.avatar && res.data.avatar !== oldPath, '新头像地址应变化')
    ctx.avatarPath = res.data.avatar

    const removed = await fetch(`${BASE}${oldPath}`)
    expect(removed.status === 404, `旧头像应被清理，实际 ${removed.status}`)

    const kept = await fetch(`${BASE}${ctx.avatarPath}`)
    expect(kept.status === 200, `新头像应可访问，实际 ${kept.status}`)
  })

  await test('POST /api/user/avatar 不能修改他人头像（403）', async () => {
    const form = new FormData()
    form.append('userId', String(ctx.admin.id))
    form.append('file', new Blob([PNG], { type: 'image/png' }), 'avatar-other.png')
    const res = await request('POST', '/api/user/avatar', { token: ctx.studentToken, form })
    assertStatus(res, 403, 'avatar other user')

    const still = await fetch(`${BASE}${ctx.avatarPath}`)
    expect(still.status === 200, '越权失败后不应影响当前头像')
  })

  await test('POST /api/user/avatar 伪造图片被拒绝（422）', async () => {
    const form = new FormData()
    form.append('file', new Blob([Buffer.from('not an image at all')], { type: 'image/png' }), 'fake.png')
    const res = await request('POST', '/api/user/avatar', { token: ctx.studentToken, form })
    assertStatus(res, 422, 'fake avatar')
  })

  await test('POST /api/user/avatar 非法类型被拒绝（422）', async () => {
    const form = new FormData()
    form.append('file', new Blob([Buffer.from('hello')], { type: 'text/plain' }), 'note.txt')
    const res = await request('POST', '/api/user/avatar', { token: ctx.studentToken, form })
    assertStatus(res, 422, 'invalid avatar type')
  })

  await test('POST /api/user/avatar 超出 5MB 返回 413', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1)
    const form = new FormData()
    form.append('file', new Blob([big], { type: 'image/png' }), 'big-avatar.png')
    const res = await request('POST', '/api/user/avatar', { token: ctx.studentToken, form })
    assertStatus(res, 413, 'oversize avatar')
  })

  await test('GET /api/lost-found/items 分页列表', async () => {
    const res = await request('GET', '/api/lost-found/items?page=1&page_size=5')
    assertStatus(res, 200, 'items list')
    expect(Array.isArray(res.data.list), '应返回 list 数组')
    expect(res.data.page === 1 && res.data.page_size === 5, '分页字段不正确')
    expect(res.data.total >= 10, `approved 帖子应 >= 10，实际 ${res.data.total}`)
    expect(res.data.list.length <= 5, '单页数量不应超过 page_size')
    expect(res.data.list.every(item => item.auditStatus === 'approved'), '公开列表只应包含 approved')
    ctx.seedItemId = res.data.list[0].id
  })

  await test('GET /api/lost-found/items 关键词 / 类型 / 分类筛选', async () => {
    const byKeyword = await request('GET', '/api/lost-found/items?keyword=耳机')
    assertStatus(byKeyword, 200, 'keyword filter')
    expect(byKeyword.data.list.length >= 1, '关键词应命中至少 1 条')

    const byType = await request('GET', '/api/lost-found/items?type=found')
    assertStatus(byType, 200, 'type filter')
    expect(byType.data.list.every(item => item.type === 'found'), 'type 过滤失效')

    const byCategory = await request('GET', `/api/lost-found/items?category=${encodeURIComponent('电子产品')}`)
    assertStatus(byCategory, 200, 'category filter')
    expect(
      byCategory.data.list.every(item => item.category === '电子产品'),
      'category 过滤失效'
    )

    const byPhoto = await request('GET', '/api/lost-found/items?hasPhoto=with')
    assertStatus(byPhoto, 200, 'hasPhoto filter')
    expect(byPhoto.data.list.every(item => item.image), 'hasPhoto=with 过滤失效')
  })

  await test('GET /api/lost-found/items/:id 详情', async () => {
    const res = await request('GET', `/api/lost-found/items/${ctx.seedItemId}`)
    assertStatus(res, 200, 'item detail')
    expect(res.data.id === ctx.seedItemId, '详情 id 不匹配')
    expect(typeof res.data.category === 'string', 'category 应为名称字符串')
  })

  await test('GET /api/lost-found/items/:id 不存在返回 404', async () => {
    const res = await request('GET', '/api/lost-found/items/999999')
    assertStatus(res, 404, 'item not found')
  })

  await test('GET /api/admin/items 学生访问返回 403', async () => {
    const res = await request('GET', '/api/admin/items', { token: ctx.studentToken })
    assertStatus(res, 403, 'student admin block')
  })

  await test('POST /api/lost-found/items 发布帖子（待审核）', async () => {
    const res = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: {
        type: 'found',
        name: '冒烟测试-黑色雨伞',
        category: '生活用品',
        location: 'B 教学楼',
        happenTime: '2026-11-08 10:00',
        description: '测试用招领信息',
        contact: '值班室',
        claimHint: '请说明伞柄颜色'
      }
    })
    assertStatus(res, 201, 'create item')
    expect(res.data.auditStatus === 'pending', '新帖应为 pending')
    expect(res.data.status === 'open', '新帖状态应为 open')
    expect(res.data.storageCode.startsWith('LF-'), 'found 类型应生成保管编号')
    ctx.newItemId = res.data.id
  })

  await test('GET /api/lost-found/items/:id 未审核帖子匿名不可见（404）', async () => {
    const res = await request('GET', `/api/lost-found/items/${ctx.newItemId}`)
    assertStatus(res, 404, 'pending item hidden')
  })

  await test('POST /api/lost-found/items/:id/images 上传图片并静态访问', async () => {
    const form = new FormData()
    form.append('images', new Blob([PNG], { type: 'image/png' }), 'smoke.png')

    const res = await request('POST', `/api/lost-found/items/${ctx.newItemId}/images`, {
      token: ctx.studentToken,
      form
    })
    assertStatus(res, 200, 'upload image')
    expect(res.data.images.length === 1, '应返回 1 张图片')
    expect(res.data.image.startsWith('/uploads/'), 'image 应为 /uploads 路径')
    ctx.imagePath = res.data.image

    const staticRes = await fetch(`${BASE}${ctx.imagePath}`)
    expect(staticRes.status === 200, `静态图片访问失败：${staticRes.status}`)
    expect((staticRes.headers.get('content-type') || '').includes('image'), '静态资源 content-type 不是图片')
  })

  await test('GET /api/admin/items 管理员按待审核筛选', async () => {
    const res = await request('GET', '/api/admin/items?audit_status=pending&page_size=50', {
      token: ctx.adminToken
    })
    assertStatus(res, 200, 'admin items')
    expect(res.data.list.some(item => item.id === ctx.newItemId), '待审核列表应包含新帖')
    expect(res.data.list.every(item => item.auditStatus === 'pending'), 'audit_status 过滤失效')
  })

  await test('PUT /api/admin/items/:id/audit 审核通过并生成保管记录', async () => {
    const res = await request('PUT', `/api/admin/items/${ctx.newItemId}/audit`, {
      token: ctx.adminToken,
      body: { audit_status: 'approved', reject_reason: '' }
    })
    assertStatus(res, 200, 'audit item')
    expect(res.data.auditStatus === 'approved', '审核后应为 approved')

    const detail = await request('GET', `/api/lost-found/items/${ctx.newItemId}`)
    assertStatus(detail, 200, 'approved item detail')
  })

  await test('PUT /api/lost-found/items/:id/status 更新状态', async () => {
    const res = await request('PUT', `/api/lost-found/items/${ctx.newItemId}/status`, {
      token: ctx.studentToken,
      body: { status: 'claiming' }
    })
    assertStatus(res, 200, 'update status')
    expect(res.data.status === 'claiming', '状态未更新为 claiming')
  })

  await test('POST /api/claims 学生 B 提交认领申请', async () => {
    const login = await request('POST', '/api/auth/login', {
      body: { email: 'wang@example.com', password: '123456' }
    })
    assertStatus(login, 200, 'wang login')
    ctx.wangToken = login.data.token
    ctx.wang = login.data.user

    const res = await request('POST', '/api/claims', {
      token: ctx.wangToken,
      body: {
        itemId: ctx.newItemId,
        method: 'offline',
        proofText: '这把伞的伞柄是深棕色，握把处有一条划痕，今天上午落在 B201。',
        phone: '13900002222'
      }
    })
    assertStatus(res, 201, 'create claim')
    expect(res.data.status === 'pending', '申请初始状态应为 pending')
    expect(res.data.score > 0, '应返回匹配分数')
    expect(res.data.phone === '13900002222', '本人提交的认领应返回完整手机号')
    ctx.claimId = res.data.id
  })

  await test('GET /api/my/claims 我的认领列表', async () => {
    const res = await request('GET', '/api/my/claims', { token: ctx.wangToken })
    assertStatus(res, 200, 'my claims')
    expect(res.data.list.some(claim => claim.id === ctx.claimId), '我的认领应包含新申请')
    expect(res.data.list.every(claim => claim.item), '认领记录应带 item')
  })

  await test('GET /api/admin/claims 管理员认领列表', async () => {
    const res = await request('GET', '/api/admin/claims?status=pending&page_size=50', {
      token: ctx.adminToken
    })
    assertStatus(res, 200, 'admin claims')
    expect(res.data.list.some(claim => claim.id === ctx.claimId), '管理员列表应包含新申请')
  })

  await test('PUT /api/admin/claims/:id/audit 审核通过 → 待交接', async () => {
    const res = await request('PUT', `/api/admin/claims/${ctx.claimId}/audit`, {
      token: ctx.adminToken,
      body: { status: 'approved', audit_reason: '特征吻合' }
    })
    assertStatus(res, 200, 'audit claim')
    expect(res.data.status === 'handover_pending', `审核通过后应为 handover_pending，实际 ${res.data.status}`)

    const item = await request('GET', `/api/lost-found/items/${ctx.newItemId}`, { token: ctx.adminToken })
    assertStatus(item, 200, 'item after claim approve')
    expect(item.data.status === 'claiming', '物品状态应变为 claiming')
  })

  await test('POST /api/handover-records 完成交接', async () => {
    const res = await request('POST', '/api/handover-records', {
      token: ctx.adminToken,
      body: { claim_id: ctx.claimId, method: 'offline', remark: '当面核验后交接' }
    })
    assertStatus(res, 201, 'handover')
    expect(res.data.status === 'completed', '交接后认领状态应为 completed')
    expect(res.data.phone === '139****2222', `管理员查看交接记录手机号应脱敏，实际 ${res.data.phone}`)

    const item = await request('GET', `/api/lost-found/items/${ctx.newItemId}`)
    assertStatus(item, 200, 'item after handover')
    expect(item.data.status === 'done', '物品状态应为 done')
  })

  await test('POST /api/favorites 收藏 + GET 列表 + DELETE 取消', async () => {
    const add = await request('POST', '/api/favorites', {
      token: ctx.studentToken,
      body: { itemId: ctx.seedItemId }
    })
    assertStatus(add, 201, 'favorite add')
    expect(add.data.favorited === true, '应返回 favorited=true')

    const list = await request('GET', '/api/favorites', { token: ctx.studentToken })
    assertStatus(list, 200, 'favorite list')
    expect(list.data.list.some(row => row.itemId === ctx.seedItemId), '收藏列表应包含该物品')
    expect(list.data.list.every(row => row.item), '收藏项应带 item 详情')

    const favoriteRow = list.data.list.find(row => row.itemId === ctx.seedItemId)
    const remove = await request('DELETE', `/api/favorites/${favoriteRow.id}`, {
      token: ctx.studentToken
    })
    assertStatus(remove, 200, 'favorite remove')
    expect(remove.data.success === true, '取消收藏应返回 success')

    const after = await request('GET', '/api/favorites', { token: ctx.studentToken })
    expect(!after.data.list.some(row => row.itemId === ctx.seedItemId), '取消后收藏列表不应包含该物品')
  })

  await test('POST /api/favorites/toggle 收藏开关', async () => {
    const on = await request('POST', '/api/favorites/toggle', {
      token: ctx.studentToken,
      body: { item_id: ctx.seedItemId }
    })
    assertStatus(on, 200, 'toggle on')
    expect(on.data.favorited === true, '第一次 toggle 应为 true')

    const off = await request('POST', '/api/favorites/toggle', {
      token: ctx.studentToken,
      body: { item_id: ctx.seedItemId }
    })
    assertStatus(off, 200, 'toggle off')
    expect(off.data.favorited === false, '第二次 toggle 应为 false')
  })

  await test('GET /api/notifications 列表 + 标记已读 + 全部已读', async () => {
    const list = await request('GET', '/api/notifications?page_size=50', { token: ctx.studentToken })
    assertStatus(list, 200, 'notifications')
    expect(Array.isArray(list.data.list), '应返回 list')
    expect(list.data.list.some(row => row.userId === null), '应包含全站公告通知')
    expect(typeof list.data.unread === 'number', '应返回未读数量')

    const target = list.data.list[0]
    const read = await request('PUT', `/api/notifications/${target.id}/read`, { token: ctx.studentToken })
    assertStatus(read, 200, 'notification read')
    expect(read.data.read === true, '通知应标记为已读')

    const readAll = await request('PUT', '/api/notifications/read-all', { token: ctx.studentToken })
    assertStatus(readAll, 200, 'notification read-all')

    const after = await request('GET', '/api/notifications', { token: ctx.studentToken })
    expect(after.data.unread === 0, `全部已读后 unread 应为 0，实际 ${after.data.unread}`)
  })

  await test('GET /api/my/lost-found/items 我的发布', async () => {
    const res = await request('GET', '/api/my/lost-found/items', { token: ctx.studentToken })
    assertStatus(res, 200, 'my items')
    expect(res.data.list.some(item => item.id === ctx.newItemId), '我的发布应包含新帖')
    expect(res.data.list.every(item => item.userId === ctx.student.id), '只应包含自己的帖子')
  })

  await test('GET /api/my/verification 无记录返回 none', async () => {
    const res = await request('GET', '/api/my/verification', { token: ctx.wangToken })
    assertStatus(res, 200, 'my verification')
    expect(['none', 'pending', 'approved'].includes(res.data.status), 'status 不合法')
  })

  await test('POST /api/verifications 提交实名认证', async () => {
    const res = await request('POST', '/api/verifications', {
      token: ctx.wangToken,
      body: { level: 'full', realName: '王同学', studentNo: '2026000001', phone: '13900003333' }
    })
    assertStatus(res, 201, 'submit verification')
    expect(res.data.status === 'pending', '提交后应为 pending')
    ctx.verificationId = res.data.id
  })

  await test('GET /api/admin/verifications + 审核通过', async () => {
    const list = await request('GET', '/api/admin/verifications?status=pending&page_size=50', {
      token: ctx.adminToken
    })
    assertStatus(list, 200, 'admin verifications')
    expect(list.data.list.some(row => row.id === ctx.verificationId), '审核列表应包含申请')

    const audit = await request('PUT', `/api/admin/verifications/${ctx.verificationId}/audit`, {
      token: ctx.adminToken,
      body: { status: 'approved' }
    })
    assertStatus(audit, 200, 'audit verification')
    expect(audit.data.status === 'approved', '认证状态应为 approved')

    const profile = await request('GET', '/api/user/profile', { token: ctx.wangToken })
    expect(profile.data.verificationLevel === 'full', '用户认证等级应升级为 full')
  })

  await test('GET /api/admin/dashboard 总览统计', async () => {
    const res = await request('GET', '/api/admin/dashboard', { token: ctx.adminToken })
    assertStatus(res, 200, 'dashboard')
    expect(res.data.total >= 13, `帖子总数应 >= 13，实际 ${res.data.total}`)
    expect(res.data.approved >= 11, 'approved 统计异常')
    expect(Array.isArray(res.data.categories), 'categories 应为数组')
    expect(Array.isArray(res.data.locations), 'locations 应为数组')
    expect(Array.isArray(res.data.todos), 'todos 应为数组')
    expect(res.data.claims >= 4, 'claims 统计异常')
  })

  await test('GET /api/admin/overdue-items + 移交滞留物品', async () => {
    const list = await request('GET', '/api/admin/overdue-items?page_size=50', { token: ctx.adminToken })
    assertStatus(list, 200, 'overdue list')
    expect(list.data.list.length >= 1, '应有保管记录')
    expect(list.data.list.every(row => row.item), '保管记录应带 item')

    const target = list.data.list.find(row => row.disposalStatus !== 'transferred') || list.data.list[0]
    const transfer = await request('PUT', `/api/admin/overdue-items/${target.id}/transfer`, {
      token: ctx.adminToken,
      body: { handover_target: '校保卫处', remark: '超期统一移交' }
    })
    assertStatus(transfer, 200, 'transfer')
    expect(transfer.data.disposalStatus === 'transferred', '移交后状态应为 transferred')
    expect(transfer.data.handoverTarget === '校保卫处', '移交去向未保存')
  })

  await test('GET /api/admin/announcements + POST 发布公告', async () => {
    const before = await request('GET', '/api/admin/announcements', { token: ctx.adminToken })
    assertStatus(before, 200, 'admin announcements')

    const create = await request('POST', '/api/admin/announcements', {
      token: ctx.adminToken,
      body: { title: '冒烟测试公告', content: '这是一条自动化测试公告', status: 'published' }
    })
    assertStatus(create, 201, 'create announcement')
    expect(create.data.status === 'published', '公告状态应为 published')

    const publicList = await request('GET', '/api/announcements')
    assertStatus(publicList, 200, 'public announcements')
    expect(publicList.data.list.some(row => row.id === create.data.id), '公开公告列表应包含新公告')
  })

  await test('GET /api/admin/disputes + 处理争议', async () => {
    const list = await request('GET', '/api/admin/disputes', { token: ctx.adminToken })
    assertStatus(list, 200, 'disputes')
    expect(list.data.list.length >= 1, '应有争议记录')

    const target = list.data.list.find(row => row.status !== 'resolved') || list.data.list[0]
    const resolve = await request('PUT', `/api/admin/disputes/${target.id}/resolve`, {
      token: ctx.adminToken,
      body: { result: '已核对双方材料，物品归还失主' }
    })
    assertStatus(resolve, 200, 'resolve dispute')
    expect(resolve.data.status === 'resolved', '争议应标记为 resolved')
    expect(resolve.data.result.length > 0, '应保存处理结论')
  })

  await test('POST /api/auth/send-email-code + 注册 + 登录', async () => {
    const email = `smoke_${Date.now()}@example.com`
    const send = await request('POST', '/api/auth/send-email-code', {
      body: { email, type: 'register' }
    })
    assertStatus(send, 200, 'send email code')
    expect(send.data.devCode, '开发环境应返回 devCode')

    const register = await request('POST', '/api/auth/register', {
      body: { username: '冒烟用户', email, password: 'Findu123456', emailCode: send.data.devCode }
    })
    assertStatus(register, 201, 'register')
    expect(register.data.token, '注册应返回 token')
    expect(register.data.user.role === 'student', '新用户角色应为 student')
    ctx.smokeUserId = register.data.user.id
    ctx.smokeToken = register.data.token

    const resend = await request('POST', '/api/auth/send-email-code', {
      body: { email, type: 'register' }
    })
    assertStatus(resend, 200, 'resend email code')

    const duplicate = await request('POST', '/api/auth/register', {
      body: { username: '冒烟用户2', email, password: 'Findu123456', emailCode: resend.data.devCode }
    })
    assertStatus(duplicate, 409, 'duplicate register')

    const login = await request('POST', '/api/auth/login', {
      body: { email, password: 'Findu123456' }
    })
    assertStatus(login, 200, 'new user login')
  })

  await test('GET /api/admin/users 用户检索', async () => {
    const res = await request('GET', '/api/admin/users?keyword=wang', { token: ctx.adminToken })
    assertStatus(res, 200, 'admin users')
    expect(res.data.list.some(row => row.email === 'wang@example.com'), '应命中 wang 用户')
    expect(res.data.list.every(row => row.role !== 'admin'), '不应返回管理员')
    expect('publishTotal' in res.data.list[0], '应包含 publishTotal 统计')
  })

  await test('POST /risk-users/:id/blacklist 限制发布 → 发布被拦截 → 解除', async () => {
    const email = `block_${Date.now()}@example.com`
    const send = await request('POST', '/api/auth/send-email-code', {
      body: { email, type: 'register' }
    })
    assertStatus(send, 200, 'blocked user send code')
    const register = await request('POST', '/api/auth/register', {
      body: { username: '受限用户', email, password: 'Findu123456', emailCode: send.data.devCode }
    })
    assertStatus(register, 201, 'blocked user register')
    const blockedUserId = register.data.user.id
    const blockedToken = register.data.token

    const add = await request('POST', `/api/admin/risk-users/${blockedUserId}/blacklist`, {
      token: ctx.adminToken,
      body: { reason: '冒烟测试限制', level: 'blocked', limitType: 'publish' }
    })
    assertStatus(add, 201, 'add blacklist')
    expect(add.data.userId === blockedUserId, '黑名单 userId 不匹配')

    const blockRes = await request('POST', '/api/lost-found/items', {
      token: blockedToken,
      body: { type: 'found', name: '被拦截的帖子', category: '其他' }
    })
    assertStatus(blockRes, 403, 'blocked publish')
    expect(blockRes.data.code === 'user_blocked', '应返回 user_blocked')

    const remove = await request('POST', `/api/admin/risk-users/${blockedUserId}/remove-blacklist`, {
      token: ctx.adminToken,
      body: { releaseReason: '冒烟测试结束' }
    })
    assertStatus(remove, 200, 'remove blacklist')
    expect(remove.data.released >= 1, '应至少解除 1 条限制')

    const afterRemove = await request('POST', '/api/lost-found/items', {
      token: blockedToken,
      body: { type: 'lost', name: '解除后可发布', category: '其他' }
    })
    assertStatus(afterRemove, 201, 'publish after release')
  })

  await test('GET /api/admin/risk-users 风险用户列表', async () => {
    const res = await request('GET', '/api/admin/risk-users?page_size=50', { token: ctx.adminToken })
    assertStatus(res, 200, 'risk users')
    expect(Array.isArray(res.data.list), '应返回 list')
    expect(res.data.list.length >= 1, '应有黑名单记录')
  })

  await test('GET /api/admin/analytics 数据分析', async () => {
    const res = await request('GET', '/api/admin/analytics', { token: ctx.adminToken })
    assertStatus(res, 200, 'analytics')
    expect(typeof res.data.activeUsers === 'number', 'activeUsers 应为数字')
    expect(typeof res.data.successRate === 'number', 'successRate 应为数字')
    expect(Array.isArray(res.data.hotLocations), 'hotLocations 应为数组')
    expect(Array.isArray(res.data.claimStages) && res.data.claimStages.length === 4, 'claimStages 应为 4 段')

    const stats = res.data.itemStatusStats
    expect(Array.isArray(stats) && stats.length === 4, 'itemStatusStats 应为 4 项')
    expect(
      stats.every(
        row =>
          typeof row.status === 'string' &&
          typeof row.name === 'string' &&
          row.name.length > 0 &&
          typeof row.value === 'number' &&
          typeof row.percent === 'number' &&
          typeof row.type === 'string'
      ),
      'itemStatusStats 每项应含 status/name/value/percent/type'
    )
    expect(
      stats.some(row => row.status === 'open' && row.name === '寻找中'),
      'itemStatusStats 应包含 open → 寻找中'
    )
    expect(
      stats.reduce((sum, row) => sum + row.value, 0) >= 1,
      'itemStatusStats 数量合计应大于 0'
    )

    const trend = res.data.dailyTrend
    expect(Array.isArray(trend) && trend.length === 7, 'dailyTrend 应补齐为 7 天')
    expect(
      trend.every(
        row =>
          /^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
          typeof row.items === 'number' &&
          typeof row.claims === 'number'
      ),
      'dailyTrend 每项应含 date/items/claims'
    )
    expect(
      trend.every((row, index) => index === 0 || row.date > trend[index - 1].date),
      'dailyTrend 应按日期升序'
    )
    const today = trend[trend.length - 1].date
    expect(today === new Date().toLocaleDateString('sv-SE'), `dailyTrend 末位应为今天，实际 ${today}`)
    expect(trend[trend.length - 1].items >= 1, '今天的 items 应包含本次测试新建的帖子')
  })

  await test('DELETE /api/admin/items/:id 管理员下架', async () => {
    const res = await request('DELETE', `/api/admin/items/${ctx.newItemId}`, { token: ctx.adminToken })
    assertStatus(res, 200, 'admin delete item')
    expect(res.data.success === true, '下架应返回 success')

    const detail = await request('GET', `/api/lost-found/items/${ctx.newItemId}`, { token: ctx.adminToken })
    assertStatus(detail, 404, 'deleted item detail')
  })

  await test('手机号口径：本人查看返回完整号码', async () => {
    const profile = await request('GET', '/api/user/profile', { token: ctx.studentToken })
    assertStatus(profile, 200, 'self profile')
    expect(profile.data.phone === '13800001111', `本人资料应返回完整手机号，实际 ${profile.data.phone}`)

    const myClaims = await request('GET', '/api/my/claims?page_size=50', { token: ctx.studentToken })
    assertStatus(myClaims, 200, 'self claims')
    const claim = myClaims.data.list.find(row => row.phone === '13800138000')
    expect(claim, '本人认领列表应返回完整手机号')
    ctx.seedClaimId = claim.id

    const myVerification = await request('GET', '/api/my/verification', { token: ctx.wangToken })
    assertStatus(myVerification, 200, 'self verification')
    expect(
      myVerification.data.phone === '13900003333',
      `本人认证应返回完整手机号，实际 ${myVerification.data.phone}`
    )
  })

  await test('手机号口径：管理端与第三方一律脱敏', async () => {
    const users = await request('GET', '/api/admin/users?keyword=student@example.com&page_size=50', {
      token: ctx.adminToken
    })
    assertStatus(users, 200, 'admin users')
    const student = users.data.list.find(row => row.email === 'student@example.com')
    expect(student, '管理端用户列表应包含学生账号')
    expect(student.phone === '138****1111', `管理端用户手机号应脱敏，实际 ${student.phone}`)

    const claims = await request('GET', '/api/admin/claims?page_size=50', { token: ctx.adminToken })
    assertStatus(claims, 200, 'admin claims')
    const claim = claims.data.list.find(row => row.id === ctx.seedClaimId)
    expect(claim, '管理端认领列表应包含该申请')
    expect(claim.phone === '138****8000', `管理端认领手机号应脱敏，实际 ${claim.phone}`)

    const verifications = await request('GET', '/api/admin/verifications?page_size=50', {
      token: ctx.adminToken
    })
    assertStatus(verifications, 200, 'admin verifications')
    const verification = verifications.data.list.find(row => row.id === ctx.verificationId)
    expect(verification, '管理端认证列表应包含该申请')
    expect(
      verification.phone === '139****3333',
      `管理端认证手机号应脱敏，实际 ${verification.phone}`
    )
  })

  await test('POST /api/auth/logout 登出', async () => {
    const res = await request('POST', '/api/auth/logout', { token: ctx.studentToken })
    assertStatus(res, 200, 'logout')
    expect(res.data.success === true, 'logout 应返回 success')
  })

  /* ==================== 联调准备：CORS / 静态资源 ==================== */

  await test('OPTIONS 预检请求允许本地前端端口 5173', async () => {
    const response = await fetch(`${BASE}/api/lost-found/items`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    })
    expect([200, 204].includes(response.status), `预检应返回 200/204，实际 ${response.status}`)
    expect(
      response.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      '预检应回显 Origin'
    )
    expect(
      (response.headers.get('access-control-allow-headers') || '').toLowerCase().includes('authorization'),
      '预检应允许 Authorization 头'
    )
  })

  await test('OPTIONS 预检请求允许本地前端端口 5188', async () => {
    const response = await fetch(`${BASE}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5188',
        'Access-Control-Request-Method': 'POST'
      }
    })
    expect([200, 204].includes(response.status), `预检应返回 200/204，实际 ${response.status}`)
    expect(
      response.headers.get('access-control-allow-origin') === 'http://localhost:5188',
      '预检应回显 5188 端口 Origin'
    )
  })

  await test('GET /uploads 静态图片跨域可读', async () => {
    const response = await fetch(`${BASE}${ctx.imagePath}`, {
      headers: { Origin: 'http://localhost:5173' }
    })
    expect(response.status === 200, `静态图片应可访问，实际 ${response.status}`)
    expect(
      response.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      '静态资源应返回 CORS 头'
    )
    expect(
      response.headers.get('cross-origin-resource-policy') === 'cross-origin',
      '静态资源应允许跨域读取'
    )
  })

  /* ==================== 分页边界 ==================== */

  await test('GET 分页越界返回空列表而非报错', async () => {
    const res = await request('GET', '/api/lost-found/items?page=9999&page_size=10')
    assertStatus(res, 200, 'page overflow')
    expect(Array.isArray(res.data.list) && res.data.list.length === 0, '越界页应返回空 list')
    expect(res.data.total >= 10, '越界页仍应返回 total')
    expect(res.data.page === 9999, '应回显请求页')

    const capped = await request('GET', '/api/lost-found/items?page=999999')
    assertStatus(capped, 200, 'absurd page')
    expect(capped.data.page === 100000, '超大页码应被裁剪到上限 100000')
  })

  await test('GET page_size 超上限被裁剪为 100', async () => {
    const res = await request('GET', '/api/lost-found/items?page_size=1000')
    assertStatus(res, 200, 'page_size clamp')
    expect(res.data.page_size === 100, `page_size 应裁剪为 100，实际 ${res.data.page_size}`)
  })

  await test('GET 非法 page 参数回落为第 1 页', async () => {
    const res = await request('GET', '/api/lost-found/items?page=abc&page_size=-5')
    assertStatus(res, 200, 'invalid page')
    expect(res.data.page === 1, '非法 page 应为 1')
    expect(res.data.page_size === 10, '非法 page_size 应用默认值 10')
  })

  /* ==================== 非法 id / 已下架资源 ==================== */

  await test('非法 id 统一返回 404，不产生 500', async () => {
    const item = await request('GET', '/api/lost-found/items/abc')
    assertStatus(item, 404, 'item abc')

    const status = await request('PUT', '/api/lost-found/items/abc/status', {
      token: ctx.studentToken,
      body: { status: 'done' }
    })
    assertStatus(status, 404, 'status abc')

    const claim = await request('PUT', '/api/claims/abc/return-wrong', {
      token: ctx.studentToken,
      body: { reason: '测试' }
    })
    assertStatus(claim, 404, 'claim abc')

    const verification = await request('PUT', '/api/admin/verifications/abc/audit', {
      token: ctx.adminToken,
      body: { status: 'approved' }
    })
    assertStatus(verification, 404, 'verification abc')

    const blacklist = await request('PUT', '/api/admin/blacklists/abc/release', {
      token: ctx.adminToken,
      body: { releaseReason: '测试' }
    })
    assertStatus(blacklist, 404, 'blacklist abc')
  })

  await test('已下架帖子不可再改状态 / 再提交认领', async () => {
    const status = await request('PUT', `/api/lost-found/items/${ctx.newItemId}/status`, {
      token: ctx.studentToken,
      body: { status: 'open' }
    })
    assertStatus(status, 404, 'status deleted item')

    const claim = await request('POST', '/api/claims', {
      token: ctx.wangToken,
      body: { itemId: ctx.newItemId, method: 'offline', proofText: '已下架物品' }
    })
    assertStatus(claim, 404, 'claim deleted item')
  })

  /* ==================== 输入校验 ==================== */

  await test('注册校验：邮箱格式 / 密码强度 / 用户名长度', async () => {
    const badEmail = await request('POST', '/api/auth/register', {
      body: { username: '测试用户', email: 'not-an-email', password: 'Findu123456', emailCode: '123456' }
    })
    assertStatus(badEmail, 422, 'bad email')

    const weakPassword = await request('POST', '/api/auth/register', {
      body: { username: '测试用户', email: `weak_${Date.now()}@example.com`, password: '123456', emailCode: '123456' }
    })
    assertStatus(weakPassword, 422, 'weak password')

    const longName = await request('POST', '/api/auth/register', {
      body: {
        username: '超'.repeat(30),
        email: `long_${Date.now()}@example.com`,
        password: 'Findu123456',
        emailCode: '123456'
      }
    })
    assertStatus(longName, 422, 'long username')
  })

  await test('资料校验：手机号 / 学号 / 头像长度', async () => {
    const badPhone = await request('PUT', '/api/user/profile', {
      token: ctx.studentToken,
      body: { phone: '12345' }
    })
    assertStatus(badPhone, 422, 'bad phone')

    const badStudentNo = await request('PUT', '/api/user/profile', {
      token: ctx.studentToken,
      body: { studentNo: '12' }
    })
    assertStatus(badStudentNo, 422, 'bad studentNo')

    const longAvatar = await request('PUT', '/api/user/profile', {
      token: ctx.studentToken,
      body: { avatar: `https://example.com/${'a'.repeat(400)}.png` }
    })
    assertStatus(longAvatar, 422, 'long avatar')
  })

  await test('发布校验：类型 / 必填 / 长度 / 分类', async () => {
    const badType = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: { type: 'unknown', name: '测试物品', category: '其他' }
    })
    assertStatus(badType, 422, 'bad type')

    const emptyName = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: { type: 'lost', name: '   ', category: '其他' }
    })
    assertStatus(emptyName, 422, 'empty name')

    const longName = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: { type: 'lost', name: '物'.repeat(61), category: '其他' }
    })
    assertStatus(longName, 422, 'long item name')

    const badCategory = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: { type: 'lost', name: '分类不存在的物品', category: '不存在的分类' }
    })
    assertStatus(badCategory, 422, 'bad category')
  })

  await test('状态流转校验：非法状态返回 422', async () => {
    const res = await request('PUT', `/api/lost-found/items/${ctx.seedItemId}/status`, {
      token: ctx.studentToken,
      body: { status: 'unknown' }
    })
    assertStatus(res, 422, 'invalid status')
  })

  await test('上传校验：伪造图片被拒绝（422）', async () => {
    const publish = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: { type: 'found', name: '冒烟测试-上传校验物品', category: '其他' }
    })
    assertStatus(publish, 201, 'publish upload item')
    ctx.uploadItemId = publish.data.id

    const form = new FormData()
    form.append('images', new Blob([Buffer.from('not an image at all')], { type: 'image/png' }), 'fake.png')

    const res = await request('POST', `/api/lost-found/items/${ctx.uploadItemId}/images`, {
      token: ctx.studentToken,
      form
    })
    assertStatus(res, 422, 'fake image')
  })

  await test('上传校验：超出 5MB 返回 413', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1)
    const form = new FormData()
    form.append('images', new Blob([big], { type: 'image/png' }), 'big.png')

    const res = await request('POST', `/api/lost-found/items/${ctx.uploadItemId}/images`, {
      token: ctx.studentToken,
      form
    })
    assertStatus(res, 413, 'oversize image')
  })

  /* ==================== 认领业务边界 ==================== */

  await test('认领边界：不能认领自己的帖子 / 不能重复提交', async () => {
    const publish = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: {
        type: 'found',
        name: '冒烟测试-认领边界物品',
        category: '其他',
        location: '图书馆'
      }
    })
    assertStatus(publish, 201, 'publish boundary item')
    const boundaryItemId = publish.data.id

    const approve = await request('PUT', `/api/admin/items/${boundaryItemId}/audit`, {
      token: ctx.adminToken,
      body: { status: 'approved' }
    })
    assertStatus(approve, 200, 'approve boundary item')

    const own = await request('POST', '/api/claims', {
      token: ctx.studentToken,
      body: { itemId: boundaryItemId, method: 'offline', proofText: '我自己认领自己的物品' }
    })
    assertStatus(own, 422, 'claim own item')

    const first = await request('POST', '/api/claims', {
      token: ctx.wangToken,
      body: { itemId: boundaryItemId, method: 'offline', proofText: '这是我的物品，特征是蓝色贴纸' }
    })
    assertStatus(first, 201, 'first claim')
    ctx.boundaryClaimId = first.data.id

    const duplicated = await request('POST', '/api/claims', {
      token: ctx.wangToken,
      body: { itemId: boundaryItemId, method: 'offline', proofText: '重复提交' }
    })
    assertStatus(duplicated, 409, 'duplicate claim')

    const mailWithoutAddress = await request('POST', '/api/claims', {
      token: ctx.smokeToken,
      body: { itemId: boundaryItemId, method: 'mail', proofText: '邮寄认领但不填地址' }
    })
    assertStatus(mailWithoutAddress, 422, 'mail without address')
  })

  await test('领错归还：未完成交接的认领返回 422', async () => {
    const res = await request('PUT', `/api/claims/${ctx.boundaryClaimId}/return-wrong`, {
      token: ctx.wangToken,
      body: { reason: '尚未完成交接' }
    })
    assertStatus(res, 422, 'return wrong before completed')
  })

  /* ==================== 权限矩阵 ==================== */

  await test('权限矩阵：学生访问全部管理端接口均返回 403', async () => {
    const endpoints = [
      ['GET', '/api/admin/dashboard'],
      ['GET', '/api/admin/items'],
      ['GET', '/api/admin/claims'],
      ['GET', '/api/admin/overdue-items'],
      ['GET', '/api/admin/announcements'],
      ['POST', '/api/admin/announcements'],
      ['GET', '/api/admin/disputes'],
      ['GET', '/api/admin/risk-users'],
      ['GET', '/api/admin/blacklists'],
      ['GET', '/api/admin/analytics'],
      ['GET', '/api/admin/users'],
      ['GET', '/api/admin/verifications']
    ]

    for (const [method, path] of endpoints) {
      const res = await request(method, path, {
        token: ctx.studentToken,
        ...(method === 'POST' ? { body: { title: '越权公告', content: '越权内容' } } : {})
      })
      assertStatus(res, 403, `${method} ${path}`)
    }
  })

  await test('权限矩阵：学生不能修改 / 删除他人帖子', async () => {
    const update = await request('PUT', `/api/lost-found/items/${ctx.seedItemId}/status`, {
      token: ctx.studentToken,
      body: { status: 'done' }
    })
    expect([200, 403].includes(update.status), `应返回 200/403，实际 ${update.status}`)

    // 找一条不属于当前学生的帖子
    const list = await request('GET', '/api/lost-found/items?page_size=50')
    const others = list.data.list.find(item => item.userId !== ctx.student.id)
    expect(others, '应存在其他用户的帖子')

    const foreignUpdate = await request('PUT', `/api/lost-found/items/${others.id}/status`, {
      token: ctx.studentToken,
      body: { status: 'done' }
    })
    assertStatus(foreignUpdate, 403, 'update foreign item')

    const foreignDelete = await request('DELETE', `/api/lost-found/items/${others.id}`, {
      token: ctx.studentToken
    })
    assertStatus(foreignDelete, 403, 'delete foreign item')

    const upload = new FormData()
    upload.append('images', new Blob([PNG], { type: 'image/png' }), 'smoke.png')
    const foreignUpload = await request('POST', `/api/lost-found/items/${others.id}/images`, {
      token: ctx.studentToken,
      form: upload
    })
    assertStatus(foreignUpload, 403, 'upload foreign item')
  })

  await test('权限矩阵：学生不能标记他人通知为已读', async () => {
    const mine = await request('GET', '/api/notifications?page_size=50', { token: ctx.wangToken })
    const target = mine.data.list.find(row => row.userId === ctx.wang.id)
    expect(target, '王同学应有个人通知')

    const res = await request('PUT', `/api/notifications/${target.id}/read`, { token: ctx.studentToken })
    assertStatus(res, 403, 'read foreign notification')
  })

  await test('鉴权：无 token / 非法 token 返回 401', async () => {
    const none = await request('GET', '/api/my/claims')
    assertStatus(none, 401, 'no token')

    const bad = await request('GET', '/api/my/claims', { token: 'not-a-real-token' })
    assertStatus(bad, 401, 'bad token')
  })

  /* ==================== 其他异常分支 ==================== */

  await test('公告缺少内容返回 422', async () => {
    const res = await request('POST', '/api/admin/announcements', {
      token: ctx.adminToken,
      body: { title: '只有标题' }
    })
    assertStatus(res, 422, 'announcement missing content')
  })

  await test('重复移交滞留物品返回 409', async () => {
    const list = await request('GET', '/api/admin/overdue-items?page_size=50', { token: ctx.adminToken })
    const transferred = list.data.list.find(row => row.disposalStatus === 'transferred')
    expect(transferred, '应存在已移交记录')

    const again = await request('PUT', `/api/admin/overdue-items/${transferred.id}/transfer`, {
      token: ctx.adminToken,
      body: { handover_target: '重复移交' }
    })
    assertStatus(again, 409, 'duplicate transfer')
  })

  await test('不存在的管理端资源返回 404', async () => {
    const item = await request('DELETE', '/api/admin/items/999999', { token: ctx.adminToken })
    assertStatus(item, 404, 'delete missing item')

    const claim = await request('PUT', '/api/admin/claims/999999/audit', {
      token: ctx.adminToken,
      body: { status: 'approved' }
    })
    assertStatus(claim, 404, 'audit missing claim')

    const dispute = await request('PUT', '/api/admin/disputes/999999/resolve', {
      token: ctx.adminToken,
      body: { result: '不存在' }
    })
    assertStatus(dispute, 404, 'resolve missing dispute')
  })

  /* ==================== 相似匹配 / 凭证上传 / 日志 / 逾期扫描 ==================== */

  await test('相似匹配：GET /api/lost-found/items/:id/similar', async () => {
    const res = await request('GET', `/api/lost-found/items/${ctx.seedItemId}/similar`)
    assertStatus(res, 200, 'similar items')
    expect(Array.isArray(res.data.items), '应返回 items 数组')
    expect(
      res.data.items.every(row => row.matchScore >= 2 && Array.isArray(row.matchReasons)),
      '相似结果应带 matchScore 与 matchReasons'
    )
  })

  await test('相似匹配：发布页预检 GET /api/lost-found/items/similar', async () => {
    const res = await request(
      'GET',
      '/api/lost-found/items/similar?type=found&name=%E8%80%B3%E6%9C%BA&location=%E5%9B%BE%E4%B9%A6%E9%A6%86'
    )
    assertStatus(res, 200, 'preview similar')
    expect(Array.isArray(res.data.items), '预检应返回 items 数组')
  })

  await test('相似匹配：不存在的物品返回 404', async () => {
    const res = await request('GET', '/api/lost-found/items/999999/similar')
    assertStatus(res, 404, 'similar missing item')
  })

  await test('凭证上传：POST /api/claims/proofs 返回可持久化地址', async () => {
    const form = new FormData()
    form.append('images', new Blob([PNG], { type: 'image/png' }), 'proof.png')

    const res = await request('POST', '/api/claims/proofs', {
      token: ctx.studentToken,
      form
    })
    assertStatus(res, 201, 'upload claim proofs')
    expect(Array.isArray(res.data.images) && res.data.images.length === 1, '应返回 1 张凭证地址')
    expect(res.data.images[0].startsWith('/uploads/'), '凭证地址应落在 /uploads/ 下')
    ctx.proofImagePath = res.data.images[0]
  })

  await test('凭证上传：未登录返回 401', async () => {
    const form = new FormData()
    form.append('images', new Blob([PNG], { type: 'image/png' }), 'proof.png')

    const res = await request('POST', '/api/claims/proofs', { form })
    assertStatus(res, 401, 'upload proofs without token')
  })

  await test('认领凭证：多图落库且过滤 blob 临时地址', async () => {
    const publish = await request('POST', '/api/lost-found/items', {
      token: ctx.studentToken,
      body: {
        type: 'found',
        name: '冒烟测试-凭证上传物品',
        category: '其他',
        location: '图书馆'
      }
    })
    assertStatus(publish, 201, 'publish proof item')

    const approve = await request('PUT', `/api/admin/items/${publish.data.id}/audit`, {
      token: ctx.adminToken,
      body: { status: 'approved' }
    })
    assertStatus(approve, 200, 'approve proof item')

    const res = await request('POST', '/api/claims', {
      token: ctx.wangToken,
      body: {
        itemId: publish.data.id,
        pickup_method: 'delivery',
        delivery_address: '一号宿舍楼 302',
        proofText: '物品内侧有一张贴纸，购买记录见凭证图片。',
        phone: '13900002222',
        proof_images: ['blob:http://localhost/fake', ctx.proofImagePath]
      }
    })

    assertStatus(res, 201, 'claim with proofs')
    expect(res.data.proofImages.length === 1, 'blob: 地址应被过滤，仅保留服务端地址')
    expect(res.data.proofImages[0] === ctx.proofImagePath, '凭证地址应与上传结果一致')
    expect(res.data.method === 'mail', 'pickup_method=delivery 应映射为 mail')
    expect(res.data.deliveryAddress === '一号宿舍楼 302', '邮寄地址应落库')
  })

  await test('管理员日志：GET /api/admin/logs 返回操作留痕', async () => {
    const res = await request('GET', '/api/admin/logs?page_size=50', { token: ctx.adminToken })
    assertStatus(res, 200, 'admin logs')
    expect(Array.isArray(res.data.list), '应返回 list 数组')
    expect(res.data.total > 0, '前面的审核操作应产生日志')
    expect(
      res.data.list.every(row => row.action && row.createdAt),
      '日志应包含操作与时间'
    )
  })

  await test('管理员日志：学生无权访问（403）', async () => {
    const res = await request('GET', '/api/admin/logs', { token: ctx.studentToken })
    assertStatus(res, 403, 'student admin logs')
  })

  await test('逾期扫描：管理员可手动触发', async () => {
    const res = await request('POST', '/api/admin/maintenance/overdue-scan', {
      token: ctx.adminToken
    })
    assertStatus(res, 200, 'overdue scan')
    expect(res.data.success === true, '应返回 success')
    expect(typeof res.data.scanned === 'number', '应返回扫描数量')
  })

  await test('逾期扫描：学生无权触发（403）', async () => {
    const res = await request('POST', '/api/admin/maintenance/overdue-scan', {
      token: ctx.studentToken
    })
    assertStatus(res, 403, 'student overdue scan')
  })

  console.log(`\n=== 结果：通过 ${passCount}，失败 ${failCount} ===`)
  if (failCount) {
    console.log('\n失败明细：')
    failures.forEach(item => console.log(`- ${item.name}: ${item.message}`))
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error('测试脚本异常:', error)
  process.exitCode = 1
})
