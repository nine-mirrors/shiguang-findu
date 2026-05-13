<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserProfileApi, updateUserProfileApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const profile = ref({
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

const displayName = computed(() => {
  return profile.value.username || profile.value.email || userStore.displayName
})

const avatarText = computed(() => {
  return displayName.value.slice(0, 1)
})

const roleText = computed(() => {
  if (profile.value.role === 'admin') {
    return '管理员'
  }

  if (profile.value.role === 'staff') {
    return '工作人员'
  }

  return '学生用户'
})

const verificationText = computed(() => {
  const level = profile.value.verification_level || profile.value.verificationLevel || 'none'

  if (level === 'full') {
    return '完整认证'
  }

  if (level === 'basic') {
    return '基础认证'
  }

  return '未认证'
})

function normalizeProfile(res) {
  const data = res?.data || res || {}

  return {
    id: data.id,
    username: data.username || '',
    email: data.email || '',
    phone: data.phone || '',
    avatar: data.avatar || '',
    role: data.role || 'user',
    verification_level: data.verification_level || data.verificationLevel || 'none'
  }
}

function syncEditForm() {
  editForm.value = {
    username: profile.value.username,
    phone: profile.value.phone,
    avatar: profile.value.avatar
  }
}

function updateStoreUser(data) {
  userStore.user = {
    ...userStore.user,
    ...data
  }
}

async function loadProfile() {
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

async function saveProfile() {
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

onMounted(loadProfile)
</script>

<template>
  <div class="profile-page container">
    <section class="profile-card glass-card fade-up">
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
        <p>认证等级：{{ verificationText }}</p>
        <p>登录方式：邮箱 + 密码</p>
        <p>用户名用途：页面昵称、头像首字母、发布人展示。</p>

        <div class="panel-actions">
          <el-button type="primary" plain @click="$router.push('/verification')">查看实名认证</el-button>
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

          <el-form-item label="头像地址">
            <el-input v-model.trim="editForm.avatar" placeholder="可选，填写头像图片地址" />
          </el-form-item>

          <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
        </el-form>
      </div>
    </section>
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
  background: linear-gradient(135deg, var(--primary), var(--success));
  color: #fff;
  font-size: 42px;
  font-weight: 1000;
  box-shadow: 0 20px 45px rgba(79, 124, 255, .22);
}

.profile-card h1 {
  margin: 14px 0 6px;
  font-size: 42px;
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

.panel-actions {
  margin-top: 18px;
}

.profile-form {
  margin-top: 14px;
}

@media (max-width: 760px) {
  .profile-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-actions {
    margin-left: 0;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>