<template>
  <div class="admin-shell page-shell">
    <aside class="admin-side glass-card">
      <router-link to="/admin/dashboard" class="admin-brand">
        <span class="brand-mark pulse-ring">拾</span>
        <div><b>拾光 FindU</b><small>运营管理后台</small></div>
      </router-link>
      <div class="role-card">
        <LineIcon name="shield" tone="blue" />
        <div>
          <b>管理员工作台</b>
          <p>只负责审核、交接、风控和运营，不参与前台发布。</p>
        </div>
      </div>
      <nav class="admin-nav">
        <router-link v-for="link in links" :key="link.path" :to="link.path">
          <LineIcon :name="link.icon" :tone="link.tone" />
          <span>{{ link.label }}</span>
        </router-link>
      </nav>
      <button class="logout-btn" @click="logout">退出后台</button>
    </aside>
    <main class="admin-main">
      <div class="admin-top glass-card">
        <div>
          <span class="kicker">拾光运营中枢</span>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDesc }}</p>
        </div>
        <div class="top-actions">
          <el-tag class="soft-tag">前后端联动演示</el-tag>
          <el-button @click="refreshPage">刷新视图</el-button>
        </div>
      </div>
      <router-view v-slot="{ Component, route: childRoute }">
        <component :is="Component" :key="`${childRoute.fullPath}-${refreshKey}`" />
      </router-view>
    </main>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LineIcon from '@/components/LineIcon.vue'
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const links = [
  { label: '运营总览', path: '/admin/dashboard', icon: 'chart', tone: 'blue', desc: '待办、风险、滞留与运营指标' },
  { label: '审核中心', path: '/admin/review', icon: 'shield', tone: 'purple', desc: '内容审核、认领核验与补充材料' },
  { label: '运营处理', path: '/admin/operations', icon: 'package', tone: 'green', desc: '交接、公告、滞留移交与争议处理' },
  { label: '用户风控', path: '/admin/risk', icon: 'user-check', tone: 'orange', desc: '实名认证、异常用户与黑名单' },
  { label: '数据分析', path: '/admin/analytics', icon: 'route', tone: 'blue', desc: '热点区域、趋势、成功率与运营建议' }
]
const current = computed(() => links.find(link => route.path.startsWith(link.path)) || links[0])
const pageTitle = computed(() => current.value.label)
const pageDesc = computed(() => current.value.desc)
const refreshKey = ref(0)
function logout(){ userStore.logout(); router.push('/login') }
function refreshPage(){ refreshKey.value += 1 }
</script>
<style scoped>
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 286px minmax(0, 1fr); background: transparent; }
.admin-side { position: sticky; top: 18px; align-self: start; height: calc(100vh - 36px); margin: 18px 0 18px 18px; padding: 20px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
.admin-side::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 10% 0%, rgba(79,124,255,.16), transparent 18rem), radial-gradient(circle at 90% 100%, rgba(0,184,148,.12), transparent 18rem); }
.admin-brand, .role-card, .admin-nav, .logout-btn { position: relative; z-index: 1; }
.admin-brand { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 20px; }
.brand-mark { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 17px; color: white; font-weight: 1000; background: linear-gradient(135deg, var(--primary), var(--success)); box-shadow: 0 12px 30px rgba(79,124,255,.28); }
.admin-brand b { display: block; font-size: 19px; letter-spacing: -.04em; }
.admin-brand small { color: var(--muted); display: block; margin-top: 3px; }
.role-card { display: grid; grid-template-columns: 46px 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 22px; background: rgba(79,124,255,.08); border: 1px solid rgba(79,124,255,.10); }
.role-card :deep(.line-icon) { width: 42px; height: 42px; }
.role-card b { display: block; }
.role-card p { margin: 5px 0 0; color: var(--muted); line-height: 1.55; font-size: 13px; }
.admin-nav { display: grid; gap: 8px; margin-top: 4px; }
.admin-nav a { padding: 11px; border-radius: 18px; color: #475569; font-weight: 900; display: flex; align-items: center; gap: 12px; transition: .22s ease; }
.admin-nav :deep(.line-icon) { width: 38px; height: 38px; border-radius: 14px; background: rgba(255,255,255,.78); }
.admin-nav :deep(.line-icon svg) { width: 21px; height: 21px; }
.admin-nav a.router-link-active, .admin-nav a:hover { color: var(--primary-strong); background: rgba(79,124,255,.10); transform: translateX(3px); }
.logout-btn { margin-top: auto; border: 1px solid rgba(17,24,39,.08); background: rgba(255,255,255,.72); color: var(--ink); border-radius: 16px; padding: 12px; cursor: pointer; font-weight: 900; }
.admin-main { padding: 18px 24px 40px; min-width: 0; }
.admin-top { margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 23px 26px; }
.admin-top h1 { margin: 10px 0 6px; font-size: 30px; letter-spacing: -.055em; }
.admin-top p { margin: 0; color: var(--muted); line-height: 1.7; }
.top-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
@media (max-width: 980px) { .admin-shell { grid-template-columns: 1fr; } .admin-side { position: relative; height: auto; margin: 14px; } .admin-nav { grid-template-columns: repeat(2, 1fr); } .admin-main { padding: 10px 14px 32px; } }
@media (max-width: 620px) { .admin-nav { grid-template-columns: 1fr; } .admin-top { display: block; } .top-actions { justify-content: flex-start; margin-top: 14px; } }
</style>
