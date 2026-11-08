<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuOpen = ref(false)

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

const links = [
  { label: '首页', path: '/home' },
  { label: '失物大厅', path: '/items' },
  { label: '发布信息', path: '/publish' },
  { label: '我的发布', path: '/my-posts' },
  { label: '收藏夹', path: '/favorites' },
  { label: '通知', path: '/notifications' },
  { label: '帮助', path: '/guide' }
]

const dropdownMenus = [
  { label: '个人中心', command: 'profile' },
  { label: '我的发布', command: 'my' },
  { label: '收藏夹', command: 'favorites' },
  { label: '通知中心', command: 'notice' },
  { label: '退出登录', command: 'logout', divided: true }
]

const handleCommand = async command => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'my':
      router.push('/my-posts')
      break
    case 'notice':
      router.push('/notifications')
      break
    case 'favorites':
      router.push('/favorites')
      break
    case 'logout':
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
    default:
      break
  }
}
</script>

<template>
  <div class="page-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>

    <header class="topbar">
      <div class="container nav-inner">
        <router-link to="/home" class="brand" aria-label="拾光 FindU 首页">
          <span class="brand-mark pulse-ring" aria-hidden="true">拾</span>

          <span>
            <b>拾光 FindU</b>
            <small>校园智能失物协寻平台</small>
          </span>
        </router-link>

        <nav class="nav-links" aria-label="主导航">
          <router-link v-for="link in links" :key="link.path" :to="link.path">{{ link.label }}</router-link>
        </nav>

        <div class="nav-actions">
          <el-button type="primary" @click="$router.push('/publish')">发布协寻</el-button>

          <button
            v-if="userStore.isLogin"
            type="button"
            class="menu-btn"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            aria-label="打开导航菜单"
            @click="menuOpen = true"
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>

          <el-dropdown v-if="userStore.isLogin" @command="handleCommand">
            <button class="user-btn" type="button" aria-label="账户菜单">
              <span class="nav-avatar" aria-hidden="true">{{ userStore.avatarText }}</span>
              <span>{{ userStore.displayName }}</span>
            </button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in dropdownMenus" :key="item.command" :command="item.command" :divided="item.divided">{{ item.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button v-else @click="$router.push('/login')">登录</el-button>
        </div>
      </div>
    </header>

    <el-drawer
      v-model="menuOpen"
      direction="rtl"
      size="280px"
      title="导航菜单"
      append-to-body
    >
      <nav id="mobile-nav" class="mobile-nav" aria-label="移动端主导航">
        <router-link v-for="link in links" :key="link.path" :to="link.path" @click="menuOpen = false">
          {{ link.label }}
        </router-link>

        <router-link to="/publish" class="mobile-nav-primary" @click="menuOpen = false">
          发布协寻
        </router-link>
      </nav>
    </el-drawer>

    <main id="main-content" class="layout-main" tabindex="-1">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(18px);
  background: rgba(248, 251, 255, .78);
  border-bottom: 1px solid rgba(17, 24, 39, .06);
}

.nav-inner {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 250px;
}

.brand-mark {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: white;
  font-weight: 1000;
  background: linear-gradient(135deg, var(--primary), var(--success));
  box-shadow: 0 12px 30px rgba(79, 124, 255, .28);
}

.brand b {
  display: block;
  font-size: 19px;
  letter-spacing: -.04em;
}

.brand small {
  display: block;
  margin-top: 2px;
  color: var(--muted);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  word-break: keep-all;
}

.nav-links a {
  padding: 10px 15px;
  border-radius: 999px;
  color: #4b5563;
  font-weight: 700;
  transition: .2s ease;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--primary-strong);
  background: rgba(79, 124, 255, .10);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-btn {
  border: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 4px 6px;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  color: var(--ink);
  font-weight: 800;
}

.menu-btn {
  display: none;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid rgba(17, 24, 39, .10);
  border-radius: 14px;
  background: rgba(255, 255, 255, .82);
  cursor: pointer;
  place-items: center;
  gap: 4px;
}

.nav-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #315fff, #4f7cff);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.menu-btn span {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--ink);
}

.mobile-nav {
  display: grid;
  gap: 6px;
}

.mobile-nav a {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 14px;
  color: #374151;
  font-weight: 800;
}

.mobile-nav a.router-link-active {
  color: var(--primary-strong);
  background: rgba(79, 124, 255, .10);
}

.mobile-nav-primary {
  margin-top: 8px;
  justify-content: center;
  color: #fff !important;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.layout-main {
  padding-bottom: 58px;
}

.layout-main:focus {
  outline: none;
}

@media (max-width: 960px) {
  .nav-links {
    display: none;
  }

  .menu-btn {
    display: grid;
  }

  .brand {
    min-width: auto;
  }

  .brand small {
    display: none;
  }
}

@media (max-width: 560px) {
  .nav-inner {
    height: 68px;
  }

  .nav-actions .el-button:first-child {
    display: none;
  }

  .user-btn {
    min-width: 40px;
    justify-content: center;
    padding: 4px;
  }

  .user-btn > span:not(.nav-avatar) {
    display: none;
  }
}
</style>