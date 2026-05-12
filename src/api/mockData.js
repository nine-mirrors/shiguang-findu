
const photo = (label, c1 = '#4f7cff', c2 = '#00b894') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="460" viewBox="0 0 720 460"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="720" height="460" rx="42" fill="#f6f8ff"/><circle cx="118" cy="88" r="92" fill="${c1}" opacity=".16"/><circle cx="620" cy="370" r="128" fill="${c2}" opacity=".18"/><rect x="92" y="92" width="536" height="276" rx="34" fill="url(#g)" opacity=".18"/><rect x="132" y="132" width="456" height="196" rx="28" fill="white" opacity=".68"/><text x="360" y="238" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#172033">${label}</text><text x="360" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#667085">FindU item photo placeholder</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const categories = ['校园卡', '钥匙', '电子产品', '书本文具', '生活用品', '贵重物品', '其他']
export const locations = ['一食堂', '二食堂', '图书馆', 'A 教学楼', 'B 教学楼', '操场', '实验楼', '宿舍区']

export const seedUsers = [
  { id: 1, username: '李同学', email: 'student@example.com', password: '123456', role: 'student', avatar: '' },
  { id: 2, username: '管理员', email: 'admin@example.com', password: '123456', role: 'admin', avatar: '' },
  { id: 3, username: '王同学', email: 'wang@example.com', password: '123456', role: 'student', avatar: '' },
  { id: 4, username: '赵同学', email: 'zhao@example.com', password: '123456', role: 'student', avatar: '' },
  { id: 5, username: '陈同学', email: 'chen@example.com', password: '123456', role: 'student', avatar: '' },
  { id: 6, username: '周同学', email: 'zhou@example.com', password: '123456', role: 'student', avatar: '' }
]

export const seedItems = [
  { id: 1001, userId: 1, type: 'lost', name: '黑色无线耳机', category: '电子产品', location: '图书馆', happenTime: '2026-05-10 18:30', description: '黑色入耳式蓝牙耳机，充电盒正面有一道浅划痕，可能遗失在三楼自习区。', contact: 'QQ 21820xxxx', status: 'open', auditStatus: 'approved', image: photo('黑色耳机', '#4f7cff', '#6c63ff'), storageCode: '待找到', retentionDays: 30, visibility: 'public', isValuable: true, createdAt: '2026-05-10 19:05' },
  { id: 1002, userId: 3, type: 'found', name: '黑色耳机充电盒', category: '电子产品', location: '图书馆', happenTime: '2026-05-10 19:10', description: '在图书馆三楼靠窗座位捡到黑色耳机盒，正面有轻微划痕。', contact: '微信 lf-helper-01', status: 'open', auditStatus: 'approved', image: photo('耳机充电盒', '#111827', '#4f7cff'), storageCode: 'LF-A03-018', retentionDays: 30, visibility: 'public', isValuable: true, claimHint: '请说明充电盒正面的划痕位置。', createdAt: '2026-05-10 19:25' },
  { id: 1003, userId: 4, type: 'found', name: '蓝色校园卡', category: '校园卡', location: '一食堂', happenTime: '2026-05-09 12:20', description: '一食堂门口捡到校园卡，卡套是透明蓝边。请提供姓名后认领。', contact: '交至一食堂服务台', status: 'open', auditStatus: 'approved', image: photo('校园卡', '#0ea5e9', '#00b894'), storageCode: 'LF-C01-006', retentionDays: 14, visibility: 'public', isValuable: false, claimHint: '请说明校园卡姓名或卡套颜色。', createdAt: '2026-05-09 12:40' },
  { id: 1004, userId: 5, type: 'lost', name: '高等数学教材', category: '书本文具', location: 'A 教学楼', happenTime: '2026-05-08 16:00', description: '教材内页写有姓名，夹着一张课程表，可能落在 A305。', contact: '手机号 138****2210', status: 'done', auditStatus: 'approved', image: photo('高数教材', '#ffb020', '#4f7cff'), storageCode: '已归还', retentionDays: 30, visibility: 'public', isValuable: false, createdAt: '2026-05-08 16:30' },
  { id: 1005, userId: 1, type: 'found', name: '银色钥匙串', category: '钥匙', location: '宿舍区', happenTime: '2026-05-11 09:30', description: '宿舍楼下捡到三把钥匙和一个小熊挂件。', contact: '宿舍 6 栋门卫处', status: 'open', auditStatus: 'pending', image: photo('钥匙串', '#94a3b8', '#ffb020'), storageCode: '待审核', retentionDays: 30, visibility: 'public', isValuable: false, claimHint: '请说明钥匙数量和挂件样式。', createdAt: '2026-05-11 09:45' },
  { id: 1006, userId: 6, type: 'lost', name: '透明水杯', category: '生活用品', location: '操场', happenTime: '2026-05-07 20:10', description: '透明大容量水杯，杯盖是白色，晚上跑步后遗失。', contact: 'QQ 4746818139', status: 'open', auditStatus: 'approved', image: '', storageCode: '待找到', retentionDays: 30, visibility: 'public', isValuable: false, createdAt: '2026-05-07 20:26' },
  { id: 1007, userId: 6, type: 'found', name: 'U盘', category: '电子产品', location: '实验楼', happenTime: '2026-05-06 21:00', description: '实验楼机房捡到一个黑色 U 盘，需说明内部文件夹名称后认领。', contact: '实验室值班处', status: 'open', auditStatus: 'approved', image: photo('U盘', '#111827', '#00b894'), storageCode: 'LF-B02-011', retentionDays: 7, visibility: 'public', isValuable: true, claimHint: '请说明 U 盘内主要文件夹名称。', createdAt: '2026-05-06 21:08' }
]

