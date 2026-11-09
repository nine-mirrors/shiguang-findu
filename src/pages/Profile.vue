<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sendEmailCodeApi } from '@/api/auth'
import { cancelUserAccountApi, getUserProfileApi, updateUserProfileApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { resolveImageUrl } from '@/utils/image'
import ErrorState from '@/components/ErrorState.vue'

const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)
const loadError = ref(false)
const saving = ref(false)
const cancelLoading = ref(false)
const codeLoading = ref(false)
const cancelDialog = ref(false)
const avatarBroken = ref(false)
const avatarInput = ref(null)
const avatarPreview = ref('')
const avatarUploading = ref(false)
const avatarPercent = ref(0)
const avatarDragOver = ref(false)
const avatarError = ref('')
const countdown = ref(0)
let avatarPreviewUrl = ''
let timer = null

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

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

const avatarUrl = computed(() => resolveImageUrl(profile.value.avatar))

const avatarDisplayUrl = computed(() => avatarPreview.value || avatarUrl.value)

const showAvatarImage = computed(() => Boolean(avatarPreview.value || profile.value.avatar) && !avatarBroken.value)

const avatarHint = computed(() => {
  if (avatarError.value) return avatarError.value

  return '点击或拖拽头像即可更换，支持 JPG / PNG / GIF / WebP，最大 5MB'
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

const handleAvatarError = () => {
  avatarBroken.value = true
}

const openAvatarPicker = () => {
  if (avatarUploading.value) return

  avatarInput.value?.click()
}

const resetAvatarInput = () => {
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
}

const clearAvatarPreview = () => {
  if (avatarPreviewUrl) {
    URL.revokeObjectURL(avatarPreviewUrl)
    avatarPreviewUrl = ''
  }

  avatarPreview.value = ''
}

const validateAvatarFile = file => {
  if (!file) return '请选择要上传的图片'

  if (!AVATAR_TYPES.includes(String(file.type).toLowerCase())) {
    return '仅支持 JPG / PNG / GIF / WebP 格式的图片'
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return '头像图片不能超过 5MB，请压缩后重试'
  }

  return ''
}

const uploadAvatarFile = async file => {
  if (avatarUploading.value) return

  avatarError.value = ''

  const invalidMessage = validateAvatarFile(file)

  if (invalidMessage) {
    avatarError.value = invalidMessage
    ElMessage.warning(invalidMessage)
    return
  }

  resetAvatarInput()
  clearAvatarPreview()

  avatarPreviewUrl = URL.createObjectURL(file)
  avatarPreview.value = avatarPreviewUrl
  avatarBroken.value = false
  avatarUploading.value = true
  avatarPercent.value = 0

  try {
    const result = await userStore.uploadAvatar(file, percent => {
      avatarPercent.value = percent
    })

    clearAvatarPreview()
    profile.value = { ...profile.value, avatar: result.avatar }
    editForm.value = { ...editForm.value, avatar: result.avatar }
    avatarBroken.value = false
    ElMessage.success('头像已更新')
  } catch (error) {
    clearAvatarPreview()

    const status = error.response?.status
    const data = error.response?.data || {}

    if (status === 413) {
      avatarError.value = '头像图片超过 5MB 限制，请换一张更小的图片'
    } else if (status === 422) {
      avatarError.value = data.message || '图片格式不支持，请上传 JPG / PNG / GIF / WebP'
    } else if (!status) {
      avatarError.value = '网络异常，头像未上传成功，请重试'
    } else if (status >= 500) {
      avatarError.value = '服务器异常，头像未上传成功，请稍后重试'
    } else {
      avatarError.value = data.message || '头像上传失败，请重试'
    }
  } finally {
    avatarUploading.value = false
    avatarPercent.value = 0
    resetAvatarInput()
  }
}

const onAvatarChange = event => {
  const file = event.target?.files?.[0]

  if (file) {
    uploadAvatarFile(file)
  }
}

const onAvatarDragOver = () => {
  if (avatarUploading.value) return

  avatarDragOver.value = true
}

const onAvatarDragLeave = () => {
  avatarDragOver.value = false
}

const onAvatarDrop = event => {
  avatarDragOver.value = false

  if (avatarUploading.value) return

  const file = event.dataTransfer?.files?.[0]

  if (file) {
    uploadAvatarFile(file)
  }
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
  loadError.value = false

  try {
    const res = await getUserProfileApi()
    profile.value = normalizeProfile(res)
    avatarBroken.value = false
    avatarError.value = ''
    clearAvatarPreview()
    syncEditForm()
    updateStoreUser(profile.value)
  } catch {
    loadError.value = true
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
    avatarBroken.value = false
    syncEditForm()
    updateStoreUser(profile.value)
    ElMessage.success('个人信息已更新')
  } catch {
    // 错误提示由 request.js 统一处理，保留用户已填内容以便再次保存
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
  } catch {
    // 错误提示由 request.js 统一处理
  } finally {
    codeLoading.value = false
  }
}

const openCancelDialog = async () => {
  try {
    await ElMessageBox.confirm(
      '注销账号后，该账号将无法继续登录。历史发布、认领、通知和风控记录会按平台规则保留。确定继续吗？',
      '注销账号确认',
      {
        type: 'warning',
        confirmButtonText: '继续注销',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

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
  } catch {
    return
  }

  cancelLoading.value = true

  try {
    await cancelUserAccountApi(cancelForm)
    ElMessage.success('账号已注销')
    cancelDialog.value = false
    resetCancelForm()
    userStore.clearAuth()
    router.push('/login')
  } catch {
    // 错误提示由 request.js 统一处理
  } finally {
    cancelLoading.value = false
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

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

  clearAvatarPreview()
})
</script>

<template>
  <div class="profile-page container">
    <h1 v-if="loading || loadError" class="sr-only">个人中心</h1>

    <div v-if="loading" class="profile-skeleton glass-card" aria-busy="true" aria-label="正在加载个人资料">
      <el-skeleton :rows="6" animated />
    </div>

    <ErrorState
      v-else-if="loadError"
      class="profile-error glass-card"
      title="个人资料加载失败"
      desc="暂时无法获取账号资料，请检查网络连接后重试。"
      @retry="loadProfile"
    />

    <template v-else>
      <section class="profile-card glass-card fade-up">
        <button
          type="button"
          class="avatar-big"
          :class="{ 'is-dragover': avatarDragOver, 'is-uploading': avatarUploading }"
          :aria-label="avatarUploading ? `正在上传头像，已完成 ${avatarPercent}%` : '更换头像'"
          :aria-busy="avatarUploading"
          @click="openAvatarPicker"
          @dragover.prevent="onAvatarDragOver"
          @dragleave.prevent="onAvatarDragLeave"
          @drop.prevent="onAvatarDrop"
        >
          <img v-if="showAvatarImage" :src="avatarDisplayUrl" alt="" @error="handleAvatarError" />

          <span v-else aria-hidden="true">{{ avatarText }}</span>

          <span class="avatar-overlay" aria-hidden="true">
            <template v-if="avatarUploading">上传中 {{ avatarPercent }}%</template>
            <template v-else>更换头像</template>
          </span>
        </button>

        <input
          ref="avatarInput"
          class="avatar-input"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          tabindex="-1"
          @change="onAvatarChange"
        />

        <div class="profile-intro">
          <span class="kicker">个人中心</span>

          <h1>{{ displayName }}</h1>

          <p>{{ profile.email || userStore.user?.email }}</p>

          <p class="avatar-hint" :class="{ 'is-error': avatarError }" aria-live="polite">
            {{ avatarHint }}
          </p>
        </div>

        <div class="profile-actions">
          <el-button @click="$router.push('/my-posts')">我的发布</el-button>
          <el-button type="primary" @click="$router.push('/publish')">发布信息</el-button>
        </div>
      </section>

      <section class="profile-grid">
        <div class="glass-card panel">
          <h2>账号信息</h2>

          <dl class="info-list">
            <div class="info-row">
              <dt>角色</dt>
              <dd>{{ roleText }}</dd>
            </div>

            <div class="info-row">
              <dt>认证等级</dt>
              <dd>
                <el-tag :type="verificationTagType" size="small">{{ verificationText }}</el-tag>
              </dd>
            </div>

            <div class="info-row">
              <dt>登录方式</dt>
              <dd>邮箱 + 密码</dd>
            </div>
          </dl>

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

          <el-form label-position="top" class="profile-form" @submit.prevent>
            <el-form-item label="用户名">
              <el-input v-model.trim="editForm.username" maxlength="10" placeholder="请输入用户名" />
            </el-form-item>

            <el-form-item label="手机号">
              <el-input v-model.trim="editForm.phone" placeholder="请输入手机号" />
            </el-form-item>

            <div class="form-actions">
              <el-button type="primary" :loading="saving" :disabled="saving" @click="saveProfile">保存修改</el-button>
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
    </template>

    <el-dialog v-model="cancelDialog" title="注销账号" width="min(520px, 92vw)">
      <div class="cancel-warning" role="alert">
        <b>操作前请确认</b>
        <span>账号注销后将无法继续登录。若存在待审核、待交接、认领中或限制中的业务，后端可能会拒绝注销。</span>
      </div>

      <el-form label-position="top" class="cancel-form" @submit.prevent>
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
        <el-button type="danger" :loading="cancelLoading" :disabled="cancelLoading" @click="submitCancelAccount">确认注销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.profile-page {
  padding-top: 42px;
}

.profile-skeleton,
.profile-error {
  padding: 30px;
}

.profile-card {
  padding: 34px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-big {
  position: relative;
  flex: none;
  width: 96px;
  height: 96px;
  padding: 0;
  border: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 32px;
  background: linear-gradient(135deg, var(--primary-strong), var(--primary));
  color: #fff;
  font-family: inherit;
  font-size: 42px;
  font-weight: 1000;
  box-shadow: 0 20px 45px rgba(79, 124, 255, .22);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;
}

.avatar-big:hover {
  transform: translateY(-1px);
  box-shadow: 0 24px 50px rgba(79, 124, 255, .28);
}

.avatar-big:focus-visible {
  outline: 3px solid rgba(79, 124, 255, .5);
  outline-offset: 3px;
}

.avatar-big.is-dragover {
  outline: 3px dashed rgba(79, 124, 255, .75);
  outline-offset: 3px;
}

.avatar-big.is-uploading {
  cursor: progress;
}

.avatar-big.is-uploading img {
  filter: brightness(.62);
}

.avatar-big img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 8px 0 9px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .02em;
  color: #fff;
  background: linear-gradient(180deg, transparent, rgba(8, 16, 40, .58));
  opacity: 0;
  transition: opacity .18s ease;
  pointer-events: none;
}

.avatar-big:hover .avatar-overlay,
.avatar-big:focus-visible .avatar-overlay,
.avatar-big.is-uploading .avatar-overlay {
  opacity: 1;
}

.avatar-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.profile-card .avatar-hint {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
}

.profile-card .avatar-hint.is-error {
  color: #cf3b3b;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .avatar-big,
  .avatar-overlay {
    transition: none;
  }

  .avatar-big:hover {
    transform: none;
  }
}

.profile-intro {
  min-width: 0;
}

.profile-card h1 {
  margin: 14px 0 6px;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.16;
  letter-spacing: -.03em;
  overflow-wrap: anywhere;
}

.profile-card p {
  color: var(--muted);
  margin: 0;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.profile-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.profile-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.panel {
  padding: 26px;
}

.panel h2 {
  margin: 0 0 16px;
}

.panel p {
  color: var(--muted);
  line-height: 1.8;
  margin: 0;
  overflow-wrap: anywhere;
}

.info-list {
  margin: 0;
  display: grid;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.info-row dt {
  min-width: 72px;
  color: var(--muted);
}

.info-row dd {
  margin: 0;
  color: var(--ink);
  font-weight: 700;
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
  margin-top: 0;
}

.verify-btn {
  background: linear-gradient(135deg, var(--primary-strong), var(--primary));
  border: 0;
  color: #fff;
}

.verify-btn:hover {
  background: linear-gradient(135deg, var(--primary-strong), var(--primary));
  filter: brightness(.94);
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
  min-height: 40px;
  border-radius: 999px;
  font-weight: 900;
}

@media (max-width: 960px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-card {
    padding: 28px;
  }
}

@media (max-width: 620px) {
  .profile-page {
    padding-top: 28px;
  }

  .profile-card {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
    padding: 22px;
  }

  .avatar-big {
    width: 76px;
    height: 76px;
    border-radius: 26px;
    font-size: 34px;
  }

  .profile-card h1 {
    font-size: 30px;
    line-height: 1.24;
  }

  .profile-actions {
    margin-left: 0;
    width: 100%;
    flex-wrap: wrap;
  }

  .profile-actions .el-button {
    flex: 1;
    margin-left: 0;
  }

  .panel {
    padding: 22px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
    margin-left: 0;
  }

  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
