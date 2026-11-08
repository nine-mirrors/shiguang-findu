<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminLogsApi, triggerOverdueScanApi } from '@/api/admin'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'

const PAGE_SIZE = 20

const logs = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const targetType = ref('all')
const loading = ref(true)
const loadError = ref(false)
const scanning = ref(false)

let keywordTimer = null

const targetOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'item', label: '物品' },
  { value: 'claim', label: '认领' },
  { value: 'storage', label: '滞留' },
  { value: 'announcement', label: '公告' },
  { value: 'dispute', label: '争议' },
  { value: 'blacklist', label: '风控' },
  { value: 'verification', label: '认证' },
  { value: 'maintenance', label: '维护任务' }
]

const targetLabel = value => {
  return targetOptions.find(option => option.value === value)?.label || '其他'
}

const normalize = res => {
  const payload = res?.data || res

  return {
    list: Array.isArray(payload?.list) ? payload.list : [],
    total: Number(payload?.total || 0)
  }
}

const load = async () => {
  loading.value = true
  loadError.value = false

  try {
    const res = await getAdminLogsApi({
      page: page.value,
      page_size: PAGE_SIZE,
      keyword: keyword.value.trim() || undefined,
      targetType: targetType.value
    })
    const { list, total: count } = normalize(res)

    logs.value = list
    total.value = count

    const maxPage = Math.max(1, Math.ceil(count / PAGE_SIZE))
    if (page.value > maxPage) {
      page.value = maxPage
      await load()
    }
  } catch {
    loadError.value = true
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleKeywordInput = () => {
  if (keywordTimer) clearTimeout(keywordTimer)

  keywordTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
}

const handleTargetChange = () => {
  page.value = 1
  load()
}

const handlePageChange = value => {
  page.value = value
  load()
}

const runOverdueScan = async () => {
  if (scanning.value) return

  const confirmed = await ElMessageBox.confirm(
    '将扫描所有招领物品的保管期：已到期的自动关闭并通知发布人，3 天内到期的发送临期提醒。',
    '执行逾期扫描',
    { confirmButtonText: '开始扫描', cancelButtonText: '取消', type: 'warning' }
  )
    .then(() => true)
    .catch(() => false)

  if (!confirmed) return

  scanning.value = true

  try {
    const res = await triggerOverdueScanApi()
    const payload = res?.data || res

    ElMessage.success(
      `扫描完成：到期关闭 ${payload?.expired ?? 0} 条，临期提醒 ${payload?.nearExpired ?? 0} 条`
    )
    page.value = 1
    await load()
  } catch {
    // request.js 已统一提示
  } finally {
    scanning.value = false
  }
}

onMounted(load)

onBeforeUnmount(() => {
  if (keywordTimer) clearTimeout(keywordTimer)
})
</script>

<template>
  <div class="logs-page fade-up">
    <section class="logs-toolbar glass-card">
      <div class="toolbar-fields">
        <el-input
          v-model="keyword"
          class="keyword-input"
          placeholder="搜索管理员、操作或详情"
          clearable
          aria-label="搜索操作日志"
          @input="handleKeywordInput"
          @clear="handleKeywordInput"
        />

        <el-select
          v-model="targetType"
          class="type-select"
          aria-label="按类型筛选操作日志"
          @change="handleTargetChange"
        >
          <el-option
            v-for="option in targetOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>

      <div class="toolbar-actions">
        <el-button :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :loading="scanning" @click="runOverdueScan">
          执行逾期扫描
        </el-button>
      </div>
    </section>

    <div v-if="loading" class="logs-skeleton glass-card" aria-busy="true" aria-label="正在加载操作日志">
      <el-skeleton :rows="6" animated />
    </div>

    <ErrorState
      v-else-if="loadError"
      title="操作日志加载失败"
      desc="请检查网络或稍后重试。"
      @retry="load"
    />

    <EmptyState
      v-else-if="!logs.length"
      title="暂无操作记录"
      desc="管理员审核、认领处理、风控与维护操作都会记录在这里。"
    />

    <section v-else class="logs-list glass-card">
      <header class="logs-head" aria-hidden="true">
        <span>操作</span>
        <span>对象</span>
        <span>详情</span>
        <span>操作人</span>
        <span>时间</span>
      </header>

      <ul>
        <li v-for="log in logs" :key="log.id" class="log-row">
          <span class="log-action">{{ log.action }}</span>
          <span class="log-target">
            <i>{{ targetLabel(log.targetType) }}</i>
            <b v-if="log.targetId">#{{ log.targetId }}</b>
          </span>
          <span class="log-detail">{{ log.detail || '—' }}</span>
          <span class="log-admin">{{ log.adminName || '系统' }}</span>
          <span class="log-time">{{ log.createdAt }}</span>
        </li>
      </ul>
    </section>

    <div v-if="!loading && !loadError && total > PAGE_SIZE" class="logs-pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="PAGE_SIZE"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.logs-page {
  display: grid;
  gap: 18px;
}

.logs-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 24px;
}

.toolbar-fields {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 240px;
}

.keyword-input {
  flex: 1;
  min-width: 200px;
}

.type-select {
  width: 150px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.logs-skeleton {
  padding: 24px;
  border-radius: 26px;
}

.logs-list {
  border-radius: 26px;
  overflow: hidden;
}

.logs-head,
.log-row {
  display: grid;
  grid-template-columns: 140px 120px minmax(0, 1fr) 110px 160px;
  gap: 14px;
  align-items: center;
  padding: 14px 22px;
}

.logs-head {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: .04em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(20, 32, 72, .08);
}

.logs-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.log-row {
  font-size: 13px;
  border-bottom: 1px solid rgba(20, 32, 72, .06);
}

.log-row:last-child {
  border-bottom: 0;
}

.log-action {
  font-weight: 600;
  color: var(--ink);
}

.log-target {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
}

.log-target i {
  font-style: normal;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(79, 124, 255, .1);
  color: var(--primary-strong);
  font-size: 12px;
}

.log-target b {
  font-weight: 500;
}

.log-detail {
  color: var(--muted);
  line-height: 1.6;
  word-break: break-word;
}

.log-admin,
.log-time {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.logs-pagination {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .logs-head {
    display: none;
  }

  .log-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'action time'
      'target admin'
      'detail detail';
    row-gap: 8px;
    padding: 16px 18px;
  }

  .log-action {
    grid-area: action;
  }

  .log-time {
    grid-area: time;
    text-align: right;
    font-size: 12px;
  }

  .log-target {
    grid-area: target;
  }

  .log-admin {
    grid-area: admin;
    text-align: right;
  }

  .log-detail {
    grid-area: detail;
  }
}

@media (max-width: 620px) {
  .logs-toolbar {
    padding: 16px;
  }

  .type-select {
    width: 100%;
  }

  .toolbar-actions {
    width: 100%;
  }

  .toolbar-actions :deep(.el-button) {
    flex: 1;
    min-height: 42px;
  }
}
</style>
