<script setup>
import { onMounted, ref } from 'vue'
import StatCard from '@/components/StatCard.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'
import LineIcon from '@/components/LineIcon.vue'
import { getAdminDashboardApi } from '@/api/admin'

const data = ref({
  total: 0,
  pending: 0,
  retained: 0,
  blacklist: 0,
  claimPending: 0,
  todos: [],
  retainedItems: [],
  locations: []
})

const normalizeDashboard = res => {
  const payload = res?.data || res || {}

  return {
    total: payload.total || 0,
    pending: payload.pending || payload.item_pending || 0,
    retained: payload.retained || payload.storage_retained || 0,
    blacklist: payload.blacklist || payload.risk_users || 0,
    claimPending: payload.claimPending || payload.claim_pending || 0,
    todos: payload.todos || payload.admin_todos || [],
    retainedItems: payload.retainedItems || payload.retained_items || [],
    locations: payload.locations || payload.hot_locations || []
  }
}

const getStorageCode = item => item.storageCode || item.storage_code || '未入库'
const getCreatedAt = item => item.createdAt || item.created_at || '时间待补充'

const barWidth = value => {
  const max = Math.max(...(data.value.locations || []).map(item => item.value), 1)

  return `${Math.max(8, value / max * 100)}%`
}

const todoIcon = type => {
  switch (type) {
    case 'claim':
      return 'user-check'
    case 'storage':
      return 'package'
    default:
      return 'shield'
  }
}

const todoText = type => {
  switch (type) {
    case 'claim':
      return '认领核验'
    case 'storage':
      return '滞留保管'
    default:
      return '内容审核'
  }
}

const load = async () => {
  const res = await getAdminDashboardApi()

  data.value = normalizeDashboard(res)
}

onMounted(load)
</script>

<template>
  <div class="admin-dashboard fade-up">
    <section class="admin-hero">
      <div>
        <span class="kicker">拾光 FindU · 运营管理后台</span>

        <h1>让每一次归还都有流程，让每一份善意都有记录。</h1>

        <p>拾光后台用于处理发布审核、认领核验、交接记录、滞留移交与风险管理，让校园失物招领从“群消息碰运气”变成可追踪、可审核、可复盘的协寻流程。</p>
      </div>

      <div class="hero-actions">
        <el-button type="primary" @click="$router.push('/admin/items')">处理待审核</el-button>
        <el-button @click="$router.push('/admin/analytics')">查看数据分析</el-button>
      </div>
    </section>

    <section class="admin-stats">
      <StatCard label="待审核信息" :value="data.pending" icon="shield" tone="purple" />
      <StatCard label="认领待核验" :value="data.claimPending" icon="user-check" tone="orange" />
      <StatCard label="滞留/在库招领" :value="data.retained" icon="package" tone="green" />
      <StatCard label="风险用户" :value="data.blacklist" icon="alert" tone="red" />
    </section>

    <section class="dashboard-grid">
      <div class="glass-card panel todo-panel">
        <div class="panel-head">
          <div>
            <h2>今日待办队列</h2>
            <p>按风险等级聚合管理员需要优先处理的任务。</p>
          </div>

          <el-tag class="soft-tag">{{ data.todos?.length || 0 }} 项</el-tag>
        </div>

        <div v-for="todo in data.todos" :key="todo.id" class="todo-row" @click="$router.push(todo.target)">
          <LineIcon :name="todoIcon(todo.type)" :tone="todo.level === 'high' ? 'red' : 'orange'" />

          <div>
            <b>{{ todo.title }}</b>
            <p>{{ todoText(todo.type) }}</p>
          </div>

          <el-tag :type="todo.level === 'high' ? 'danger' : 'warning'">{{ todo.level === 'high' ? '高优先级' : '中优先级' }}</el-tag>
        </div>
      </div>

      <div class="glass-card panel">
        <div class="panel-head">
          <div>
            <h2>高频丢失地点</h2>
            <p>用于发布热点区域提醒。</p>
          </div>
        </div>

        <div v-for="location in data.locations" :key="location.name" class="bar-row">
          <span>{{ location.name }}</span>
          <div>
            <i :style="{ width: barWidth(location.value) }"></i>
          </div>
          <b>{{ location.value }}</b>
        </div>
      </div>
    </section>

    <section class="glass-card panel retention-board">
      <div class="panel-head">
        <div>
          <h2>滞留物品快照</h2>
          <p>管理员需要关注保管期、入库编号和移交状态，避免物品长期无人处理。</p>
        </div>

        <el-button @click="$router.push('/admin/overdue-items')">进入运营处理</el-button>
      </div>

      <div v-for="item in data.retainedItems" :key="item.id" class="retention-row">
        <div>
          <b>{{ item.name }}</b>
          <p>{{ getStorageCode(item) }} · {{ item.location }} · {{ getCreatedAt(item) }}</p>
        </div>

        <RetentionBadge :item="item" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-dashboard {
  display: grid;
  gap: 20px;
}

.admin-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 30px;
  border-radius: 32px;
  color: #fff;
  background: radial-gradient(circle at 8% 0%, rgba(255, 255, 255, .28), transparent 18rem), linear-gradient(135deg, #172554, #315fff 58%, #00b894);
  box-shadow: 0 28px 70px rgba(49, 95, 255, .24);
}

.admin-hero h1 {
  max-width: 820px;
  margin: 18px 0 12px;
  font-size: 38px;
  letter-spacing: -.06em;
  line-height: 1.08;
}

.admin-hero p {
  max-width: 760px;
  color: rgba(255, 255, 255, .78);
  line-height: 1.8;
}

.admin-hero .kicker {
  color: #fff;
  background: rgba(255, 255, 255, .14);
  border-color: rgba(255, 255, 255, .18);
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.08fr .92fr;
  gap: 20px;
}

.panel {
  padding: 24px;
  background: rgba(255, 255, 255, .9);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-head h2 {
  margin: 0 0 8px;
}

.panel-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.todo-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  margin-top: 12px;
  cursor: pointer;
  border-radius: 20px;
  border: 1px solid rgba(17, 24, 39, .06);
  transition: .22s ease;
}

.todo-row:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 42px rgba(31, 45, 92, .1);
}

.todo-row :deep(.line-icon) {
  width: 42px;
  height: 42px;
}

.todo-row p {
  margin: 4px 0 0;
  color: var(--muted);
}

.bar-row {
  display: grid;
  grid-template-columns: 84px 1fr 30px;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
  color: var(--muted);
}

.bar-row div {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef2f7;
}

.bar-row i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), var(--success));
}

.retention-board {
  margin-top: 0;
}

.retention-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid rgba(17, 24, 39, .08);
}

.retention-row p {
  margin: 6px 0 0;
  color: var(--muted);
}

@media (max-width: 980px) {
  .admin-hero {
    display: block;
  }

  .admin-stats,
  .dashboard-grid,
  .retention-row {
    grid-template-columns: 1fr;
  }
}
</style>