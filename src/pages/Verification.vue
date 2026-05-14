<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyVerificationApi, submitVerificationApi } from '@/api/verification'
import LineIcon from '@/components/LineIcon.vue'

const current = ref({})
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  level: 'basic',
  realName: '',
  studentNo: '',
  phone: '',
  idCardLast4: ''
})

const currentLevelText = computed(() => {
  const level = current.value.level || current.value.verification_level || 'none'
  const status = current.value.status || 'none'

  if (status === 'pending') {
    return '审核中'
  }

  if (status === 'rejected') {
    return '已驳回'
  }

  if (level === 'full') {
    return '完整认证'
  }

  if (level === 'basic') {
    return '基础认证'
  }

  return '未认证'
})

const currentStatusText = computed(() => {
  const status = current.value.status || 'none'

  if (status === 'approved') {
    return '已通过'
  }

  if (status === 'pending') {
    return '审核中'
  }

  if (status === 'rejected') {
    return '已驳回'
  }

  return '未提交'
})

const statusType = computed(() => {
  const status = current.value.status || 'none'

  if (status === 'approved') {
    return 'success'
  }

  if (status === 'pending') {
    return 'warning'
  }

  if (status === 'rejected') {
    return 'danger'
  }

  return 'info'
})

const rules = {
  realName: [
    { required: true, message: '请填写真实姓名', trigger: 'blur' }
  ],
  studentNo: [
    { required: true, message: '请填写学号或工号', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' }
  ],
  idCardLast4: [
    {
      validator: (_, value, callback) => {
        if (form.level === 'full' && !value) {
          callback(new Error('完整认证请填写证件后四位'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const formRef = ref()

function normalizeVerification(res) {
  return res?.data || res || {}
}

async function loadVerification() {
  loading.value = true

  try {
    const res = await getMyVerificationApi()
    current.value = normalizeVerification(res)
  } finally {
    loading.value = false
  }
}

async function submit() {
  await formRef.value.validate()

  submitting.value = true

  try {
    await submitVerificationApi(form)
    ElMessage.success('认证申请已提交')
    await loadVerification()
  } catch (err) {
    // 错误已在 request.js 全局处理
  } finally {
    submitting.value = false
  }
}

onMounted(loadVerification)
</script>

<template>
  <div class="verify-page container">
    <section class="page-title fade-up">
      <span class="kicker">分级实名认证</span>

      <h1>基础服务轻量使用，贵重物品认领提高核验等级。</h1>

      <p>按风险分级，不让普通浏览变复杂，也保证贵重物品认领安全。</p>
    </section>

    <section class="verify-grid">
      <div class="level-card glass-card">
        <LineIcon name="user-check" tone="green" />

        <h2>基础认证</h2>

        <p>适用于普通物品认领、发布信息、收藏和站内通知。平台只展示必要状态，不公开真实身份信息。</p>

        <el-tag :type="statusType">当前：{{ currentLevelText }} · {{ currentStatusText }}</el-tag>
      </div>

      <div class="level-card glass-card strong">
        <LineIcon name="shield" tone="purple" />

        <h2>完整认证</h2>

        <p>适用于贵重物品认领、邮寄领取和争议处理，可扩展证件核验、人脸核验与人工复审。</p>

        <el-tag type="warning">第二优先级增强能力</el-tag>
      </div>

      <el-form ref="formRef" class="verify-form glass-card" label-position="top" :model="form" :rules="rules">
        <h2>提交认证申请</h2>

        <el-form-item label="认证等级" prop="level">
          <el-radio-group v-model="form.level">
            <el-radio-button label="basic">基础认证</el-radio-button>
            <el-radio-button label="full">完整认证</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model.trim="form.realName" placeholder="仅管理员可见" />
        </el-form-item>

        <el-form-item label="学号 / 工号" prop="studentNo">
          <el-input v-model.trim="form.studentNo" placeholder="前端展示时会脱敏" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model.trim="form.phone" placeholder="用于管理员审核和交接联系" />
        </el-form-item>

        <el-form-item v-if="form.level === 'full'" label="证件后四位" prop="idCardLast4">
          <el-input v-model.trim="form.idCardLast4" maxlength="4" placeholder="仅用于完整认证核验，不公开展示" />
        </el-form-item>

        <el-form-item v-if="form.level === 'full'" label="证件 / 人脸核验说明">
          <el-input type="textarea" :rows="3" model-value="比赛版不采集真实证件照片；正式上线后由后端接入实名认证服务，敏感数据加密存储并限制访问。" disabled />
        </el-form-item>

        <el-button type="primary" :loading="submitting" @click="submit">提交认证</el-button>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.verify-page {
  padding-top: 42px;
}

.page-title h1 {
  max-width: 960px;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.02;
  letter-spacing: -.06em;
  margin: 18px 0 12px;
}

.page-title p {
  color: var(--muted);
}

.verify-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 26px;
}

.level-card,
.verify-form {
  padding: 26px;
}

.level-card h2 {
  margin: 18px 0 10px;
}

.level-card p {
  color: var(--muted);
  line-height: 1.75;
}

.level-card.strong {
  background: linear-gradient(135deg, rgba(255, 255, 255, .86), rgba(108, 99, 255, .08));
}

.verify-form {
  grid-column: 1 / -1;
}

@media (max-width: 760px) {
  .verify-grid {
    grid-template-columns: 1fr;
  }
}
</style>