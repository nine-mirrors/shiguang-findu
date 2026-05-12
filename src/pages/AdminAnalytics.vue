<template>
  <div class="analytics-page fade-up">
    <section class="metric-grid">
      <div class="metric-card glass-card"><LineIcon name="users" tone="blue" /><span>活跃用户</span><b>{{ data.activeUsers }}</b></div>
      <div class="metric-card glass-card"><LineIcon name="chart" tone="green" /><span>认领成功率</span><b>{{ data.successRate }}%</b></div>
      <div class="metric-card glass-card"><LineIcon name="pin" tone="purple" /><span>近7日发布</span><b>{{ data.publishFrequency }}</b></div>
      <div class="metric-card glass-card"><LineIcon name="alert" tone="red" /><span>风险用户</span><b>{{ data.riskUsers }}</b></div>
    </section>

    <section class="analysis-grid">
      <div class="glass-card panel"><h2>热点区域预警</h2><p>根据地点聚合失物/招领数据，便于管理员发布安全提醒。</p><div v-for="loc in data.hotLocations" :key="loc.name" class="bar-row"><span>{{ loc.name }}</span><div><i :style="{width: barWidth(loc.value)}"></i></div><b>{{ loc.value }}</b></div></div>
      <div class="glass-card panel"><h2>认领阶段分布</h2><p>帮助判断审核是否积压。</p><div v-for="stage in data.claimStages" :key="stage.name" class="stage-row"><LineIcon :name="stageIcon(stage.name)" :tone="stageTone(stage.name)" /><span>{{ stage.name }}</span><b>{{ stage.value }}</b></div></div>
    </section>

    <section class="glass-card panel advice-panel"><h2>运营建议</h2><div class="advice-grid"><div><b>高发地点提醒</b><p>将图书馆、食堂、实验楼等高频地点推送到首页安全提示。</p></div><div><b>认领积压处理</b><p>当待审核认领超过阈值时，管理员应优先处理高匹配度和贵重物品。</p></div><div><b>风险用户监测</b><p>对多次认领失败、高频发布、疑似虚假信息用户触发人工复核。</p></div></div></section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import LineIcon from '@/components/LineIcon.vue'
import { fetchAnalytics } from '@/api/lostFound'
const data = ref({ activeUsers:0, successRate:0, publishFrequency:'0/日', riskUsers:0, hotLocations:[], claimStages:[] })
function barWidth(v){ const max = Math.max(...(data.value.hotLocations || []).map(i=>i.value), 1); return `${Math.max(8, v / max * 100)}%` }
function stageIcon(name){ return name === '待审核' ? 'shield' : name === '已完成' ? 'check' : name === '已驳回' ? 'alert' : 'route' }
function stageTone(name){ return name === '已完成' ? 'green' : name === '已驳回' ? 'red' : name === '待交接' ? 'blue' : 'orange' }
onMounted(async()=>{ data.value = await fetchAnalytics() })
</script>
<style scoped>
.analytics-page{display:grid;gap:20px}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.metric-card{padding:22px;background:#fff;display:grid;gap:9px}.metric-card :deep(.line-icon){width:44px;height:44px}.metric-card span{color:var(--muted);font-weight:800}.metric-card b{font-size:30px;letter-spacing:-.05em}.analysis-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:20px}.panel{padding:24px;background:#fff}.panel h2{margin:0 0 8px}.panel p{margin:0 0 18px;color:var(--muted);line-height:1.7}.bar-row{display:grid;grid-template-columns:84px 1fr 30px;gap:12px;align-items:center;margin:16px 0;color:var(--muted)}.bar-row div{height:10px;background:#eef2f7;border-radius:999px;overflow:hidden}.bar-row i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--primary),var(--success))}.stage-row{display:grid;grid-template-columns:46px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(17,24,39,.07)}.stage-row :deep(.line-icon){width:42px;height:42px}.advice-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.advice-grid div{padding:18px;border-radius:20px;background:#f8fafc}.advice-grid p{margin:8px 0 0}@media(max-width:920px){.metric-grid,.analysis-grid,.advice-grid{grid-template-columns:1fr}}
</style>
