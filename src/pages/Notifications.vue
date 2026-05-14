<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getNotificationsApi, readNotificationApi, readAllNotificationsApi } from '@/api/notification'
import LineIcon from '@/components/LineIcon.vue'
import LoadingState from '@/components/LoadingState.vue'

const list = ref([])
const loading = ref(false)

function normalizeNotifications(res) {
  const payload = res?.data || res
  const data = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(data) ? data : []
}

function isUnread(item) {
  if (typeof item.is_read === 'boolean') {
    return !item.is_read
  }

  if (typeof item.read === 'boolean') {
    return !item.read
  }

  return false
}

function getCreatedAt(item) {
  return item.createdAt || item.created_at || '时间待补充'
}

function iconOf(type) {
  if (type === 'match') {
    return 'spark'
  }

  if (type === 'audit') {
    return 'shield'
  }

  if (type === 'claim') {
    return 'user-check'
  }

  if (type === 'announcement') {
    return 'file'
  }

  return 'file'
}

function toneOf(type) {
  if (type === 'match') {
    return 'purple'
  }

  if (type === 'audit') {
    return 'orange'
  }

  if (type === 'claim') {
    return 'green'
  }

  if (type === 'announcement') {
    return 'blue'
  }

  return 'blue'
}

async function load() {
  loading.value = true

  try {
    const res = await getNotificationsApi()
    list.value = normalizeNotifications(res)
  } catch (err) {
    // 错误已在 request.js 全局处理
  } finally {
    loading.value = false
  }
}

async function read(item) {
  if (!isUnread(item)) {
    return
  }

  await readNotificationApi(item.id)
  await load()
}

async function readAll() {
  if (!list.value.some(item => isUnread(item))) {
    ElMessage.info('当前没有未读通知')
    return
  }

  await readAllNotificationsApi()
  ElMessage.success('已全部标记为已读')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="notify-page container">
    <section class="page-title fade-up">
      <span class="kicker">通知中心</span>

      <h1>系统消息、匹配推送、审核提醒集中处理。</h1>

      <p>第一优先级功能：站内通知 + 邮箱推送闭环。邮箱发送由 Laravel 后端完成，前端负责展示和状态读取。</p>
    </section>

    <LoadingState v-if="loading" text="正在加载通知..." />

    <section v-else class="notify-layout">
      <div class="notify-list glass-card">
        <div class="notify-toolbar">
          <b>我的通知</b>
          <el-button size="small" @click="readAll">全部已读</el-button>
        </div>

        <div v-if="!list.length" class="empty-text">
          暂无通知
        </div>

        <div v-for="item in list" :key="item.id" class="notify-item" :class="{ unread: isUnread(item) }" @click="read(item)">
          <LineIcon :name="iconOf(item.type)" :tone="toneOf(item.type)" />

          <div>
            <div class="notify-head">
              <b>{{ item.title }}</b>
              <el-tag v-if="isUnread(item)" type="danger" round>未读</el-tag>
            </div>

            <p>{{ item.content }}</p>

            <small>{{ getCreatedAt(item) }}</small>
          </div>
        </div>
      </div>

      <aside class="glass-card mail-card">
        <LineIcon name="file" tone="blue" />

        <h2>消息通知说明</h2>

        <ul>
          <li>站内消息会实时推送审核结果、认领状态等重要通知</li>
          <li>重要消息会同步发送至您的注册邮箱</li>
          <li>邮件仅作为提醒，详细内容请登录平台查看</li>
        </ul>
      </aside>
    </section>
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

@media (max-width: 880px) {
  .notify-layout {
    grid-template-columns: 1fr;
  }
}
</style>