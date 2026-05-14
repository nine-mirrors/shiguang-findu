<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getNotificationsApi, readNotificationApi, readAllNotificationsApi } from '@/api/notification'
import LineIcon from '@/components/LineIcon.vue'

const router = useRouter()

const list = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentNotice = ref(null)

const unreadCount = computed(() => {
  return list.value.filter(item => isUnread(item)).length
})

const normalizeNotifications = res => {
  const payload = res?.data || res
  const data = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(data) ? data : []
}

const isUnread = item => {
  if (typeof item.is_read === 'boolean') return !item.is_read
  if (typeof item.read === 'boolean') return !item.read
  if (item.read_at !== undefined) return !item.read_at

  return false
}

const getTitle = item => {
  return item.title || item.name || '系统通知'
}

const getContent = item => {
  return item.content || item.message || item.body || '暂无通知内容'
}

const getCreatedAt = item => {
  const value = item.createdAt || item.created_at || item.created_time || ''

  if (!value) return '时间待补充'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  const pad = number => String(number).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getNoticeTypeText = type => {
  switch (type) {
    case 'match':
      return '匹配推送'
    case 'audit':
      return '审核提醒'
    case 'claim':
      return '认领通知'
    case 'announcement':
      return '系统公告'
    default:
      return '系统消息'
  }
}

const iconOf = type => {
  switch (type) {
    case 'match':
      return 'spark'
    case 'audit':
      return 'shield'
    case 'claim':
      return 'user-check'
    case 'announcement':
      return 'file'
    default:
      return 'file'
  }
}

const toneOf = type => {
  switch (type) {
    case 'match':
      return 'purple'
    case 'audit':
      return 'orange'
    case 'claim':
      return 'green'
    case 'announcement':
      return 'blue'
    default:
      return 'blue'
  }
}

const getNoticePayload = item => {
  return item.data || item.extra || item.payload || {}
}

const getRelatedItemId = item => {
  const payload = getNoticePayload(item)

  return item.item_id || item.itemId || payload.item_id || payload.itemId || ''
}

const getRelatedClaimId = item => {
  const payload = getNoticePayload(item)

  return item.claim_id || item.claimId || payload.claim_id || payload.claimId || ''
}

const hasRelatedTarget = item => {
  return Boolean(getRelatedItemId(item) || getRelatedClaimId(item))
}

const load = async () => {
  loading.value = true

  try {
    const res = await getNotificationsApi()
    list.value = normalizeNotifications(res)
  } finally {
    loading.value = false
  }
}

const openDetail = async item => {
  currentNotice.value = item
  detailVisible.value = true

  if (!isUnread(item)) return

  await readNotificationApi(item.id)

  list.value = list.value.map(notice => {
    if (notice.id !== item.id) return notice

    return {
      ...notice,
      is_read: true,
      read: true,
      read_at: new Date().toISOString()
    }
  })
}

const readAll = async () => {
  if (!list.value.some(item => isUnread(item))) {
    ElMessage.info('当前没有未读通知')
    return
  }

  await readAllNotificationsApi()
  ElMessage.success('已全部标记为已读')
  await load()
}

const goRelatedTarget = () => {
  if (!currentNotice.value) return

  const itemId = getRelatedItemId(currentNotice.value)

  if (itemId) {
    router.push(`/items/${itemId}`)
    detailVisible.value = false
    return
  }

  ElMessage.info('该通知暂无可跳转的关联信息')
}

onMounted(load)
</script>

<template>
  <div class="notify-page container">
    <section class="page-title fade-up">
      <span class="kicker">通知中心</span>

      <h1>系统消息、匹配推送、审核提醒集中处理。</h1>

      <p>站内通知用于同步发布审核、认领状态、收藏动态和系统提醒。点击通知可查看完整内容，未读消息会自动标记为已读。</p>
    </section>

    <section class="notify-layout">
      <div class="notify-list glass-card">
        <div class="notify-toolbar">
          <div>
            <b>我的通知</b>
            <span v-if="unreadCount">还有 {{ unreadCount }} 条未读</span>
          </div>

          <el-button size="small" :loading="loading" @click="readAll">全部已读</el-button>
        </div>

        <div v-if="!loading && !list.length" class="empty-text">
          暂无通知
        </div>

        <div
          v-for="item in list"
          :key="item.id"
          class="notify-item"
          :class="{ unread: isUnread(item) }"
          @click="openDetail(item)"
        >
          <LineIcon :name="iconOf(item.type)" :tone="toneOf(item.type)" />

          <div>
            <div class="notify-head">
              <b>{{ getTitle(item) }}</b>
              <el-tag v-if="isUnread(item)" type="danger" round>未读</el-tag>
              <el-tag v-else type="info" round>已读</el-tag>
            </div>

            <p>{{ getContent(item) }}</p>

            <small>{{ getCreatedAt(item) }}</small>
          </div>
        </div>
      </div>

      <aside class="glass-card mail-card">
        <LineIcon name="file" tone="blue" />

        <h2>通知规则说明</h2>

        <p>注册验证码、发布审核结果、认领状态变化、新匹配信息、滞留提醒等事件会进入通知中心。敏感信息不直接公开展示，需要回到平台内查看。</p>

        <ul>
          <li>不在通知中展示完整手机号、地址、证件号。</li>
          <li>审核、认领、匹配类通知应绑定对应业务记录。</li>
          <li>点击通知后应能查看详情，并同步已读状态。</li>
        </ul>
      </aside>
    </section>

    <el-dialog v-model="detailVisible" title="通知详情" width="520px">
      <div v-if="currentNotice" class="notice-detail">
        <div class="detail-head">
          <LineIcon :name="iconOf(currentNotice.type)" :tone="toneOf(currentNotice.type)" />

          <div>
            <b>{{ getTitle(currentNotice) }}</b>
            <span>{{ getNoticeTypeText(currentNotice.type) }} · {{ getCreatedAt(currentNotice) }}</span>
          </div>
        </div>

        <div class="detail-content">
          {{ getContent(currentNotice) }}
        </div>

        <div class="detail-meta">
          <span>状态：{{ isUnread(currentNotice) ? '未读' : '已读' }}</span>
          <span v-if="getRelatedItemId(currentNotice)">关联物品 ID：{{ getRelatedItemId(currentNotice) }}</span>
          <span v-if="getRelatedClaimId(currentNotice)">关联认领 ID：{{ getRelatedClaimId(currentNotice) }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentNotice && hasRelatedTarget(currentNotice)" type="primary" @click="goRelatedTarget">
          查看关联信息
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.notify-page {
  padding-top: 42px;
}

.page-title h1 {
  max-width: 880px;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.02;
  letter-spacing: -.06em;
  margin: 18px 0 12px;
}

.page-title p {
  color: var(--muted);
  line-height: 1.8;
}

.notify-layout {
  display: grid;
  grid-template-columns: 1fr 330px;
  gap: 22px;
  margin-top: 24px;
}

.notify-list {
  padding: 18px;
}

.notify-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.notify-toolbar > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notify-toolbar span {
  color: var(--muted);
  font-size: 13px;
}

.empty-text {
  padding: 36px 0;
  text-align: center;
  color: var(--muted);
}

.notify-item {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
  cursor: pointer;
  transition: .25s ease;
}

.notify-item:hover {
  background: rgba(79, 124, 255, .06);
  transform: translateY(-2px);
}

.notify-item.unread {
  background: linear-gradient(135deg, rgba(79, 124, 255, .08), rgba(0, 184, 148, .05));
}

.notify-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notify-item p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.7;
}

.notify-item small {
  color: #94a3b8;
}

.mail-card {
  padding: 24px;
  align-self: start;
}

.mail-card h2 {
  margin: 18px 0 10px;
}

.mail-card p,
.mail-card li {
  color: var(--muted);
  line-height: 1.75;
}

.mail-card ul {
  padding-left: 20px;
}

.notice-detail {
  display: grid;
  gap: 18px;
}

.detail-head {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  align-items: center;
}

.detail-head b {
  display: block;
  font-size: 18px;
  color: var(--ink);
}

.detail-head span {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.detail-content {
  padding: 18px;
  border-radius: 20px;
  background: rgba(79, 124, 255, .06);
  color: #4b5563;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-meta span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, .12);
  color: #64748b;
  font-size: 12px;
}

:deep(.el-dialog__header) {
  text-align: center;
  padding-bottom: 10px;
}

:deep(.el-dialog__title) {
  font-weight: 900;
  color: var(--ink);
}

.notice-detail {
  display: grid;
  gap: 18px;
}

.detail-head {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  align-items: center;
  justify-content: center;
}

.detail-head :deep(.line-icon) {
  margin: 0 auto;
}

@media (max-width: 880px) {
  .notify-layout {
    grid-template-columns: 1fr;
  }
}
</style>