export const seedClaims = [
  {
    id: 9001,
    itemId: 1002,
    userId: 1,
    claimantName: '李同学',
    claimType: 'claim',
    method: 'offline',
    proofText: '我的耳机盒正面有一道细小划痕，里面左耳机触点附近有一点磨损，昨天晚上在图书馆三楼靠窗自习。',
    proofImage: '',
    deliveryAddress: '',
    phone: '138****2210',
    status: 'pending',
    score: 86,
    createdAt: '2026-05-11 10:30'
  },
  {
    id: 9002,
    itemId: 1007,
    userId: 1,
    claimantName: '李同学',
    claimType: 'wrong_return',
    method: 'offline',
    proofText: '我领取后发现 U 盘里没有我的课程作业文件夹，疑似领错，申请归还到服务台重新入库。',
    proofImage: '',
    deliveryAddress: '',
    phone: '138****2210',
    status: 'approved',
    score: 72,
    createdAt: '2026-05-10 15:12'
  },
  {
    id: 9003,
    itemId: 1004,
    userId: 1,
    claimantName: '李同学',
    claimType: 'claim',
    method: 'offline',
    proofText: '教材内页写有我的姓名，夹着蓝色课程表，已在线下核验后完成交接。',
    proofImage: '',
    deliveryAddress: '',
    phone: '138****2210',
    status: 'completed',
    score: 91,
    createdAt: '2026-05-09 11:20',
    completedAt: '2026-05-09 16:30'
  }
]

export const seedNotifications = [
  { id: 7001, userId: 1, type: 'match', title: '发现一条疑似匹配信息', content: '系统为你的“黑色无线耳机”匹配到“黑色耳机充电盒”，匹配度 92%。', relatedId: 1002, read: false, createdAt: '2026-05-11 12:20' },
  { id: 7002, userId: 1, type: 'audit', title: '你发布的信息已进入待审核', content: '银色钥匙串招领信息已提交，管理员审核后会展示在大厅。', relatedId: 1005, read: true, createdAt: '2026-05-11 10:00' },
  { id: 7003, userId: 'all', type: 'announcement', title: '平台使用提醒', content: '请勿公开身份证号、完整手机号、宿舍门牌号等敏感信息。贵重物品认领需补充实名认证。', relatedId: null, read: false, createdAt: '2026-05-10 09:00' }
]

export const seedFavorites = [
  { id: 8001, userId: 1, itemId: 1002, createdAt: '2026-05-11 13:00' },
  { id: 8002, userId: 1, itemId: 1007, createdAt: '2026-05-11 13:20' }
]

export const seedVerification = [
  { id: 6001, userId: 1, level: 'basic', realName: '李同学', studentNo: '2026******20', status: 'approved', createdAt: '2026-05-01 12:00' }
]

export const seedAnnouncements = [
  { id: 5001, title: '五一后失物高发地点提醒', content: '图书馆三楼、一食堂门口、实验楼机房近期失物较多，请同学们离开前检查随身物品。', status: 'published', createdAt: '2026-05-09 12:00' },
  { id: 5002, title: '贵重物品认领规则', content: '耳机、电脑、证件、钱包等贵重物品认领需提供更完整的物品特征，必要时进行身份核验。', status: 'published', createdAt: '2026-05-08 10:00' }
]

export const seedBlacklist = [
  { id: 4001, username: '异常用户A', reason: '多次提交不匹配认领申请', level: 'warning', createdAt: '2026-05-10 18:30' }
]


export const seedDisputes = [
  { id: 3001, itemId: 1002, claimId: 9001, claimantName: '李同学', reason: '认领细节高度相似，需要补充耳机连接记录截图。', status: 'processing', result: '', createdAt: '2026-05-11 15:20' }
]

export const seedStorage = [
  { id: 2001, itemId: 1002, storageCode: 'LF-A03-018', storageLocation: '图书馆三楼服务台', expireAt: '2026-06-10 18:00', disposalStatus: 'normal', handoverTarget: '', handoverTime: '', remark: '耳机盒已封袋保管。' },
  { id: 2002, itemId: 1007, storageCode: 'LF-B02-011', storageLocation: '实验楼值班处', expireAt: '2026-05-13 18:00', disposalStatus: 'near_expired', handoverTarget: '', handoverTime: '', remark: '临近保管期，请提醒管理员处理。' }
]

export const seedAdminTodos = [
  { id: 1, type: 'content', title: '银色钥匙串待审核', level: 'medium', target: '/admin/review' },
  { id: 2, type: 'claim', title: '黑色耳机充电盒认领待核验', level: 'high', target: '/admin/review' },
  { id: 3, type: 'storage', title: 'U盘临近保管期', level: 'medium', target: '/admin/operations' }
]
