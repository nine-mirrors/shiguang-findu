<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LineIcon from '@/components/LineIcon.vue'

const router = useRouter()
const userStore = useUserStore()

const backPath = computed(() => {
  if (userStore.isAdmin) return '/admin/dashboard'

  return '/home'
})

const backText = computed(() => {
  if (userStore.isAdmin) return '返回管理后台'

  return '返回首页'
})

const goBack = () => {
  router.push(backPath.value)
}

const goLogin = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="forbidden-page">
    <section class="forbidden-card fade-up" aria-labelledby="forbidden-title">
      <div class="decor decor-left" aria-hidden="true"></div>
      <div class="decor decor-right" aria-hidden="true"></div>

      <div class="status-block">
        <div class="icon-wrap">
          <LineIcon name="shield" tone="orange" />
        </div>

        <div class="status-code" aria-hidden="true">403</div>
      </div>

      <span class="kicker">访问受限</span>

      <h1 id="forbidden-title">当前账号没有访问权限</h1>

      <p class="summary">
        你正在访问受权限保护的页面。普通用户不能进入管理员后台，管理员账号也不参与普通用户端的发布、认领和收藏流程。
      </p>

      <div class="reason-box">
        <b>可能原因</b>

        <ul>
          <li>当前账号不是管理员，无法访问后台管理页面。</li>
          <li>登录状态发生变化，页面仍停留在受限地址。</li>
          <li>路由权限和接口权限不一致，需要重新登录确认身份。</li>
        </ul>
      </div>

      <div class="actions">
        <el-button size="large" class="ghost-btn" @click="goBack">{{ backText }}</el-button>
        <el-button size="large" type="primary" class="primary-btn" @click="goLogin">切换账号登录</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  padding: 40px 20px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 159, 67, .20), transparent 30%),
    radial-gradient(circle at 84% 78%, rgba(79, 124, 255, .18), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.forbidden-card {
  position: relative;
  width: min(780px, 100%);
  overflow: hidden;
  padding: 48px;
  border: 1px solid rgba(255, 255, 255, .70);
  border-radius: 38px;
  background: rgba(255, 255, 255, .86);
  box-shadow: 0 28px 80px rgba(31, 45, 92, .16);
  text-align: center;
  backdrop-filter: blur(18px);
}

.decor {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(2px);
}

.decor-left {
  left: -82px;
  top: -86px;
  background: rgba(255, 159, 67, .18);
}

.decor-right {
  right: -92px;
  bottom: -94px;
  background: rgba(79, 124, 255, .16);
}

.status-block {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 14px;
}

.icon-wrap {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 159, 67, .18);
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(255, 159, 67, .16), rgba(255, 255, 255, .78));
  box-shadow: 0 18px 42px rgba(255, 159, 67, .16);
}

.status-code {
  color: rgba(31, 45, 92, .08);
  font-size: clamp(76px, 13vw, 128px);
  font-weight: 1000;
  line-height: .82;
  letter-spacing: -.08em;
}

.forbidden-card .kicker {
  position: relative;
  z-index: 1;
  display: inline-block;
  margin-top: -12px;
}

.forbidden-card h1 {
  position: relative;
  z-index: 1;
  margin: 18px 0 14px;
  color: var(--ink);
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.16;
  letter-spacing: -.03em;
}

.summary {
  position: relative;
  z-index: 1;
  max-width: 590px;
  margin: 0 auto;
  color: var(--muted);
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.reason-box {
  position: relative;
  z-index: 1;
  max-width: 560px;
  margin: 28px auto 0;
  padding: 22px 24px;
  border: 1px solid rgba(79, 124, 255, .10);
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(248, 251, 255, .94), rgba(255, 255, 255, .78));
  text-align: left;
}

.reason-box b {
  display: block;
  margin-bottom: 12px;
  color: var(--ink);
  font-size: 16px;
}

.reason-box ul {
  margin: 0;
  padding-left: 20px;
}

.reason-box li {
  color: var(--muted);
  line-height: 1.85;
}

.actions {
  position: relative;
  z-index: 1;
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.actions .el-button {
  min-width: 146px;
  height: 44px;
  border-radius: 999px;
  font-weight: 900;
}

.ghost-btn {
  background: rgba(255, 255, 255, .72);
}

.primary-btn {
  box-shadow: 0 14px 30px rgba(79, 124, 255, .22);
}

@media (max-width: 620px) {
  .forbidden-page {
    padding: 24px 16px;
  }

  .forbidden-card {
    padding: 34px 22px;
    border-radius: 30px;
  }

  .reason-box {
    padding: 18px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions .el-button {
    width: 100%;
  }
}
</style>