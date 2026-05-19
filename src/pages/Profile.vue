<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sendEmailCodeApi } from '@/api/auth'
import { cancelUserAccountApi, getUserProfileApi, updateUserProfileApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const cancelLoading = ref(false)
const codeLoading = ref(false)
const cancelDialog = ref(false)
const countdown = ref(0)
let timer = null

const profile = ref({
  id: '',
  username: '',
  email: '',
  phone: '',
  avatar: '',
  role: '',
  verification_level: ''
})

const editForm = ref({
  username: '',
  phone: '',
  avatar: ''
})

const cancelForm = reactive({
  password: '',
  emailCode: '',
  reason: ''
})

const displayName = computed(() => {
  return profile.value.username || profile.value.email || userStore.displayName
})

const avatarText = computed(() => {
  return displayName.value.slice(0, 1)
})

const roleText = computed(() => {
  if (profile.value.role === 'admin') return '管理员'

  return '学生用户'
})

const verificationLevel = computed(() => {
  return profile.value.verification_level || profile.value.verificationLevel || 'none'
})

const verificationText = computed(() => {
  if (verificationLevel.value === 'full') return '完整认证'
  if (verificationLevel.value === 'basic') return '基础认证'

  return '未认证'
})

const verificationTagType = computed(() => {
  if (verificationLevel.value === 'full') return 'success'
  if (verificationLevel.value === 'basic') return 'warning'

  return 'info'
})

const canSendCode = computed(() => {
  return Boolean(profile.value.email) && countdown.value === 0 && !codeLoading.value
})

const normalizeProfile = res => {
  const data = res?.data || res || {}

  return {
    id: data.id,
    username: data.username || data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    avatar: data.avatar || '',
    role: data.role || 'student',
    verification_level: data.verification_level || data.verificationLevel || 'none'
  }
}

const syncEditForm = () => {
  editForm.value = {
    username: profile.value.username,
    phone: profile.value.phone,
    avatar: profile.value.avatar
  }
}

const updateStoreUser = data => {
  userStore.setUser({
    ...userStore.user,
    ...data
  })
}

const startCountdown = () => {
  countdown.value = 60

  if (timer) {
    clearInterval(timer)
  }

  timer = setInterval(() => {
    countdown.value -= 1

    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const resetCancelForm = () => {
  cancelForm.password = ''
  cancelForm.emailCode = ''
  cancelForm.reason = ''
}

const loadProfile = async () => {
  loading.value = true

  try {
    const res = await getUserProfileApi()
    profile.value = normalizeProfile(res)
    syncEditForm()
    updateStoreUser(profile.value)
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  if (saving.value) return

  if (!editForm.value.username || editForm.value.username.length < 2 || editForm.value.username.length > 10) {
    ElMessage.warning('用户名长度应为 2-10 个字符')
    return
  }

  saving.value = true

  try {
    const res = await updateUserProfileApi(editForm.value)
    profile.value = normalizeProfile(res)
    syncEditForm()
    updateStoreUser(profile.value)
    ElMessage.success('个人信息已更新')
  } finally {
    saving.value = false
  }
}

const sendCancelCode = async () => {
  if (codeLoading.value || countdown.value > 0) return

  if (!profile.value.email) {
    ElMessage.warning('当前账号邮箱不存在，无法发送验证码')
    return
  }

  codeLoading.value = true

  try {
    await sendEmailCodeApi(profile.value.email, 'cancel_account')
    ElMessage.success('注销验证码已发送至当前账号邮箱')
    startCountdown()
  } finally {
    codeLoading.value = false
  }
}

const openCancelDialog = async () => {
  await ElMessageBox.confirm(
    '注销账号后，该账号将无法继续登录。历史发布、认领、通知和风控记录会按平台规则保留。确定继续吗？',
    '注销账号确认',
    {
      type: 'warning',
      confirmButtonText: '继续注销',
      cancelButtonText: '取消'
    }
  )

  resetCancelForm()
  cancelDialog.value = true
}

const submitCancelAccount = async () => {
  if (cancelLoading.value) return

  if (!cancelForm.password) {
    ElMessage.warning('请输入当前登录密码')
    return
  }

  if (!cancelForm.emailCode) {
    ElMessage.warning('请输入邮箱验证码')
    return
  }

  cancelLoading.value = true

  try {
    await ElMessageBox.confirm(
      '请再次确认是否注销当前账号。注销成功后会退出登录。',
      '最终确认',
      {
        type: 'error',
        confirmButtonText: '确认注销',
        cancelButtonText: '取消'
      }
    )

    await cancelUserAccountApi(cancelForm)
    ElMessage.success('账号已注销')
    cancelDialog.value = false
    resetCancelForm()
    userStore.clearAuth()
    router.push('/login')
  } finally {
    cancelLoading.value = false
  }
}

const handleLogout = async () => {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

onMounted(loadProfile)

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="profile-page container">
    <section class="profile-card glass-card fade-up" v-loading="loading">
      <div class="avatar-big">{{ avatarText }}</div>

      <div>
        <span class="kicker">个人中心</span>

        <h1>{{ displayName }}</h1>

        <p>{{ profile.email || userStore.user?.email }}</p>
      </div>

      <div class="profile-actions">
        <el-button @click="$router.push('/my-posts')">我的发布</el-button>
        <el-button type="primary" @click="$router.push('/publish')">发布信息</el-button>
      </div>
    </section>

    <section class="profile-grid">
      <div class="glass-card panel">
        <h2>账号信息</h2>

        <p>角色：{{ roleText }}</p>

        <p>
          认证等级：
          <el-tag :type="verificationTagType" size="small">{{ verificationText }}</el-tag>
        </p>

        <p>登录方式：邮箱 + 密码</p>

        <div class="panel-actions">
  <el-button
    v-if="profile.role !== 'admin'"
    class="verify-btn"
    @click="$router.push('/verification')"
  >
    查看实名认证
  </el-button>

  <el-button
    v-else
    class="verify-btn"
    @click="$router.push('/admin/verifications')"
  >
    认证审核
  </el-button>
</div>
      </div>

      <div class="glass-card panel">
        <h2>资料编辑</h2>

        <el-form label-position="top" class="profile-form">
          <el-form-item label="用户名">
            <el-input v-model.trim="editForm.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="手机号">
            <el-input v-model.trim="editForm.phone" placeholder="请输入手机号" />
          </el-form-item>

          <div class="form-actions">
            <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
            <el-button plain @click="handleLogout">退出登录</el-button>
          </div>
        </el-form>
      </div>

      <div class="glass-card panel danger-panel">
        <h2>账号安全</h2>

        <p>
          如需注销账号，需要验证当前登录密码和邮箱验证码。注销后账号将无法继续登录，历史业务记录会按平台规则保留。
        </p>

        <div class="panel-actions">
          <el-button type="danger" plain @click="openCancelDialog">注销账号</el-button>
        </div>
      </div>
    </section>

    <el-dialog v-model="cancelDialog" title="注销账号" width="520px">
      <div class="cancel-warning">
        <b>操作前请确认</b>
        <span>账号注销后将无法继续登录。若存在待审核、待交接、认领中或限制中的业务，后端可能会拒绝注销。</span>
      </div>

      <el-form label-position="top" class="cancel-form">
        <el-form-item label="当前登录密码">
          <el-input
            v-model="cancelForm.password"
            type="password"
            show-password
            placeholder="请输入当前登录密码"
          />
        </el-form-item>

        <el-form-item label="邮箱验证码">
          <div class="code-row">
            <el-input v-model.trim="cancelForm.emailCode" placeholder="请输入验证码" />

            <el-button :disabled="!canSendCode" :loading="codeLoading" @click="sendCancelCode">
              {{ countdown ? `${countdown}s 后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="注销原因，可选">
          <el-input
            v-model.trim="cancelForm.reason"
            type="textarea"
            :rows="3"
            maxlength="120"
            show-word-limit
            placeholder="可填写不再使用、账号重复、信息错误等原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelDialog = false">取消</el-button>
        <el-button type="danger" :loading="cancelLoading" @click="submitCancelAccount">确认注销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.profile-page {
  padding-top: 42px;
}

.profile-card {
  padding: 34px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-big {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  border-radius: 32px;
  background: linear-gradient(135deg, #315fff, #4f7cff);
  color: #fff;
  font-size: 42px;
  font-weight: 1000;
  box-shadow: 0 20px 45px rgba(79, 124, 255, .22);
}

.profile-card h1 {
  margin: 14px 0 6px;
  font-size: clamp(32px, 4vw, 48px);
  letter-spacing: -.05em;
}

.profile-card p {
  color: var(--muted);
  margin: 0;
}

.profile-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.profile-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  padding: 26px;
}

.panel p {
  color: var(--muted);
  line-height: 1.8;
}

.danger-panel {
  grid-column: 1 / -1;
  border: 1px solid rgba(244, 63, 94, .16);
  background:
    linear-gradient(135deg, rgba(244, 63, 94, .06), rgba(255, 255, 255, .86));
}

.panel-actions {
  margin-top: 18px;
}

.profile-form {
  margin-top: 14px;
}

.verify-btn {
  background: linear-gradient(135deg, #315fff, #4f7cff);
  border: 0;
  color: #fff;
}

.verify-btn:hover {
  background: linear-gradient(135deg, #1e4af5, #3d6aff);
  color: #fff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.cancel-warning {
  margin-bottom: 18px;
  padding: 14px 16px;
  display: grid;
  gap: 5px;
  border-radius: 18px;
  background: rgba(244, 63, 94, .08);
  color: #be123c;
  line-height: 1.7;
}

.cancel-warning b {
  font-size: 15px;
}

.cancel-warning span {
  font-size: 13px;
}

.cancel-form {
  margin-top: 8px;
}

.code-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 10px;
}

:deep(.el-dialog__footer .el-button) {
  min-width: 92px;
  height: 38px;
  border-radius: 999px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .profile-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-actions {
    margin-left: 0;
    flex-wrap: wrap;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
