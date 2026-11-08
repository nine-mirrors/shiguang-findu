<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/format'
import StatCard from '@/components/StatCard.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'
import LineIcon from '@/components/LineIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
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
const loading = ref(false)
const loaded = ref(false)
const error = ref('')

const firstLoading = computed(() => loading.value && !loaded.value)

const normalizeDashboard = res => {
  const payload = res?.data || res || {}

  // 适配后端可能返回的多种字段名
  return {
    total: payload.total || payload['信息总数'] || payload.item_total || 0,
    pending: payload.pending || payload['待审核'] || payload.item_pending || payload.items_pending || 0,
    retained: payload.retained || payload['已关闭'] || payload.storage_retained || payload.retained_count || 0,
    blacklist: payload.blacklist || payload.risk_users || payload.blacklist_count || payload.risk_count || payload['风险用户'] || payload['黑名单'] || 0,
    claimPending: payload.claimPending || payload.claim_pending || payload.claims_pending || payload['认领待核验'] || 0,
    todos: payload.todos || payload.admin_todos || payload.today_todos || [],
    retainedItems: payload.retainedItems || payload.retained_items || payload.storage_items || [],
    locations: payload.locations || payload.hot_locations || payload.hotLocations || []
  }
}

const getStorageCode = item => item.storageCode || item.storage_code || '未入库'
const getCreatedAt = item => formatDateTime(item.createdAt || item.created_at || '')

