<script setup>
import { useRouter } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'

const router = useRouter()

const goHome = () => {
  router.push('/home')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/home')
}
</script>

<template>
  <div class="not-found-page">
    <section class="not-found-card fade-up" aria-labelledby="notfound-title">
      <div class="decor decor-left" aria-hidden="true"></div>
      <div class="decor decor-right" aria-hidden="true"></div>

      <div class="status-block">
        <div class="icon-wrap">
          <LineIcon name="file" tone="blue" />
        </div>

        <div class="status-code" aria-hidden="true">404</div>
      </div>

      <span class="kicker">页面不存在</span>

      <h1 id="notfound-title">你访问的页面没有找到</h1>

      <p class="summary">
        可能是地址输入错误、页面已被移动，或者该功能暂未开放。你可以返回上一页，或回到首页继续使用 FindU。
      </p>

      <div class="hint-box">
        <b>你可以尝试</b>

        <ul>
          <li>检查浏览器地址栏中的路径是否正确。</li>
          <li>返回首页，从导航栏重新进入对应功能。</li>
          <li>如果是管理员页面，请确认当前账号是否具备管理员权限。</li>
        </ul>
      </div>

      <div class="actions">
        <el-button size="large" class="ghost-btn" @click="goBack">返回上一页</el-button>
        <el-button size="large" type="primary" class="primary-btn" @click="goHome">回到首页</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  padding: 40px 20px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(79, 124, 255, .20), transparent 30%),
    radial-gradient(circle at 84% 78%, rgba(0, 184, 148, .16), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.not-found-card {
  position: relative;
  width: min(780px, 100%);
  overflow: hidden;
  padding: 48px;
  border: 1px solid rgba(255, 255, 255, .72);
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
  background: rgba(79, 124, 255, .16);
}

.decor-right {
  right: -92px;
  bottom: -94px;
  background: rgba(0, 184, 148, .14);
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
  border: 1px solid rgba(79, 124, 255, .18);
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .16), rgba(255, 255, 255, .78));
  box-shadow: 0 18px 42px rgba(79, 124, 255, .16);
}

.status-code {
  color: rgba(31, 45, 92, .08);
  font-size: clamp(76px, 13vw, 128px);
  font-weight: 1000;
  line-height: .82;
  letter-spacing: -.08em;
}

.not-found-card .kicker {
  position: relative;
  z-index: 1;
  display: inline-block;
  margin-top: -12px;
}

.not-found-card h1 {
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

.hint-box {
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

.hint-box b {
  display: block;
  margin-bottom: 12px;
  color: var(--ink);
  font-size: 16px;
}

.hint-box ul {
  margin: 0;
  padding-left: 20px;
}

.hint-box li {
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
  .not-found-page {
    padding: 24px 16px;
  }

  .not-found-card {
    padding: 34px 22px;
    border-radius: 30px;
  }

  .hint-box {
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