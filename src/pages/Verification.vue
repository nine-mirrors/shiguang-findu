<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyVerificationApi, submitVerificationApi } from '@/api/verification'
import { useUserStore } from '@/stores/user'
import LineIcon from '@/components/LineIcon.vue'

const userStore = useUserStore()

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

const basicRecord = computed(() => {
  if (!current.value) return null
  if (Array.isArray(current.value)) {
    return current.value.find(v => v.level === 'basic') || null
  }
  return current.value.level === 'basic' ? current.value : null
})

const fullRecord = computed(() => {
  if (!current.value) return null
  if (Array.isArray(current.value)) {
    return current.value.find(v => v.level === 'full') || null
  }
  return current.value.level === 'full' ? current.value : null
})

const userLevel = computed(() => {
  const rec = Array.isArray(current.value) ? current.value[0] : current.value
  return rec?.verification_level || rec?.verificationLevel || 'none'
})

const getStatusText = (record) => {
  if (!record) return '未提交'
  const status = record.status || 'none'
  if (status === 'approved') return '已通过'
  if (status === 'pending') return '审核中'
  if (status === 'rejected') return '已驳回'
  return '未提交'
}

const getStatusType = (record) => {
  if (!record) return 'info'
  const status = record.status || 'none'
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'danger'
  return 'info'
}

const canSubmitBasic = computed(() => {
  const rec = basicRecord.value
  if (!rec) return true
  return rec.status !== 'pending' && rec.status !== 'approved'
})

const canSubmitFull = computed(() => {
  const rec = fullRecord.value
  if (!rec) return true
  return rec.status !== 'pending' && rec.status !== 'approved'
})

const hasAnyPending = computed(() => {
  return (basicRecord.value?.status === 'pending') || (fullRecord.value?.status === 'pending')
})

const hasAllApproved = computed(() => {
  return (basicRecord.value?.status === 'approved') && (fullRecord.value?.status === 'approved')
})

const showPendingState = computed(() => {
  const rec = form.level === 'basic' ? basicRecord.value : fullRecord.value
  return rec && rec.status === 'pending'
})

const showForm = computed(() => {
  if (hasAllApproved.value) return false
  if (showPendingState.value) return false
  return canSubmitBasic.value || canSubmitFull.value
})

