<template>
  <div class="auth-page">
    <section class="register-card fade-up">
      <div class="copy">
        <span class="kicker">安全注册</span>
        <h1>创建你的校园协寻账号</h1>
        <p>注册字段严格对齐需求文档：用户名、邮箱、验证码、密码、确认密码。演示版验证码为 123456，后续可直接接入 Laravel 邮件通知。</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-box">
        <el-form-item label="用户名" prop="username"><el-input v-model.trim="form.username" size="large" placeholder="例如：李同学" /></el-form-item>
        <el-form-item label="邮箱" prop="email"><el-input v-model.trim="form.email" size="large" placeholder="用于登录和找回密码" /></el-form-item>
        <el-form-item label="邮箱验证码" prop="emailCode"><div class="code-line"><el-input v-model.trim="form.emailCode" size="large" placeholder="演示版：123456" /><el-button size="large" :loading="codeLoading" @click="sendCode">发送验证码</el-button></div></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" show-password size="large" /></el-form-item>
        <el-form-item label="确认密码" prop="password_confirmation"><el-input v-model="form.password_confirmation" type="password" show-password size="large" /></el-form-item>
        <el-button type="primary" size="large" class="full-btn" :loading="loading" @click="submit">注册并进入平台</el-button>
        <p class="switch">已有账号？<router-link to="/login">去登录</router-link></p>
      </el-form>
    </section>
  </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendEmailCode } from '@/api/lostFound'
import { useUserStore } from '@/stores/user'
const router = useRouter(); const userStore = useUserStore(); const formRef = ref(); const loading = ref(false)
const codeLoading = ref(false)
const form = reactive({ username: '', email: '', emailCode: '', password: '', password_confirmation: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 2, max: 20, message: '用户名长度应为 2 到 20 个字符', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  emailCode: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  password_confirmation: [{ validator: (_, value, cb) => value === form.password ? cb() : cb(new Error('两次密码不一致')), trigger: 'blur' }]
}
async function sendCode(){
  if (!form.email) { ElMessage.warning('请先填写邮箱'); return }
  codeLoading.value = true
  try {
    await sendEmailCode(form.email, 'register')
    form.emailCode = '123456'
    ElMessage.success('验证码已发送（演示版已自动填入）')
  } finally {
    codeLoading.value = false
  }
}
async function submit(){
  await formRef.value.validate(); loading.value = true
  try { await userStore.register(form); ElMessage.success('注册成功'); router.push('/home') }
  catch(e){ ElMessage.error(e.message || '注册失败') }
  finally { loading.value = false }
}
</script>
<style scoped>
.auth-page { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: radial-gradient(circle at 20% 10%, rgba(79,124,255,.18), transparent 28rem), linear-gradient(135deg,#f8fbff,#eff4ff); }
.register-card { width: min(980px,100%); display: grid; grid-template-columns: .9fr 1.1fr; gap: 24px; padding: 30px; border-radius: 36px; background: rgba(255,255,255,.82); box-shadow: 0 40px 100px rgba(31,45,92,.16); }
.copy { padding: 36px; border-radius: 28px; background: linear-gradient(135deg, rgba(79,124,255,.15), rgba(0,184,148,.10)); }
h1 { margin: 24px 0 16px; font-size: 42px; line-height: 1.12; letter-spacing: -.05em; }.copy p { color: var(--muted); line-height: 1.9; }
.form-box { padding: 18px; }.code-line { width: 100%; display: grid; grid-template-columns: 1fr 126px; gap: 10px; }.full-btn { width: 100%; height: 48px; }.switch { text-align: center; color: var(--muted); }.switch a { color: var(--primary-strong); font-weight: 900; }
@media(max-width:820px){.register-card{grid-template-columns:1fr}.copy{padding:28px}h1{font-size:32px}}
</style>
