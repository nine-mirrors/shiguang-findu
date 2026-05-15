<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendEmailCodeApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)

let timer = null

const form = reactive({
  username: '',
  email: '',
  emailCode: '',
  password: '',
  password_confirmation: '',
  agreement: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 10, message: '用户名长度应为 2 到 10 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  password_confirmation: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
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
  ],
  agreement: [
    {
      validator: (_, value, callback) => {
        if (value) {
          callback()
          return
        }

        callback(new Error('请先阅读并同意平台规则与用户须知'))
      },
      trigger: 'change'
    }
  ]
}

const clearTimer = () => {
  if (!timer) return

  clearInterval(timer)
  timer = null
}

const startCountdown = () => {
  clearTimer()
  countdown.value = 60

  timer = setInterval(() => {
    countdown.value -= 1

    if (countdown.value <= 0) {
      clearTimer()
    }
  }, 1000)
}

const sendCode = async () => {
  if (countdown.value > 0 || codeLoading.value) return

  await formRef.value.validateField('email')

  codeLoading.value = true

  try {
    await sendEmailCodeApi(form.email, 'register')
    ElMessage.success('验证码已发送，请查看邮箱')
    startCountdown()
  } catch {
    ElMessage.error('发送验证码失败，请重试')
  } finally {
    codeLoading.value = false
  }
}

const submit = async () => {
  if (loading.value) return

  await formRef.value.validate()
  loading.value = true

  try {
    await userStore.register(form)
    ElMessage.success('注册成功')
    router.push('/home')
  } catch {
    // 错误已在 request 拦截器中处理
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(clearTimer)
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg-orb orb-a"></div>
    <div class="auth-bg-orb orb-b"></div>

    <section class="register-card fade-up">
      <div class="copy">
        <span class="kicker">安全注册</span>

        <h1>创建你的校园协寻账号</h1>

        <p>
          注册后可以发布失物与招领信息、提交认领申请、收藏关注物品，并通过通知中心跟踪审核结果和认领进度。
        </p>

        <div class="safe-list">
          <div>
            <b>发布需审核</b>
            <span>失物与招领信息提交后进入管理员审核，通过后再公开展示。</span>
          </div>

          <div>
            <b>信息需真实</b>
            <span>请勿发布虚假、重复、无关或侵犯他人隐私的信息。</span>
          </div>

          <div>
            <b>认领需核验</b>
            <span>认领时需要提交合理证明，平台会根据规则进行人工核验。</span>
          </div>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-box" @keyup.enter="submit">
        <div class="form-title">
          <b>注册账号</b>
          <span>请填写基本信息完成账号创建</span>
        </div>

        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="form.username" size="large" maxlength="10" show-word-limit placeholder="例如：李同学" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model.trim="form.email" size="large" placeholder="用于登录和接收通知" />
        </el-form-item>

        <el-form-item label="邮箱验证码" prop="emailCode">
          <div class="code-line">
            <el-input v-model.trim="form.emailCode" size="large" placeholder="请输入邮箱验证码" />

            <el-button size="large" :loading="codeLoading" :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password size="large" placeholder="请输入密码" />
        </el-form-item>

        <el-form-item label="确认密码" prop="password_confirmation">
          <el-input v-model="form.password_confirmation" type="password" show-password size="large" placeholder="请再次输入密码" />
        </el-form-item>

        <el-form-item prop="agreement" class="agreement-item">
          <el-checkbox v-model="form.agreement">
            我已阅读并同意
            <router-link class="agreement-link" to="/guide" target="_blank" @click.stop>
              《平台规则与用户须知》
            </router-link>
          </el-checkbox>
        </el-form-item>

        <el-button type="primary" size="large" class="full-btn" :loading="loading" @click="submit">
          注册并进入平台
        </el-button>

        <p class="switch">
          已有账号？
          <router-link to="/login">去登录</router-link>
        </p>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 32px;
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(79, 124, 255, .20), transparent 31%),
    radial-gradient(circle at 82% 78%, rgba(0, 184, 148, .16), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.auth-bg-orb {
  position: absolute;
  border-radius: 999px;
  opacity: .55;
  pointer-events: none;
}

.orb-a {
  width: 420px;
  height: 420px;
  left: -130px;
  top: -120px;
  background: rgba(79, 124, 255, .18);
}

.orb-b {
  width: 360px;
  height: 360px;
  right: -100px;
  bottom: -120px;
  background: rgba(0, 184, 148, .16);
}

.register-card {
  position: relative;
  z-index: 1;
  width: min(1040px, 100%);
  display: grid;
  grid-template-columns: .95fr 1.05fr;
  gap: 28px;
  padding: 34px;
  border: 1px solid rgba(255, 255, 255, .72);
  border-radius: 38px;
  background: rgba(255, 255, 255, .84);
  box-shadow: 0 40px 100px rgba(31, 45, 92, .16);
  backdrop-filter: blur(18px);
}

.copy {
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 30px;
  background:
    radial-gradient(circle at 20% 18%, rgba(79, 124, 255, .16), transparent 36%),
    linear-gradient(135deg, rgba(79, 124, 255, .12), rgba(0, 184, 148, .08)),
    rgba(248, 251, 255, .82);
}

.copy h1 {
  margin: 22px 0 16px;
  color: var(--ink);
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.06;
  letter-spacing: -.06em;
}

.copy p {
  margin: 0;
  color: var(--muted);
  line-height: 1.85;
}

.safe-list {
  margin-top: 28px;
  display: grid;
  gap: 12px;
}

.safe-list div {
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, .72);
  border: 1px solid rgba(79, 124, 255, .08);
}

.safe-list b {
  display: block;
  margin-bottom: 6px;
  color: var(--primary-strong);
}

.safe-list span {
  color: var(--muted);
  line-height: 1.65;
  font-size: 13px;
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
  font-size: 24px;
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

.agreement-item {
  margin-top: -4px;
}

.agreement-link {
  color: var(--primary-strong);
  font-weight: 900;
  text-decoration: none;
}

.agreement-link:hover {
  text-decoration: underline;
}

.full-btn {
  width: 100%;
  height: 46px;
  margin-top: 4px;
  border-radius: 999px;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(79, 124, 255, .22);
}

.switch {
  margin: 20px 0 0;
  text-align: center;
  color: var(--muted);
}

.switch a {
  color: var(--primary-strong);
  font-weight: 900;
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}

@media (max-width: 860px) {
  .auth-page {
    padding: 24px 16px;
  }

  .register-card {
    grid-template-columns: 1fr;
    padding: 24px;
    border-radius: 30px;
  }

  .copy,
  .form-box {
    padding: 24px;
  }

  .code-line {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .copy h1 {
    font-size: 36px;
  }

  .form-title b {
    font-size: 22px;
  }
}
</style>