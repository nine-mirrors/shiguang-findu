<template>
  <div class="page-shell">
    <header class="topbar">
      <div class="container nav-inner">
        <router-link to="/home" class="brand">
          <span class="brand-mark pulse-ring">拾</span>
          <span><b>拾光 FindU</b><small>校园智能失物协寻平台</small></span>
        </router-link>
        <nav class="nav-links">
          <router-link v-for="link in links" :key="link.path" :to="link.path">{{ link.label }}</router-link>
        </nav>
        <div class="nav-actions">
          <el-button type="primary" @click="$router.push('/publish')">发布协寻</el-button>
          <el-dropdown v-if="userStore.isLogin" @command="handleCommand">
            <button class="user-btn">
              <el-avatar :size="34">{{ userStore.avatarText }}</el-avatar>
              <span>{{ userStore.displayName }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="verify">实名认证</el-dropdown-item>
                <el-dropdown-item command="my">我的发布</el-dropdown-item>
                <el-dropdown-item command="claims">我的认领</el-dropdown-item>
                <el-dropdown-item command="notice">通知中心</el-dropdown-item>
                      <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-else @click="$router.push('/login')">登录</el-button>
        </div>
      </div>
    </header>
    <main class="layout-main"><router-view /></main>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
const router = useRouter()
const userStore = useUserStore()
const links = [
  { label: '首页', path: '/home' },
  { label: '失物大厅', path: '/items' },
  { label: '发布信息', path: '/publish' },
  { label: '我的发布', path: '/my-posts' },
  { label: '我的认领', path: '/my-claims' },
  { label: '收藏夹', path: '/favorites' },
  { label: '通知', path: '/notifications' },
  { label: '帮助', path: '/guide' }
]
function handleCommand(command) {
  if (command === 'logout') { userStore.logout(); router.push('/login'); return }
  if (command === 'profile') router.push('/profile')
  if (command === 'my') router.push('/my-posts')
  if (command === 'claims') router.push('/my-posts?tab=claims')
  if (command === 'verify') router.push('/verification')
  if (command === 'notice') router.push('/notifications')
}
</script>
<style scoped>
.topbar { position: sticky; top: 0; z-index: 30; backdrop-filter: blur(18px); background: rgba(248,251,255,.78); border-bottom: 1px solid rgba(17,24,39,.06); }
.nav-inner { height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand { display: flex; align-items: center; gap: 12px; min-width: 250px; }
.brand-mark { width: 43px; height: 43px; display: grid; place-items: center; border-radius: 16px; color: white; font-weight: 1000; background: linear-gradient(135deg, var(--primary), var(--success)); box-shadow: 0 12px 30px rgba(79,124,255,.28); }
.brand b { display: block; font-size: 19px; letter-spacing: -.04em; }
.brand small { display: block; margin-top: 2px; color: var(--muted); }
.nav-links { display: flex; align-items: center; gap: 6px; }
.nav-links a { padding: 10px 15px; border-radius: 999px; color: #4b5563; font-weight: 700; transition: .2s ease; }
.nav-links a:hover, .nav-links a.router-link-active { color: var(--primary-strong); background: rgba(79,124,255,.10); }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.user-btn { border: 0; background: transparent; display: inline-flex; align-items: center; gap: 9px; cursor: pointer; color: var(--ink); font-weight: 800; }
.layout-main { padding-bottom: 58px; }
@media (max-width: 960px) { .nav-links { display: none; } .brand { min-width: auto; } .brand small { display: none; } }
@media (max-width: 560px) { .nav-inner { height: 68px; } .nav-actions .el-button:first-child { display: none; } .user-btn span { display: none; } }
</style>
