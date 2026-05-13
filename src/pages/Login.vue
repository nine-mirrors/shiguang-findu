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
  if (typeof route.query.redirect === 'string') return route.query.redirect

  return userStore.isAdmin ? '/admin/dashboard' : '/home'
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true

  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push(getRedirectPath())
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg-orb orb-a"></div>
    <div class="auth-bg-orb orb-b"></div>

    <section class="auth-card fade-up">
      <div class="auth-hero">
        <span class="kicker">拾光 FindU · 校园智能协寻</span>

        <h1>拾起遗失之物，找回校园微光。</h1>

        <p>“拾”是拾起遗失之物，“光”是照亮线索与善意。拾光 FindU 希望让每一条失物线索被看见，让每一次归还都有回应。</p>

        <div class="mini-board">
          <div>
            <b>拾物</b>
            <span>统一发布招领</span>
          </div>

          <div>
            <b>寻光</b>
            <span>快速匹配线索</span>
          </div>

          <div>
            <b>闭环</b>
            <span>认领审核追踪</span>
          </div>
        </div>
      </div>

      <div class="auth-form">
        <h2>欢迎回来</h2>

        <p>使用邮箱和密码登录，进入 FindU 校园失物招领平台。</p>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model.trim="form.email" size="large" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" />
          </el-form-item>

          <el-button class="full-btn" type="primary" size="large" :loading="loading" @click="submit">登录平台</el-button>
        </el-form>

        <p class="switch">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f7fbff, #eef3ff 56%, #f9fff9);
}

.auth-bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(1px);
  opacity: .55;
}

.orb-a {
  width: 420px;
  height: 420px;
  background: rgba(79, 124, 255, .18);
  left: -130px;
  top: -110px;
  animation: floatSlow 7s infinite;
}

.orb-b {
  width: 360px;
  height: 360px;
  background: rgba(0, 184, 148, .16);
  right: -100px;
  bottom: -120px;
  animation: floatSlow 8s infinite reverse;
}

.auth-card {
  width: min(1050px, 100%);
  min-height: 650px;
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  overflow: hidden;
  border-radius: 36px;
  background: rgba(255, 255, 255, .78);
  border: 1px solid rgba(255, 255, 255, .78);
  box-shadow: 0 40px 100px rgba(31, 45, 92, .18);
  backdrop-filter: blur(24px);
}

.auth-hero {
  padding: 58px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: radial-gradient(circle at 15% 16%, rgba(255, 255, 255, .75), transparent 20rem), linear-gradient(135deg, rgba(79, 124, 255, .20), rgba(108, 99, 255, .10));
}

.auth-hero h1 {
  font-size: 48px;
  line-height: 1.27;
  letter-spacing: 0;
  margin: 24px 0 18px;
}

.auth-hero p {
  color: #4b5563;
  line-height: 1.9;
  font-size: 16px;
  max-width: 520px;
}

.mini-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mini-board div {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, .62);
  border: 1px solid rgba(255, 255, 255, .75);
}

.mini-board b {
  display: block;
  font-size: 25px;
  letter-spacing: -.04em;
}

.mini-board span {
  color: var(--muted);
  font-size: 13px;
}

.auth-form {
  padding: 58px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-form h2 {
  font-size: 32px;
  margin: 0 0 8px;
}

.auth-form p {
  margin: 0 0 26px;
  color: var(--muted);
}

.full-btn {
  width: 100%;
  height: 48px;
}

.switch {
  text-align: center;
  padding: 20px;
}

.switch a {
  color: var(--primary-strong);
  font-weight: 900;
}

@media (max-width: 860px) {
  .auth-card {
    grid-template-columns: 1fr;
  }

  .auth-hero {
    padding: 36px;
  }

  .auth-hero h1 {
    font-size: 34px;
  }

  .mini-board {
    grid-template-columns: 1fr;
  }
}
</style>