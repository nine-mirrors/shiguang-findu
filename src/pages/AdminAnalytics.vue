<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LineIcon from '@/components/LineIcon.vue'
import AppLoading from '@/components/AppLoading.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getAdminAnalyticsApi } from '@/api/admin'

const data = ref({
  activeUsers: 0,
  successRate: 0,
  publishFrequency: '0/日',
  riskUsers: 0,
  hotLocations: [],
  claimStages: [],
  itemStatusStats: [],
  dailyTrend: [],
  overview: {}
})

const loading = ref(false)
const error = ref('')
const activeTab = ref('overview')

const STATUS_LABELS = {
  open: '寻找中',
  claiming: '认领中',
  completed: '已完成',
  closed: '已关闭',
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
}

const STATUS_TYPES = {
  open: 'primary',
  claiming: 'warning',
  completed: 'success',
  closed: 'info',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

const STATUS_ORDER = ['open', 'claiming', 'completed', 'closed', 'pending', 'approved', 'rejected']

const toNumber = value => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const roundPercent = value => Math.round(value * 10) / 10

const readPercent = entry => {
  if (entry.percent !== undefined && entry.percent !== null) return toNumber(entry.percent)
  if (entry.percentage !== undefined && entry.percentage !== null) return toNumber(entry.percentage)
  if (entry.ratio !== undefined && entry.ratio !== null) return toNumber(entry.ratio) * 100

  return null
}

// 状态分布：兼容 [{ status, count, percent }] 与 { open: 12 } 两种结构，统一成带数量与占比的列表
const normalizeItemStatusStats = raw => {
  let list = []

  if (Array.isArray(raw)) {
    list = raw
      .filter(entry => entry !== null && entry !== undefined)
      .map(entry => {
        if (typeof entry !== 'object') {
          const key = String(entry)

          return {
            key,
            name: STATUS_LABELS[key] || key,
            value: 0,
            percent: null
          }
        }

        const key = String(entry.status || entry.key || entry.code || entry.name || '')

        return {
          key,
          name: entry.label || entry.name || STATUS_LABELS[key] || key,
          value: toNumber(entry.count ?? entry.value ?? entry.total ?? entry.quantity),
          percent: readPercent(entry)
        }
      })
  } else if (raw && typeof raw === 'object') {
    list = Object.entries(raw).map(([key, value]) => ({
      key,
      name: STATUS_LABELS[key] || key,
      value: toNumber(value),
      percent: null
    }))
  }

  const total = list.reduce((sum, item) => sum + item.value, 0)

  return list
    .filter(item => item.key && item.value > 0)
    .sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.key)
      const bi = STATUS_ORDER.indexOf(b.key)

      return (ai === -1 ? STATUS_ORDER.length : ai) - (bi === -1 ? STATUS_ORDER.length : bi)
    })
    .map(item => ({
      name: item.name,
      value: item.value,
      type: STATUS_TYPES[item.key] || 'primary',
      percent: roundPercent(item.percent === null ? (total > 0 ? (item.value / total) * 100 : 0) : item.percent)
    }))
}

// 趋势：兼容 [{ date, items, claims }]、{ new_items: {...}, new_claims: {...} } 与 { date: count }，统一按日期升序
const normalizeDailyTrend = raw => {
  let rows = []

  if (Array.isArray(raw)) {
    rows = raw
      .filter(entry => entry && typeof entry === 'object')
      .map(entry => ({
        date: String(entry.date || entry.day || entry.dt || ''),
        items: toNumber(entry.items ?? entry.newItems ?? entry.new_items ?? entry.itemCount ?? entry.item_count ?? entry.count),
        claims: toNumber(entry.claims ?? entry.newClaims ?? entry.new_claims ?? entry.claimCount ?? entry.claim_count)
      }))
  } else if (raw && typeof raw === 'object') {
    const itemsMap = raw.new_items || raw.newItems || null
    const claimsMap = raw.new_claims || raw.newClaims || null

    if (itemsMap || claimsMap) {
      const dates = new Set([...Object.keys(itemsMap || {}), ...Object.keys(claimsMap || {})])

      rows = [...dates].map(date => ({
        date,
        items: toNumber(itemsMap?.[date]),
        claims: toNumber(claimsMap?.[date])
      }))
    } else {
      rows = Object.entries(raw).map(([date, value]) => ({
        date,
        items: toNumber(value),
        claims: 0
      }))
    }
  }

  return rows
    .filter(row => row.date)
    .sort((a, b) => a.date.localeCompare(b.date))
}