// 首次加载或加载失败时用占位符，避免数字先闪 0 再跳到真实值
const statValue = key => (loaded.value && !error.value ? data.value[key] : '—')

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
  loading.value = true
  error.value = ''

  try {
    const res = await getAdminDashboardApi()

    data.value = normalizeDashboard(res)
    loaded.value = true
  } catch {
    error.value = '概览数据加载失败，请检查网络连接后重试。'
    ElMessage.error('加载仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="admin-dashboard fade-up">
    <section class="admin-hero">
      <div class="hero-copy">
        <span class="kicker">拾光 FindU · 运营管理后台</span>

        <h1>让每一次归还都有流程，让每一份善意都有记录。</h1>

        <p>拾光后台用于处理发布审核、认领核验、交接记录、滞留移交与风险管理，让校园失物招领从“校园墙，群消息碰运气”变成可追踪、可审核、可复盘的协寻流程。</p>
      </div>

      <div class="hero-actions">
        <el-button type="primary" @click="$router.push('/admin/items')">处理待审核</el-button>
        <el-button @click="$router.push('/admin/analytics')">查看数据分析</el-button>
      </div>
    </section>

    <section class="admin-stats" aria-label="后台概览指标" :aria-busy="loading ? 'true' : 'false'">
      <template v-if="firstLoading">
        <div v-for="n in 4" :key="n" class="stat-skeleton glass-card">
          <el-skeleton animated>
            <template #template>
              <div class="stat-skeleton-inner">
                <el-skeleton-item variant="circle" class="skeleton-icon" />

                <div class="stat-skeleton-copy">
                  <el-skeleton-item variant="h3" style="width: 58%" />
                  <el-skeleton-item variant="text" style="width: 82%" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
      </template>

      <template v-else>
        <StatCard label="待审核信息" :value="statValue('pending')" icon="shield" tone="purple" />
        <StatCard label="认领待核验" :value="statValue('claimPending')" icon="user-check" tone="orange" />
        <StatCard label="滞留/在库招领" :value="statValue('retained')" icon="package" tone="green" />
        <StatCard label="风险用户" :value="statValue('blacklist')" icon="alert" tone="red" />
      </template>
    </section>

    <ErrorState
      v-if="error && !loading"
      title="仪表盘数据加载失败"
      :desc="error"
      @retry="load"
    />

    <template v-else>
      <section class="dashboard-grid">
        <div class="glass-card panel todo-panel" :aria-busy="loading ? 'true' : 'false'">
          <div class="panel-head">
            <div>
              <h2>今日待办队列</h2>
              <p>按风险等级聚合管理员需要优先处理的任务。</p>
            </div>

            <el-tag class="soft-tag">{{ loading && !loaded ? '—' : `${data.todos?.length || 0} 项` }}</el-tag>
          </div>

          <div v-if="loading && !loaded" class="skeleton-rows" aria-hidden="true">
            <el-skeleton v-for="n in 3" :key="n" animated>
              <template #template>
                <div class="skeleton-row">
                  <el-skeleton-item variant="circle" class="skeleton-icon" />

                  <div class="skeleton-row-copy">
                    <el-skeleton-item variant="h3" style="width: 56%" />
                    <el-skeleton-item variant="text" style="width: 72%" />
                  </div>
                </div>
              </template>
            </el-skeleton>
          </div>

          <template v-else>
            <EmptyState
              v-if="!data.todos?.length"
              title="今天没有待办任务"
              desc="待审核发布、认领核验与滞留保管任务处理完后，会自动从这里清空。"
            />

            <button
              v-for="todo in data.todos"
              :key="todo.id"
              type="button"
              class="todo-row"
              :aria-label="`${todo.title}，${todoText(todo.type)}，${todo.level === 'high' ? '高优先级' : '中优先级'}`"
              @click="$router.push(todo.target)"
            >
              <LineIcon :name="todoIcon(todo.type)" :tone="todo.level === 'high' ? 'red' : 'orange'" />

              <span class="todo-main">
                <b>{{ todo.title }}</b>
                <span class="todo-meta">{{ todoText(todo.type) }}</span>
              </span>

              <el-tag :type="todo.level === 'high' ? 'danger' : 'warning'">{{ todo.level === 'high' ? '高优先级' : '中优先级' }}</el-tag>
            </button>
          </template>
        </div>

        <div class="glass-card panel" :aria-busy="loading ? 'true' : 'false'">
          <div class="panel-head">
            <div>
              <h2>高频丢失地点</h2>
              <p>用于发布热点区域提醒。</p>
            </div>
          </div>

          <div v-if="loading && !loaded" class="skeleton-rows" aria-hidden="true">
            <el-skeleton v-for="n in 4" :key="n" animated>
              <template #template>
                <div class="skeleton-bar-row">
                  <el-skeleton-item variant="text" style="width: 76px" />
                  <el-skeleton-item variant="text" class="skeleton-bar" />
                </div>
              </template>
            </el-skeleton>
          </div>

          <template v-else>
            <EmptyState
              v-if="!data.locations?.length"
              title="暂未统计到丢失地点"
              desc="有新的失物 / 招领发布后，这里会按地点聚合出高频区域。"
            />

            <div
              v-for="location in data.locations"
              :key="location.name"
              class="bar-row"
              role="img"
              :aria-label="`${location.name}：${location.value} 条`"
            >
              <span>{{ location.name }}</span>
              <div>
                <i :style="{ width: barWidth(location.value) }"></i>
              </div>
              <b>{{ location.value }}</b>
            </div>
          </template>
        </div>
      </section>

      <section class="glass-card panel retention-board" :aria-busy="loading ? 'true' : 'false'">
        <div class="panel-head">
          <div>
            <h2>滞留物品快照</h2>
            <p>管理员需要关注保管期、入库编号和移交状态，避免物品长期无人处理。</p>
          </div>

          <el-button @click="$router.push('/admin/overdue-items')">进入运营处理</el-button>
        </div>

        <div v-if="loading && !loaded" class="skeleton-rows" aria-hidden="true">
          <el-skeleton v-for="n in 3" :key="n" animated>
            <template #template>
              <div class="skeleton-row">
                <div class="skeleton-row-copy">
                  <el-skeleton-item variant="h3" style="width: 42%" />
                  <el-skeleton-item variant="text" style="width: 78%" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>

        <template v-else>
          <EmptyState
            v-if="!data.retainedItems?.length"
            title="暂无滞留物品"
            desc="超过保管期仍无人认领的物品会出现在这里，可到运营处理中登记移交。"
          />

          <div v-for="item in data.retainedItems" :key="item.id" class="retention-row">
            <div>
              <b>{{ item.name }}</b>
              <p>{{ getStorageCode(item) }} · {{ item.location }} · {{ getCreatedAt(item) }}</p>
            </div>

            <RetentionBadge :item="item" />
          </div>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.admin-dashboard {
  display: grid;
  gap: 18px;
  min-width: 0;
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

.hero-copy {
  min-width: 0;
}

.admin-hero h1 {
  max-width: 820px;
  margin: 18px 0 12px;
  font-size: 38px;
  letter-spacing: -.06em;
  line-height: 1.08;
  overflow-wrap: anywhere;
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

.stat-skeleton {
  padding: 22px;
  background: rgba(255, 255, 255, .8);
}

.stat-skeleton-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.skeleton-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}

.stat-skeleton-copy {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 10px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.08fr .92fr;
  gap: 18px;
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
  width: 100%;
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  margin-top: 12px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
  background: rgba(255, 255, 255, .7);
  border-radius: 20px;
  border: 1px solid rgba(17, 24, 39, .06);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.todo-row:hover {
  transform: translateY(-3px);
  border-color: rgba(79, 124, 255, .22);
  box-shadow: 0 18px 42px rgba(31, 45, 92, .1);
}

.todo-row :deep(.line-icon) {
  width: 42px;
  height: 42px;
}

.todo-main {
  display: block;
  min-width: 0;
  text-align: left;
}

.todo-row b {
  overflow-wrap: anywhere;
}

.todo-meta {
  display: block;
  margin-top: 4px;
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

.bar-row span {
  overflow-wrap: anywhere;
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

.bar-row b {
  text-align: right;
  color: var(--ink);
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

.retention-row b {
  overflow-wrap: anywhere;
}

.retention-row p {
  margin: 6px 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.skeleton-rows {
  display: grid;
  gap: 12px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 46px 1fr;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(17, 24, 39, .06);
  border-radius: 20px;
}

.skeleton-row-copy {
  min-width: 0;
  display: grid;
  gap: 10px;
}

.skeleton-bar-row {
  display: grid;
  grid-template-columns: 84px 1fr;
  align-items: center;
  gap: 12px;
}

.skeleton-bar {
  height: 14px;
  border-radius: 999px;
}

@media (max-width: 960px) {
  .admin-hero {
    display: block;
    padding: 26px;
  }

  .hero-actions {
    margin-top: 18px;
  }

  .admin-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid,
  .retention-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .admin-dashboard {
    gap: 16px;
  }

  .admin-hero {
    padding: 22px;
    border-radius: 26px;
  }

  .admin-hero h1 {
    font-size: 28px;
    margin: 14px 0 10px;
  }

  .admin-stats {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 18px;
  }

  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .todo-row {
    grid-template-columns: 40px 1fr;
  }

  .todo-row :deep(.el-tag) {
    grid-column: 2;
    justify-self: start;
  }

  .bar-row {
    grid-template-columns: 72px 1fr 26px;
  }
}
</style>