const rules = {
  realName: [
    { required: true, message: '请填写真实姓名', trigger: 'blur' }
  ],
  studentNo: [
    { required: true, message: '请填写学号或工号', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (!value || /^1[3-9]\d{9}$/.test(value)) {
          callback()
        } else {
          callback(new Error('请输入有效的11位手机号'))
        }
      },
      trigger: 'blur'
    }
  ],
  idCardLast4: [
    {
      required: true,
      message: '请填写证件后四位',
      trigger: 'blur'
    },
    {
      validator: (_, value, callback) => {
        if (value && !/^\d{4}$/.test(value)) {
          callback(new Error('请输入4位数字'))
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

function resolveDefaultLevel() {
  if (canSubmitFull.value && basicRecord.value?.status === 'approved') {
    return 'full'
  }
  if (canSubmitBasic.value) {
    return 'basic'
  }
  if (canSubmitFull.value) {
    return 'full'
  }
  return 'basic'
}

async function loadVerification() {
  loading.value = true

  try {
    const res = await getMyVerificationApi()
    current.value = normalizeVerification(res)
    form.level = resolveDefaultLevel()
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (submitting.value) return

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
      <!-- 基础认证卡片 -->
      <div class="level-card glass-card">
        <LineIcon name="user-check" tone="green" />

        <h2>基础认证</h2>

        <p>适用于普通物品认领、发布信息、收藏和站内通知。平台只展示必要状态，不公开真实身份信息。</p>

        <el-tag :type="getStatusType(basicRecord)">
          {{ getStatusText(basicRecord) }}
        </el-tag>
      </div>

      <!-- 完整认证卡片 -->
      <div class="level-card glass-card strong">
        <LineIcon name="shield" tone="purple" />

        <h2>完整认证</h2>

        <p>适用于贵重物品认领、邮寄领取和争议处理，可扩展证件核验、人脸核验与人工复审。</p>

        <el-tag :type="getStatusType(fullRecord)">
          {{ getStatusText(fullRecord) }}
        </el-tag>
      </div>

      <!-- 全部已通过状态 -->
      <div v-if="hasAllApproved" class="verify-form glass-card success-state">
        <LineIcon name="check-circle" tone="success" />
        <h2>认证已完成</h2>
        <p>您已完成基础认证和完整认证，可以享受平台的全部服务。</p>
      </div>

      <!-- 审核中状态提示 -->
      <div v-else-if="showPendingState" class="verify-form glass-card pending-state">
        <LineIcon name="clock" tone="warning" />
        <h2>审核中</h2>
        <p>您已提交{{ form.level === 'basic' ? '基础' : '完整' }}认证申请，管理员正在核验中，请耐心等待。</p>
        <p class="pending-hint">审核结果将通过站内通知告知，也可稍后返回此页面查看。</p>
      </div>

      <!-- 认证表单 -->
      <el-form v-else-if="showForm" ref="formRef" class="verify-form glass-card" label-position="top" :model="form" :rules="rules">
        <h2>提交认证申请</h2>

        <el-form-item label="认证等级" prop="level">
          <div class="type-group">
            <label
              class="radio-label"
              :class="{ active: form.level === 'basic', disabled: !canSubmitBasic }"
            >
              <input
                v-model="form.level"
                type="radio"
                value="basic"
                name="level"
                :disabled="!canSubmitBasic"
              />
              <span>基础认证</span>
            </label>
            <label
              class="radio-label"
              :class="{ active: form.level === 'full', disabled: !canSubmitFull }"
            >
              <input
                v-model="form.level"
                type="radio"
                value="full"
                name="level"
                :disabled="!canSubmitFull"
              />
              <span>完整认证</span>
            </label>
          </div>
          <p v-if="!canSubmitBasic && !canSubmitFull" class="hint-text">您有认证申请正在审核中，请等待审核结果后再提交。</p>
          <p v-else-if="basicRecord?.status === 'approved'" class="hint-text">您已完成基础认证，可以继续申请完整认证。</p>
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model.trim="form.realName" placeholder="请填写真实姓名" />
        </el-form-item>

        <el-form-item label="学号 / 工号" prop="studentNo">
          <el-input v-model.trim="form.studentNo" placeholder="请填写学号或工号" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model.trim="form.phone" placeholder="请填写手机号" />
        </el-form-item>

        <el-form-item v-if="form.level === 'full'" label="证件后四位" prop="idCardLast4">
          <el-input v-model.trim="form.idCardLast4" maxlength="4" placeholder="仅用于完整认证核验，不公开展示" />
        </el-form-item>

        <el-form-item v-if="form.level === 'full'" label="证件 / 人脸核验说明">
          <el-input type="textarea" :rows="3" model-value="比赛版不采集真实证件照片；正式上线后由后端接入实名认证服务，敏感数据加密存储并限制访问。" disabled />
        </el-form-item>

        <el-button type="primary" :loading="submitting" @click="submit">提交认证</el-button>
      </el-form>

      <!-- 无可用认证等级 -->
      <div v-else class="verify-form glass-card pending-state">
        <LineIcon name="clock" tone="warning" />
        <h2>暂不可提交</h2>
        <p>您当前没有可提交的认证等级，请等待审核结果后再试。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.verify-page {
  padding-top: 42px;
}

.page-title h1 {
  max-width: 960px;
  font-size: clamp(32px, 4vw, 48px);
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

.pending-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 48px 26px;
}

.pending-state h2,
.success-state h2 {
  margin: 8px 0 4px;
  color: var(--ink);
}

.pending-state p,
.success-state p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  max-width: 420px;
}

.pending-state .pending-hint {
  font-size: 13px;
  color: #8b95a7;
}

.success-state {
  background: linear-gradient(135deg, rgba(236, 253, 245, .9), rgba(255, 255, 255, .86));
  border: 1.5px solid rgba(16, 185, 129, .2);
}

.type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .72);
  border: 1.5px solid rgba(17, 24, 39, .08);
  cursor: pointer;
  transition: all .2s ease;
  font-size: 14px;
  color: var(--text);
}

.radio-label:hover {
  border-color: rgba(79, 124, 255, .35);
  background: rgba(79, 124, 255, .06);
}

.radio-label.active {
  border-color: var(--primary-strong);
  background: rgba(79, 124, 255, .10);
  color: var(--primary-strong);
  font-weight: 600;
}

.radio-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-strong);
  cursor: pointer;
  margin: 0;
}

.radio-label.disabled input[type="radio"] {
  cursor: not-allowed;
}

.hint-text {
  margin: 8px 0 0;
  font-size: 13px;
  color: #8b95a7;
}

@media (max-width: 760px) {
  .verify-grid {
    grid-template-columns: 1fr;
  }
}
</style>
