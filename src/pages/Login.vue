<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const getRedirectPath = () => {
  const redirect = typeof route.query.redirect === 'string'
    ? route.query.redirect
    : ''

  if (userStore.isAdmin) {
    return redirect.startsWith('/admin') ? redirect : '/admin/dashboard'
  }

  if (redirect.startsWith('/admin')) {
    return '/home'
  }

  return redirect || '/home'
}

const submit = async () => {
  if (loading.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push(getRedirectPath())
  } catch {
    // 错误已在 request 拦截器中处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="bg-orb orb-one"></div>
    <div class="bg-orb orb-two"></div>
    <div class="bg-orb orb-three"></div>

    <section class="login-card fade-up">
      <div class="brand-panel">
        <div class="brand-top">
          <div class="brand-logo" aria-hidden="true">拾</div>

          <div>
            <b>拾光 FindU</b>
            <span>校园失物招领平台</span>
          </div>
        </div>

        <span class="kicker">Campus Lost & Found</span>

        <h1>拾起遗失之物找回校园微光</h1>

        <p>
          聚合失物发布、管理员审核、图片归档与状态通知，让校园失物信息更有秩序，也让每一次归还有迹可循。
        </p>

        <div class="mini-board">
          <div>
            <b>审核</b>
            <span>发布审核闭环</span>
          </div>

          <div>
            <b>图片</b>
            <span>图片归档展示</span>
          </div>

          <div>
            <b>通知</b>
            <span>状态通知追踪</span>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <div class="form-head">
          <span class="kicker">账号登录</span>

          <h2>欢迎回来</h2>

          <p>使用邮箱和密码登录，进入拾光 FindU 校园失物招领平台。</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="login-form"
          :validate-on-rule-change="false"
          @keyup.enter="submit"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model.trim="form.email"
              size="large"
              autocomplete="username"
              placeholder="请输入邮箱"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </el-form-item>

          <div class="form-extra">
            <router-link to="/forgot-password">忘记密码？</router-link>
          </div>

          <el-button
            class="login-btn"
            type="primary"
            size="large"
            :loading="loading"
            @click="submit"
          >
            登录平台
          </el-button>
        </el-form>

        <p class="switch-line">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  padding: 32px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 18%, rgba(79, 124, 255, .18), transparent 30%),
    radial-gradient(circle at 86% 82%, rgba(0, 184, 148, .16), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 56%, #f8fffb 100%);
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(1px);
}

.orb-one {
  width: 420px;
  height: 420px;
  left: -150px;
  top: -120px;
  background: rgba(79, 124, 255, .16);
  animation: floatSlow 8s infinite;
}

.orb-two {
  width: 360px;
  height: 360px;
  right: -120px;
  bottom: -120px;
  background: rgba(0, 184, 148, .15);
  animation: floatSlow 9s infinite reverse;
}

.orb-three {
  width: 190px;
  height: 190px;
  right: 16%;
  top: 12%;
  background: rgba(108, 99, 255, .10);
  animation: floatSlow 7s infinite;
}

.login-card {
  position: relative;
  z-index: 1;
  width: min(1080px, 100%);
  min-height: 650px;
  display: grid;
  grid-template-columns: 1.06fr .94fr;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .76);
  border-radius: 38px;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 40px 110px rgba(31, 45, 92, .18);
  backdrop-filter: blur(18px);
}

.brand-panel {
  position: relative;
  padding: 54px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at 24% 20%, rgba(79, 124, 255, .18), transparent 34%),
    radial-gradient(circle at 82% 84%, rgba(0, 184, 148, .13), transparent 32%),
    linear-gradient(135deg, rgba(248, 251, 255, .94), rgba(238, 244, 255, .72));
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.brand-logo {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  color: #fff;
  font-size: 24px;
  font-weight: 1000;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 18px 38px rgba(79, 124, 255, .24);
}

.brand-top b {
  display: block;
  color: var(--ink);
  font-size: 19px;
}

.brand-top span {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.login-card .kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  color: var(--primary-strong);
  font-weight: 700;
  font-size: 13px;
  background: rgba(255, 255, 255, .66);
  border: 1px solid rgba(79, 124, 255, .16);
}

.brand-panel h1 {
  margin: 20px 0 16px;
  color: var(--ink);
  font-size: clamp(42px, 5vw, 67px);
  line-height: 1.14;
  letter-spacing: -.03em;
}

.brand-panel p {
  max-width: 540px;
  margin: 0;
  color: var(--muted);
  line-height: 1.9;
  font-size: 16px;
}

.mini-board {
  margin-top: 36px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mini-board div {
  padding: 18px 14px;
  border: 1px solid rgba(79, 124, 255, .10);
  border-radius: 24px;
  background: rgba(255, 255, 255, .76);
  box-shadow: 0 14px 34px rgba(31, 45, 92, .08);
  text-align: center;
  transition: .22s ease;
}

.mini-board div:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 42px rgba(31, 45, 92, .12);
}

.mini-board b {
  display: block;
  margin-bottom: 8px;
  color: var(--primary-strong);
  font-size: 18px;
}

.mini-board span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}


.form-panel {
  padding: 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, .92);
}

.form-head {
  margin-bottom: 28px;
}

.form-head h2 {
  margin: 18px 0 10px;
  color: var(--ink);
  font-size: 36px;
  letter-spacing: -.045em;
}

.form-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.login-form {
  margin-top: 6px;
}

.form-extra {
  margin: -4px 0 18px;
  display: flex;
  justify-content: flex-end;
}

.form-extra a {
  color: var(--primary-strong);
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
}

.form-extra a:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  height: 46px;
  border-radius: 999px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(79, 124, 255, .22);
}

.switch-line {
  margin: 22px 0 0;
  text-align: center;
  color: var(--muted);
}

.switch-line a {
  color: var(--primary-strong);
  font-weight: 900;
  text-decoration: none;
}

.switch-line a:hover {
  text-decoration: underline;
}

@keyframes floatSlow {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(18px);
  }

  100% {
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .login-page {
    padding: 22px;
  }

  .login-card {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-panel,
  .form-panel {
    padding: 34px;
  }

  .mini-board {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 620px) {
  .login-page {
    padding: 16px;
  }

  .brand-panel,
  .form-panel {
    padding: 28px 22px;
  }

  .brand-panel h1 {
    font-size: 40px;
  }

  .form-head h2 {
    font-size: 30px;
  }

  .brand-top {
    align-items: flex-start;
  }
}
</style>
