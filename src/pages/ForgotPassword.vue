<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendEmailCodeApi, forgotPasswordApi } from '@/api/auth'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)

let timer = null

const form = reactive({
  email: '',
  emailCode: '',
  password: '',
  password_confirmation: ''
})

const rules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  password_confirmation: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value === form.password) {
          callback()
          return
        }

        callback(new Error('两次密码不一致'))
      },
      trigger: 'blur'
    }
  ]
}

const startCountdown = () => {
  countdown.value = 60

  timer = setInterval(() => {
    countdown.value -= 1

    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const sendCode = async () => {
  if (countdown.value > 0 || codeLoading.value) return

  codeLoading.value = true

  try {
    await formRef.value.validateField('email')
  } catch {
    codeLoading.value = false
    return
  }

  try {
    await sendEmailCodeApi(form.email, 'forgot_password')
    ElMessage.success('验证码已发送，请查看邮箱')
    startCountdown()
  } finally {
    codeLoading.value = false
  }
}

const submit = async () => {
  if (loading.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    await forgotPasswordApi(form)
    ElMessage.success('密码重置成功，请重新登录')
    router.push('/login')
  } catch {
    // 错误提示已在 request.js 拦截器中统一处理
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="forgot-page">
    <section class="forgot-card fade-up">
      <div class="brand-panel">
        <span class="kicker">找回密码</span>

        <h1>重置你的 FindU 登录密码</h1>

        <p>
          通过注册邮箱接收验证码，完成身份校验后设置新密码。重置成功后，建议重新登录并确认账号资料是否正常。
        </p>

        <div class="safe-box">
          <b>安全说明</b>

          <ul>
            <li>验证码仅用于找回密码，不会公开展示。</li>
            <li>新密码设置成功后，请使用新密码重新登录。</li>
            <li>如果邮箱无法接收验证码，请联系管理员核验账号。</li>
          </ul>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-box">
        <div class="form-title">
          <b>密码重置</b>
          <span>请填写注册邮箱并完成验证码校验</span>
        </div>

        <el-form-item label="注册邮箱" prop="email">
          <el-input
            v-model.trim="form.email"
            size="large"
            placeholder="请输入注册时使用的邮箱"
          />
        </el-form-item>

        <el-form-item label="邮箱验证码" prop="emailCode">
          <div class="code-line">
            <el-input
              v-model.trim="form.emailCode"
              size="large"
              placeholder="请输入验证码"
            />

            <el-button
              size="large"
              :loading="codeLoading"
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            size="large"
            placeholder="请输入新密码"
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="password_confirmation">
          <el-input
            v-model="form.password_confirmation"
            type="password"
            show-password
            size="large"
            placeholder="请再次输入新密码"
          />
        </el-form-item>

        <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
          重置密码
        </el-button>

        <button type="button" class="back-login" @click="goLogin">
          想起密码了？返回登录
        </button>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.forgot-page {
  min-height: 100vh;
  padding: 40px 20px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(79, 124, 255, .20), transparent 31%),
    radial-gradient(circle at 82% 78%, rgba(0, 184, 148, .16), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.forgot-card {
  width: min(980px, 100%);
  padding: 34px;
  display: grid;
  grid-template-columns: .95fr 1fr;
  gap: 30px;
  align-items: stretch;
  border: 1px solid rgba(255, 255, 255, .72);
  border-radius: 38px;
  background: rgba(255, 255, 255, .84);
  box-shadow: 0 28px 80px rgba(31, 45, 92, .16);
  backdrop-filter: blur(18px);
}

.brand-panel {
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(79, 124, 255, .12), rgba(0, 184, 148, .08)),
    rgba(248, 251, 255, .82);
}

.brand-panel h1 {
  margin: 18px 0 14px;
  color: var(--ink);
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1.06;
  letter-spacing: normal;
  text-align: center;
  opacity: 0.77;
}

.brand-panel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.85;
}

.safe-box {
  margin-top: 28px;
  padding: 20px;
  border: 1px solid rgba(79, 124, 255, .10);
  border-radius: 24px;
  background: rgba(255, 255, 255, .72);
}

.safe-box b {
  display: block;
  margin-bottom: 10px;
  color: var(--ink);
}

.safe-box ul {
  margin: 0;
  padding-left: 20px;
}

.safe-box li {
  color: var(--muted);
  line-height: 1.8;
}

.form-box {
  padding: 28px;
  border-radius: 30px;
  background: rgba(255, 255, 255, .90);
  box-shadow: 0 20px 50px rgba(31, 45, 92, .10);
}

.form-title {
  margin-bottom: 20px;
}

.form-title b {
  display: block;
  color: var(--ink);
  font-size: 22px;
}

.form-title span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 14px;
}

.code-line {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 10px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  border-radius: 999px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(79, 124, 255, .22);
}

.back-login {
  width: 100%;
  margin-top: 18px;
  border: 0;
  background: transparent;
  color: var(--primary-strong);
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 820px) {
  .forgot-page {
    padding: 24px 16px;
  }

  .forgot-card {
    grid-template-columns: 1fr;
    padding: 24px;
    border-radius: 30px;
  }

  .brand-panel {
    padding: 22px;
  }

  .form-box {
    padding: 22px;
  }

  .code-line {
    grid-template-columns: 1fr;
  }
}
</style>