const shortDate = date => String(date || '').slice(5)

const normalizeAnalytics = res => {
  const payload = res?.data || res || {}

  // 后端已返回整理好的扁平结构，直接使用，避免被下面的旧字段兼容逻辑覆盖成空值
  if (
    payload.successRate !== undefined ||
    Array.isArray(payload.hotLocations) ||
    Array.isArray(payload.claimStages) ||
    payload.itemStatusStats !== undefined ||
    payload.dailyTrend !== undefined
  ) {
    return {
      activeUsers: Number(payload.activeUsers) || 0,
      successRate: Number(payload.successRate) || 0,
      publishFrequency: payload.publishFrequency || '0/日',
      riskUsers: Number(payload.riskUsers) || 0,
      hotLocations: (payload.hotLocations || []).filter(item => Number(item.value) > 0),
      claimStages: (payload.claimStages || []).filter(stage => Number(stage.value) > 0),
      itemStatusStats: normalizeItemStatusStats(payload.itemStatusStats),
      dailyTrend: normalizeDailyTrend(payload.dailyTrend),
      overview: {}
    }
  }

  const overview = payload.overview || {}
  const claimsByStatus = payload.claims_by_status || {}
  const itemsByStatus = payload.items_by_status || {}
  const itemsByType = payload.items_by_type || {}
  const dailyTrendRaw = payload.daily_trend_last_7_days || {}
  const usersByVerification = payload.users_by_verification_level || {}
  const hotLocationsFromBackend = payload.hot_locations || payload.hotLocations || null

  const totalClaims = overview['总认领数'] || 0
  const completedClaims = (claimsByStatus['completed'] || 0) + (claimsByStatus['approved'] || 0)
  const successRate = totalClaims > 0 ? Math.round((completedClaims / totalClaims) * 100) : 0

  // 适配 daily_trend_last_7_days：{ new_items: {...}, new_claims: {...} } 或 { date: count }
  const dailyTrendData = normalizeDailyTrend(dailyTrendRaw)

  // 计算近7日平均发布数
  let avgDailyPublish = '0'
  if (dailyTrendData.length > 0) {
    const sum = dailyTrendData.reduce((a, b) => a + b.items, 0)
    avgDailyPublish = Number.isFinite(sum) ? (sum / dailyTrendData.length).toFixed(1) : '0'
  }

  let hotLocations = []
  if (hotLocationsFromBackend && Array.isArray(hotLocationsFromBackend)) {
    hotLocations = hotLocationsFromBackend
      .map(item => ({
        name: item.name || item.location || '未知地点',
        value: Number(item.value || item.count || 0)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  const claimStages = [
    { name: '待审核', value: claimsByStatus['pending'] || 0 },
    { name: '待交接', value: (claimsByStatus['approved'] || 0) + (claimsByStatus['handover_pending'] || 0) },
    { name: '已完成', value: claimsByStatus['completed'] || 0 },
    { name: '已驳回', value: claimsByStatus['rejected'] || 0 }
  ].filter(stage => stage.value > 0)

  const itemStatusStats = normalizeItemStatusStats(itemsByStatus)

  return {
    activeUsers: Object.values(usersByVerification).reduce((a, b) => a + Number(b), 0) || overview['总用户数'] || 0,
    successRate,
    publishFrequency: `${avgDailyPublish}/日`,
    riskUsers: payload.blacklist_count || payload.risk_users || 0,
    hotLocations,
    claimStages,
    itemStatusStats,
    dailyTrend: dailyTrendData,
    overview
  }
}

const barWidth = (value, list) => {
  const max = Math.max(...(list || []).map(item => item.value), 1)
  return `${Math.max(8, value / max * 100)}%`
}

const trendBarHeight = value => {
  const allValues = data.value.dailyTrend.flatMap(d => [d.items, d.claims])
  const max = Math.max(...allValues, 1)
  // 值为0时不显示柱子
  if (value <= 0) return '0px'
  // 非0值确保最小高度可见
  const minHeight = 24
  const maxHeight = 140
  const ratio = max > 0 ? value / max : 0
  const height = Math.max(minHeight, Math.round(ratio * maxHeight))
  return `${height}px`
}

const stageIcon = name => {
  switch (name) {
    case '待审核': return 'shield'
    case '已完成': return 'check'
    case '已驳回': return 'alert'
    default: return 'route'
  }
}

const stageTone = name => {
  switch (name) {
    case '已完成': return 'green'
    case '已驳回': return 'red'
    case '待交接': return 'blue'
    default: return 'orange'
  }
}

const statusType = type => {
  switch (type) {
    case 'success': return 'success'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'primary'
  }
}

const load = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await getAdminAnalyticsApi()
    data.value = normalizeAnalytics(res)
  } catch (err) {
    console.error('数据分析加载失败:', err)
    error.value = err?.response?.status === 404
      ? '数据分析接口暂未开放，请稍后重试或联系后端开发'
      : '数据加载失败，请稍后重试'
    ElMessage.warning(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <AppLoading :visible="loading" text="加载数据分析..." />

  <div class="analytics-page fade-up">
    <EmptyState
      v-if="error && !loading"
      icon="chart"
      title="数据加载失败"
      :desc="error"
    />

    <template v-if="!error">
      <!-- 核心指标卡片 -->
      <section class="metric-grid">
        <div class="metric-card glass-card">
          <LineIcon name="users" tone="blue" />
          <span>活跃用户</span>
          <b>{{ data.activeUsers }}</b>
        </div>

        <div class="metric-card glass-card">
          <LineIcon name="chart" tone="green" />
          <span>认领成功率</span>
          <b>{{ data.successRate }}%</b>
        </div>

        <div class="metric-card glass-card">
          <LineIcon name="pin" tone="purple" />
          <span>近7日发布</span>
          <b>{{ data.publishFrequency }}</b>
        </div>

        <div class="metric-card glass-card">
          <LineIcon name="alert" tone="red" />
          <span>风险用户</span>
          <b>{{ data.riskUsers }}</b>
        </div>
      </section>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button
          v-for="tab in [
            { key: 'overview', label: '总览' },
            { key: 'items', label: '物品分析' },
            { key: 'claims', label: '认领分析' },
            { key: 'locations', label: '热点区域' },
            { key: 'trend', label: '趋势' },
            { key: 'advice', label: '运营建议' }
          ]"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 总览 Tab -->
      <template v-if="activeTab === 'overview'">
        <section class="analysis-grid">
          <div class="glass-card panel">
            <h2>物品状态分布</h2>
            <p>当前平台物品各状态数量统计。</p>

            <div v-for="item in data.itemStatusStats" :key="item.name" class="bar-row">
              <el-tag :type="statusType(item.type)" size="small">{{ item.name }}</el-tag>
              <div><i :style="{ width: barWidth(item.value, data.itemStatusStats) }"></i></div>
              <b>{{ item.value }}<small>{{ item.percent }}%</small></b>
            </div>

            <EmptyState
              v-if="!data.itemStatusStats.length"
              icon="box"
              title="暂无数据"
              desc="物品状态数据为空"
            />
          </div>

          <div class="glass-card panel">
            <h2>认领阶段分布</h2>
            <p>帮助判断审核是否积压。</p>

            <div v-for="stage in data.claimStages" :key="stage.name" class="stage-row">
              <LineIcon :name="stageIcon(stage.name)" :tone="stageTone(stage.name)" />
              <span>{{ stage.name }}</span>
              <b>{{ stage.value }}</b>
            </div>

            <EmptyState
              v-if="!data.claimStages.length"
              icon="route"
              title="暂无数据"
              desc="认领阶段数据为空"
            />
          </div>
        </section>
      </template>

      <!-- 物品分析 Tab -->
      <template v-if="activeTab === 'items'">
        <section class="glass-card panel">
          <h2>物品状态分布</h2>
          <p>当前平台物品各状态数量统计。</p>

          <div v-for="item in data.itemStatusStats" :key="item.name" class="bar-row">
            <el-tag :type="statusType(item.type)" size="small">{{ item.name }}</el-tag>
            <div><i :style="{ width: barWidth(item.value, data.itemStatusStats) }"></i></div>
            <b>{{ item.value }}<small>{{ item.percent }}%</small></b>
          </div>

          <EmptyState
            v-if="!data.itemStatusStats.length"
            icon="box"
            title="暂无数据"
            desc="物品状态数据为空"
          />
        </section>
      </template>

      <!-- 认领分析 Tab -->
      <template v-if="activeTab === 'claims'">
        <section class="glass-card panel">
          <h2>认领阶段分布</h2>
          <p>帮助判断审核是否积压。</p>

          <div v-for="stage in data.claimStages" :key="stage.name" class="stage-row">
            <LineIcon :name="stageIcon(stage.name)" :tone="stageTone(stage.name)" />
            <span>{{ stage.name }}</span>
            <b>{{ stage.value }}</b>
          </div>

          <EmptyState
            v-if="!data.claimStages.length"
            icon="route"
            title="暂无数据"
            desc="认领阶段数据为空"
          />
        </section>
      </template>

      <!-- 热点区域 Tab -->
      <template v-if="activeTab === 'locations'">
        <section class="glass-card panel">
          <h2>热点区域预警</h2>
          <p>根据地点聚合失物 / 招领数据，便于管理员发布安全提醒。</p>

          <div v-if="data.hotLocations.length" class="hot-location-grid">
            <div v-for="location in data.hotLocations" :key="location.name" class="hot-location-card">
              <div class="hot-location-header">
                <LineIcon name="pin" tone="purple" />
                <span>{{ location.name }}</span>
                <b>{{ location.value }} 件</b>
              </div>
              <div class="hot-location-bar">
                <i :style="{ width: barWidth(location.value, data.hotLocations) }"></i>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            icon="pin"
            title="暂无热点数据"
            desc="后端暂未提供地点聚合数据，请联系后端开发添加 hot_locations 字段。"
          />
        </section>
      </template>

      <!-- 趋势 Tab -->
      <template v-if="activeTab === 'trend'">
        <section v-if="data.dailyTrend.length" class="glass-card panel trend-panel">
          <h2>近7日数据趋势</h2>
          <p>每日新增物品 / 认领数量变化。</p>

          <div class="trend-legend">
            <span class="legend-item">
              <i class="legend-dot items"></i> 新增物品
            </span>
            <span class="legend-item">
              <i class="legend-dot claims"></i> 新增认领
            </span>
          </div>

          <div class="trend-chart">
            <div v-for="item in data.dailyTrend" :key="item.date" class="trend-group">
              <div class="trend-bars">
                <div class="trend-bar-wrapper">
                  <div class="trend-bar items" :style="{ height: trendBarHeight(item.items) }"></div>
                  <span class="trend-value">{{ item.items }}</span>
                </div>
                <div class="trend-bar-wrapper">
                  <div class="trend-bar claims" :style="{ height: trendBarHeight(item.claims) }"></div>
                  <span class="trend-value">{{ item.claims }}</span>
                </div>
              </div>
              <span class="trend-date">{{ shortDate(item.date) }}</span>
            </div>
          </div>
        </section>

        <EmptyState
          v-else
          icon="chart"
          title="暂无趋势数据"
          desc="近7日数据为空"
        />
      </template>

      <!-- 运营建议 Tab -->
      <template v-if="activeTab === 'advice'">
        <section class="glass-card panel advice-panel">
          <h2>运营建议</h2>

          <div class="advice-grid">
            <div>
              <b>高发地点提醒</b>
              <p>将图书馆、食堂、实验楼等高频地点推送到首页安全提示。</p>
            </div>

            <div>
              <b>认领积压处理</b>
              <p>当待审核认领超过阈值时，管理员应优先处理高匹配度和贵重物品。</p>
            </div>

            <div>
              <b>风险用户监测</b>
              <p>对多次认领失败、高频发布、疑似虚假信息用户触发人工复核。</p>
            </div>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.analytics-page {
  display: grid;
  gap: 20px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  padding: 22px;
  display: grid;
  gap: 9px;
  background: #fff;
}

.metric-card :deep(.line-icon) {
  width: 44px;
  height: 44px;
}

.metric-card span {
  color: var(--muted);
  font-weight: 800;
}

.metric-card b {
  font-size: 30px;
  letter-spacing: -.05em;
}

/* Tab 切换 */
.tab-bar {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 124, 255, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(79, 124, 255, 0.08);
  color: var(--primary-strong);
}

.tab-btn.active {
  background: #fff;
  color: var(--primary-strong);
  box-shadow: 0 2px 8px rgba(79, 124, 255, 0.15);
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  padding: 24px;
  background: #fff;
}

.panel h2 {
  margin: 0 0 8px;
}

.panel p {
  margin: 0 0 18px;
  color: var(--muted);
  line-height: 1.7;
}

.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 96px;
  gap: 12px;
  align-items: center;
  margin: 14px 0;
  color: var(--muted);
}

.bar-row b {
  text-align: right;
  white-space: nowrap;
}

.bar-row b small {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 700;
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
  transition: width 0.6s ease;
}

.stage-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(17, 24, 39, .07);
}

.stage-row :deep(.line-icon) {
  width: 42px;
  height: 42px;
}

/* 热点区域 */
.hot-location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.hot-location-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(248, 251, 255, .72);
  border: 1px solid rgba(79, 124, 255, .1);
}

.hot-location-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.hot-location-header :deep(.line-icon) {
  width: 32px;
  height: 32px;
}

.hot-location-header span {
  flex: 1;
  font-weight: 700;
  color: var(--ink);
}

.hot-location-header b {
  color: var(--primary-strong);
  font-size: 18px;
}

.hot-location-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef2f7;
}

