<script setup>
import { onMounted, ref } from 'vue'
import LineIcon from '@/components/LineIcon.vue'
import { getAdminAnalyticsApi } from '@/api/admin'

const data = ref({
  activeUsers: 0,
  successRate: 0,
  publishFrequency: '0/日',
  riskUsers: 0,
  hotLocations: [],
  claimStages: []
})

const normalizeAnalytics = res => {
  const payload = res?.data || res || {}

  return {
    activeUsers: payload.activeUsers || payload.active_users || 0,
    successRate: payload.successRate || payload.success_rate || 0,
    publishFrequency: payload.publishFrequency || payload.publish_frequency || '0/日',
    riskUsers: payload.riskUsers || payload.risk_users || 0,
    hotLocations: payload.hotLocations || payload.hot_locations || [],
    claimStages: payload.claimStages || payload.claim_stages || []
  }
}

const barWidth = value => {
  const max = Math.max(...(data.value.hotLocations || []).map(item => item.value), 1)

  return `${Math.max(8, value / max * 100)}%`
}

const stageIcon = name => {
  switch (name) {
    case '待审核':
      return 'shield'
    case '已完成':
      return 'check'
    case '已驳回':
      return 'alert'
    default:
      return 'route'
  }
}

const stageTone = name => {
  switch (name) {
    case '已完成':
      return 'green'
    case '已驳回':
      return 'red'
    case '待交接':
      return 'blue'
    default:
      return 'orange'
  }
}

const load = async () => {
  const res = await getAdminAnalyticsApi()

  data.value = normalizeAnalytics(res)
}

onMounted(load)
</script>

<template>
  <div class="analytics-page fade-up">
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

    <section class="analysis-grid">
      <div class="glass-card panel">
        <h2>热点区域预警</h2>

        <p>根据地点聚合失物 / 招领数据，便于管理员发布安全提醒。</p>

        <div v-for="location in data.hotLocations" :key="location.name" class="bar-row">
          <span>{{ location.name }}</span>

          <div>
            <i :style="{ width: barWidth(location.value) }"></i>
          </div>

          <b>{{ location.value }}</b>
        </div>
      </div>

      <div class="glass-card panel">
        <h2>认领阶段分布</h2>

        <p>帮助判断审核是否积压。</p>

        <div v-for="stage in data.claimStages" :key="stage.name" class="stage-row">
          <LineIcon :name="stageIcon(stage.name)" :tone="stageTone(stage.name)" />
          <span>{{ stage.name }}</span>
          <b>{{ stage.value }}</b>
        </div>
      </div>
    </section>

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

.analysis-grid {
  display: grid;
  grid-template-columns: 1.08fr .92fr;
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
  .advice-grid {
    grid-template-columns: 1fr;
  }
}
</style>