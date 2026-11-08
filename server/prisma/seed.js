import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const dt = text => new Date(`${text.replace(' ', 'T')}+08:00`)

const HOUR = 60 * 60 * 1000
const NOW = new Date()
const pad = number => String(number).padStart(2, '0')
const at = (daysAgo, hoursAgo = 0) =>
  new Date(NOW.getTime() - daysAgo * 24 * HOUR - hoursAgo * HOUR)
const later = days => new Date(NOW.getTime() + days * 24 * HOUR)
const formatDateTime = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`

// 帖子创建时间与“丢失/捡到”时间都相对 seed 运行时刻生成，保证趋势图始终有最近 7 天数据
const times = (daysAgo, hoursAgo = 0, foundHoursBefore = 2) => {
  const createdAt = at(daysAgo, hoursAgo)
  return {
    createdAt,
    happenTime: formatDateTime(new Date(createdAt.getTime() - foundHoursBefore * HOUR))
  }
}

const CATEGORIES = [
  { name: '校园卡', icon: 'card', sortOrder: 1 },
  { name: '钥匙', icon: 'key', sortOrder: 2 },
  { name: '电子产品', icon: 'device', sortOrder: 3 },
  { name: '书本文具', icon: 'book', sortOrder: 4 },
  { name: '生活用品', icon: 'life', sortOrder: 5 },
  { name: '贵重物品', icon: 'valuable', sortOrder: 6 },
  { name: '其他', icon: 'more', sortOrder: 7 }
]

const USERS = [
  { username: '李同学', email: 'student@example.com', role: 'student', verificationLevel: 'basic' },
  { username: '管理员', email: 'admin@example.com', role: 'admin', verificationLevel: 'full' },
  { username: '王同学', email: 'wang@example.com', role: 'student', verificationLevel: 'basic' },
  { username: '赵同学', email: 'zhao@example.com', role: 'student', verificationLevel: 'basic' },
  { username: '陈同学', email: 'chen@example.com', role: 'student', verificationLevel: 'basic' },
  { username: '周同学', email: 'zhou@example.com', role: 'student', verificationLevel: 'none' }
]

async function main() {
  console.log('[seed] 开始写入种子数据...')

  // 1. 分类（幂等）
  const categoryMap = new Map()
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon, sortOrder: category.sortOrder },
      create: category
    })
    categoryMap.set(record.name, record.id)
  }

  // 2. 用户（幂等，已存在则不覆盖密码）
  const password = await bcrypt.hash('123456', 10)
  const userMap = new Map()
  for (const user of USERS) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password }
    })
    userMap.set(record.email, record)
  }

  const student = userMap.get('student@example.com')
  const wang = userMap.get('wang@example.com')
  const zhao = userMap.get('zhao@example.com')
  const chen = userMap.get('chen@example.com')
  const zhou = userMap.get('zhou@example.com')

  // 3. 帖子 / 认领 / 收藏 / 通知等业务数据，仅在库里没有帖子时写入
  const itemCount = await prisma.item.count()
  if (itemCount > 0) {
    console.log(`[seed] 已存在 ${itemCount} 条帖子，跳过业务数据初始化`)
    await summary()
    return
  }

  const itemSeeds = [
    {
      key: 'earphoneLost',
      userId: student.id,
      type: 'lost',
      name: '黑色无线耳机',
      category: '电子产品',
      location: '图书馆',
      description: '黑色入耳式蓝牙耳机，充电盒正面有一道浅划痕，可能遗失在三楼自习区。',
      contact: 'QQ 21820xxxx',
      status: 'open',
      auditStatus: 'approved',
      isValuable: true,
      ...times(1, 2)
    },
    {
      key: 'earphoneFound',
      userId: wang.id,
      type: 'found',
      name: '黑色耳机充电盒',
      category: '电子产品',
      location: '图书馆',
      description: '在图书馆三楼靠窗座位捡到黑色耳机盒，正面有轻微划痕。',
      contact: '微信 lf-helper-01',
      status: 'open',
      auditStatus: 'approved',
      isValuable: true,
      claimHint: '请说明充电盒正面的划痕位置。',
      storageCode: 'LF-A03-018',
      ...times(1, 5)
    },
    {
      key: 'campusCard',
      userId: zhao.id,
      type: 'found',
      name: '蓝色校园卡',
      category: '校园卡',
      location: '一食堂',
      description: '一食堂门口捡到校园卡，卡套是透明蓝边。请提供姓名后认领。',
      contact: '交至一食堂服务台',
      status: 'open',
      auditStatus: 'approved',
      claimHint: '请说明校园卡姓名或卡套颜色。',
      storageCode: 'LF-C01-006',
      retentionDays: 14,
      ...times(2, 3)
    },
    {
      key: 'mathBook',
      userId: chen.id,
      type: 'lost',
      name: '高等数学教材',
      category: '书本文具',
      location: 'A 教学楼',
      description: '教材内页写有姓名，夹着一张课程表，可能落在 A305。',
      contact: '手机号 138****2210',
      status: 'done',
      auditStatus: 'approved',
      completedAt: at(8, 2),
      ...times(9, 4)
    },
    {
      key: 'keyChain',
      userId: student.id,
      type: 'found',
      name: '银色钥匙串',
      category: '钥匙',
      location: '宿舍区',
      description: '宿舍楼下捡到三把钥匙和一个小熊挂件。',
      contact: '宿舍 6 栋门卫处',
      status: 'open',
      auditStatus: 'pending',
      claimHint: '请说明钥匙数量和挂件样式。',
      ...times(0, 1)
    },
    {
      key: 'cup',
      userId: zhou.id,
      type: 'lost',
      name: '透明水杯',
      category: '生活用品',
      location: '操场',
      description: '透明大容量水杯，杯盖是白色，晚上跑步后遗失。',
      contact: 'QQ 4746818139',
      status: 'overdue',
      auditStatus: 'approved',
      ...times(12, 6)
    },
    {
      key: 'usb',
      userId: chen.id,
      type: 'found',
      name: 'U盘',
      category: '电子产品',
      location: '实验楼',
      description: '实验楼机房捡到一个黑色 U 盘，需说明内部文件夹名称后认领。',
      contact: '实验室值班处',
      status: 'claiming',
      auditStatus: 'approved',
      isValuable: true,
      claimHint: '请说明 U 盘内主要文件夹名称。',
      storageCode: 'LF-B02-011',
      retentionDays: 7,
      ...times(4, 2)
    },
    {
      key: 'wallet',
      userId: zhao.id,
      type: 'lost',
      name: '棕色短款钱包',
      category: '贵重物品',
      location: '二食堂',
      description: '棕色皮质短款钱包，内有校园卡和少量现金，午饭后发现丢失。',
      contact: '微信 zhao-help',
      status: 'open',
      auditStatus: 'approved',
      isValuable: true,
      ...times(0, 3)
    },
    {
      key: 'umbrella',
      userId: wang.id,
      type: 'found',
      name: '深蓝色折叠伞',
      category: '生活用品',
      location: 'B 教学楼',
      description: 'B 教学楼 201 教室后排捡到深蓝色折叠伞，伞柄有磨损。',
      contact: '交至 B 楼值班室',
      status: 'open',
      auditStatus: 'approved',
      storageCode: 'LF-D02-004',
      ...times(4, 5)
    },
    {
      key: 'calculator',
      userId: zhou.id,
      type: 'lost',
      name: '卡西欧计算器',
      category: '书本文具',
      location: '实验楼',
      description: '黑色卡西欧 fx-991 计算器，背面贴有姓名贴。',
      contact: 'QQ 8830219',
      status: 'open',
      auditStatus: 'approved',
      ...times(5, 2)
    },
    {
      key: 'notebook',
      userId: student.id,
      type: 'found',
      name: '线圈笔记本',
      category: '书本文具',
      location: '图书馆',
      description: '图书馆二楼自习桌捡到蓝色线圈笔记本，扉页有课程笔记。',
      contact: '图书馆二楼服务台',
      status: 'open',
      auditStatus: 'pending',
      ...times(6, 3)
    },
    {
      key: 'ring',
      userId: chen.id,
      type: 'found',
      name: '银色戒指',
      category: '贵重物品',
      location: '操场',
      description: '操场跑道边捡到一枚银色戒指，内圈刻有字母，请描述字母内容认领。',
      contact: '体育器材室',
      status: 'open',
      auditStatus: 'approved',
      isValuable: true,
      claimHint: '请说明戒指内圈刻的字母。',
      storageCode: 'LF-E01-009',
      ...times(1, 7)
    }
  ]

  const itemMap = new Map()
  for (const seed of itemSeeds) {
    const { key, category, ...rest } = seed
    const item = await prisma.item.create({
      data: {
        ...rest,
        categoryId: categoryMap.get(category),
        retentionDays: rest.retentionDays || 30,
        images: JSON.stringify([]),
        image: ''
      }
    })
    itemMap.set(key, item)
  }

  // 认领申请
  const claimEarphone = await prisma.claim.create({
    data: {
      itemId: itemMap.get('earphoneFound').id,
      userId: student.id,
      claimantName: student.username,
      claimType: 'claim',
      method: 'offline',
      proofText: '我的耳机盒正面有一道细小划痕，里面左耳机触点附近有一点磨损，昨天晚上在图书馆三楼靠窗自习。',
      phone: '13800138000',
      status: 'pending',
      progress: '待审核',
      score: 86,
      createdAt: at(0, 4)
    }
  })

  await prisma.claim.create({
    data: {
      itemId: itemMap.get('usb').id,
      userId: student.id,
      claimantName: student.username,
      claimType: 'wrong_return',
      method: 'offline',
      proofText: '我领取后发现 U 盘里没有我的课程作业文件夹，疑似领错，申请归还到服务台重新入库。',
      phone: '13800138000',
      status: 'approved',
      progress: '领错归还待审核',
      score: 72,
      createdAt: at(2, 5)
    }
  })

  await prisma.claim.create({
    data: {
      itemId: itemMap.get('mathBook').id,
      userId: student.id,
      claimantName: student.username,
      claimType: 'claim',
      method: 'offline',
      proofText: '教材内页写有我的姓名，夹着蓝色课程表，已在线下核验后完成交接。',
      phone: '13800138000',
      status: 'completed',
      progress: '已完成交接',
      handoverStatus: 'completed',
      score: 91,
      createdAt: at(5, 3),
      completedAt: at(4, 2)
    }
  })

  // 收藏
  await prisma.favorite.createMany({
    data: [
      { userId: student.id, itemId: itemMap.get('earphoneFound').id, createdAt: dt('2026-05-11 13:00') },
      { userId: student.id, itemId: itemMap.get('usb').id, createdAt: dt('2026-05-11 13:20') }
    ]
  })

  // 站内通知
  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: 'match',
        title: '发现一条疑似匹配信息',
        content: '系统为你的“黑色无线耳机”匹配到“黑色耳机充电盒”，匹配度 92%。',
        relatedId: itemMap.get('earphoneFound').id,
        read: false,
        createdAt: dt('2026-05-11 12:20')
      },
      {
        userId: student.id,
        type: 'audit',
        title: '你发布的信息已进入待审核',
        content: '银色钥匙串招领信息已提交，管理员审核后会展示在大厅。',
        relatedId: itemMap.get('keyChain').id,
        read: true,
        createdAt: dt('2026-05-11 10:00')
      },
      {
        userId: null,
        type: 'announcement',
        title: '平台使用提醒',
        content: '请勿公开身份证号、完整手机号、宿舍门牌号等敏感信息。贵重物品认领需补充实名认证。',
        read: false,
        createdAt: dt('2026-05-10 09:00')
      }
    ]
  })

  // 实名认证
  await prisma.verification.create({
    data: {
      userId: student.id,
      level: 'basic',
      realName: '李同学',
      studentNo: '2026******20',
      status: 'approved',
      auditedAt: dt('2026-05-01 12:00'),
      createdAt: dt('2026-05-01 12:00')
    }
  })

  await prisma.verification.create({
    data: {
      userId: wang.id,
      level: 'full',
      realName: '王同学',
      studentNo: '2026******35',
      phone: '13900133345',
      status: 'pending',
      createdAt: dt('2026-05-12 10:00')
    }
  })

  // 公告
  await prisma.announcement.createMany({
    data: [
      {
        title: '五一后失物高发地点提醒',
        content: '图书馆三楼、一食堂门口、实验楼机房近期失物较多，请同学们离开前检查随身物品。',
        status: 'published',
        createdAt: dt('2026-05-09 12:00')
      },
      {
        title: '贵重物品认领规则',
        content: '耳机、电脑、证件、钱包等贵重物品认领需提供更完整的物品特征，必要时进行身份核验。',
        status: 'published',
        createdAt: dt('2026-05-08 10:00')
      }
    ]
  })

  // 保管记录
  await prisma.storageRecord.create({
    data: {
      itemId: itemMap.get('earphoneFound').id,
      storageCode: 'LF-A03-018',
      storageLocation: '图书馆三楼服务台',
      expireAt: later(20),
      disposalStatus: 'normal',
      remark: '耳机盒已封袋保管。'
    }
  })

  await prisma.storageRecord.create({
    data: {
      itemId: itemMap.get('usb').id,
      storageCode: 'LF-B02-011',
      storageLocation: '实验楼值班处',
      expireAt: later(2),
      disposalStatus: 'near_expired',
      remark: '临近保管期，请提醒管理员处理。'
    }
  })

  // 争议
  await prisma.dispute.create({
    data: {
      itemId: itemMap.get('earphoneFound').id,
      claimId: claimEarphone.id,
      claimantName: student.username,
      reason: '认领细节高度相似，需要补充耳机连接记录截图。',
      status: 'processing',
      createdAt: dt('2026-05-11 15:20')
    }
  })

  // 黑名单（warning 级别只做展示，不影响发布）
  await prisma.blacklist.create({
    data: {
      userId: zhou.id,
      username: zhou.username,
      reason: '多次提交不匹配认领申请',
      level: 'warning',
      limitType: 'all',
      status: 'active',
      createdAt: dt('2026-05-10 18:30')
    }
  })

  await summary()
}

async function summary() {
  const [users, categories, items, claims, favorites, notifications, announcements] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.item.count(),
    prisma.claim.count(),
    prisma.favorite.count(),
    prisma.notification.count(),
    prisma.announcement.count()
  ])

  console.log('[seed] 完成')
  console.log(`[seed] 用户 ${users} / 分类 ${categories} / 帖子 ${items} / 认领 ${claims} / 收藏 ${favorites} / 通知 ${notifications} / 公告 ${announcements}`)
  console.log('[seed] 演示账号：')
  console.log('  学生: student@example.com / 123456')
  console.log('  管理员: admin@example.com / 123456')
  console.log('  其他学生: wang@example.com / zhao@example.com / chen@example.com / zhou@example.com（密码均为 123456）')
}

main()
  .catch(error => {
    console.error('[seed] 失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