.hot-location-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transition: width 0.6s ease;
}

/* 趋势图 */
.trend-panel {
  overflow-x: auto;
}

.trend-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 8px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 700;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-dot.items {
  background: linear-gradient(180deg, var(--primary), var(--secondary));
}

.legend-dot.claims {
  background: linear-gradient(180deg, #ff9f43, #f368e0);
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 20px 0;
  min-height: 200px;
}

.trend-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 60px;
}

.trend-bars {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  height: 160px;
}

.trend-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 28px;
}

.trend-bar {
  width: 100%;
  max-width: 32px;
  min-height: 0;
  border-radius: 6px 6px 0 0;
  transition: height 0.6s ease;
}

.trend-bar.items {
  background: linear-gradient(180deg, var(--primary), var(--secondary));
}

.trend-bar.claims {
  background: linear-gradient(180deg, #ff9f43, #f368e0);
}

.trend-date {
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
}

.trend-value {
  font-size: 12px;
  color: var(--primary-strong);
  font-weight: 800;
}

/* 运营建议 */
.advice-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.advice-grid div {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
}

.advice-grid p {
  margin: 8px 0 0;
}

@media (max-width: 920px) {
  .metric-grid,
  .analysis-grid,
  .advice-grid,
  .hot-location-grid {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    gap: 12px;
  }

  .tab-bar {
    flex-wrap: wrap;
  }
}
</style>