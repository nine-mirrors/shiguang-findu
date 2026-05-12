<template>
  <div class="admin-dashboard fade-up">
    <section class="admin-hero">
      <div>
        <span class="kicker">拾光运营中枢</span>
        <h1>不只是审核列表，而是完整的失物运营后台。</h1>
        <p>管理员只处理平台运营、内容质量、认领核验、滞留移交、用户风控和数据分析，不参与普通用户发布流程。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="$router.push('/admin/review')">处理待审核</el-button>
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
        <div class="panel-head"><div><h2>今日待办队列</h2><p>按风险等级聚合管理员需要优先处理的任务。</p></div><el-tag class="soft-tag">{{ data.todos?.length || 0 }} 项</el-tag></div>
        <div v-for="todo in data.todos" :key="todo.id" class="todo-row" @click="$router.push(todo.target)">
          <LineIcon :name="todo.type === 'claim' ? 'user-check' : todo.type === 'storage' ? 'package' : 'shield'" :tone="todo.level === 'high' ? 'red' : 'orange'" />
          <div><b>{{ todo.title }}</b><p>{{ todo.type === 'claim' ? '认领核验' : todo.type === 'storage' ? '滞留保管' : '内容审核' }}</p></div>
          <el-tag :type="todo.level === 'high' ? 'danger' : 'warning'">{{ todo.level === 'high' ? '高优先级' : '中优先级' }}</el-tag>
        </div>
      </div>

      <div class="glass-card panel">
        <div class="panel-head"><div><h2>高频丢失地点</h2><p>用于发布热点区域提醒。</p></div></div>
        <div v-for="loc in data.locations" :key="loc.name" class="bar-row">
          <span>{{ loc.name }}</span><div><i :style="{ width: barWidth(loc.value) }"></i></div><b>{{ loc.value }}</b>
        </div>
      </div>
    </section>

    <section class="glass-card panel retention-board">
      <div class="panel-head">
        <div><h2>滞留物品快照</h2><p>管理员需要关注保管期、入库编号和移交状态，避免物品长期无人处理。</p></div>
        <el-button @click="$router.push('/admin/operations')">进入运营处理</el-button>
      </div>
      <div v-for="item in data.retainedItems" :key="item.id" class="retention-row">
        <div><b>{{ item.name }}</b><p>{{ item.storageCode || '未入库' }} · {{ item.location }} · {{ item.createdAt }}</p></div>
        <RetentionBadge :item="item" />
      </div>
    </section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import StatCard from '@/components/StatCard.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'
import LineIcon from '@/components/LineIcon.vue'
import { fetchDashboard } from '@/api/lostFound'
const data = ref({ total:0, pending:0, retained:0, blacklist:0, claimPending:0, todos:[], retainedItems:[], locations:[] })
function barWidth(v){ const max = Math.max(...(data.value.locations || []).map(i=>i.value), 1); return `${Math.max(8, v / max * 100)}%` }
onMounted(async()=>{ data.value = await fetchDashboard() })
</script>
<style scoped>
.admin-dashboard{display:grid;gap:20px}.admin-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:30px;border-radius:32px;color:#fff;background:radial-gradient(circle at 8% 0%,rgba(255,255,255,.28),transparent 18rem),linear-gradient(135deg,#172554,#315fff 58%,#00b894);box-shadow:0 28px 70px rgba(49,95,255,.24)}.admin-hero h1{max-width:820px;margin:18px 0 12px;font-size:38px;letter-spacing:-.06em;line-height:1.08}.admin-hero p{max-width:760px;color:rgba(255,255,255,.78);line-height:1.8}.admin-hero .kicker{color:#fff;background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.18)}.hero-actions{display:flex;gap:10px;flex-wrap:wrap}.admin-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.dashboard-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:20px}.panel{padding:24px;background:rgba(255,255,255,.9)}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.panel-head h2{margin:0 0 8px}.panel-head p{margin:0;color:var(--muted);line-height:1.7}.todo-row{display:grid;grid-template-columns:46px 1fr auto;gap:14px;align-items:center;padding:14px;border-radius:20px;border:1px solid rgba(17,24,39,.06);margin-top:12px;cursor:pointer;transition:.22s ease}.todo-row:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(31,45,92,.1)}.todo-row :deep(.line-icon){width:42px;height:42px}.todo-row p{margin:4px 0 0;color:var(--muted)}.bar-row{display:grid;grid-template-columns:84px 1fr 30px;gap:12px;align-items:center;margin:16px 0;color:var(--muted)}.bar-row div{height:10px;background:#eef2f7;border-radius:999px;overflow:hidden}.bar-row i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--primary),var(--success))}.retention-board{margin-top:0}.retention-row{display:grid;grid-template-columns:280px 1fr;gap:14px;align-items:center;padding:14px 0;border-top:1px solid rgba(17,24,39,.08)}.retention-row p{margin:6px 0 0;color:var(--muted)}@media(max-width:980px){.admin-hero{display:block}.admin-stats,.dashboard-grid,.retention-row{grid-template-columns:1fr}}
</style>
