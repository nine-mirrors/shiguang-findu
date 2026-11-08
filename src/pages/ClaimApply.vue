<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getItemDetailApi } from '@/api/item'
import { createClaimApi, uploadClaimProofsApi } from '@/api/claim'
import { formatDateTime } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import { takeClaimProofFiles } from '@/utils/claimDraft'
import { storage } from '@/utils/storage'
import PhotoUploader from '@/components/PhotoUploader.vue'
import LineIcon from '@/components/LineIcon.vue'
import AppLoading from '@/components/AppLoading.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import { ElImageViewer } from 'element-plus'

const route = useRoute()
const router = useRouter()

const pageLoading = ref(true)
const loadError = ref(false)
const blockedReason = ref('')
const uploadPercent = ref(0)
const item = ref(null)
const formRef = ref()
const loading = ref(false)
const imageViewerVisible = ref(false)
const imageViewerIndex = ref(0)

const form = reactive({
  itemId: route.params.id,
  claimType: 'claim',
  proofText: '',
  proofImages: [],
  proofFiles: [],
  pickupMethod: 'offline',
  deliveryAddress: '',
  phone: '',
  remark: '',
  agree: false
})

const itemType = computed(() => item.value?.type || 'found')

const isFoundItem = computed(() => itemType.value === 'found')

const availableClaimTypes = computed(() => {
  const types = [
    { label: '我要认领', value: 'claim' },
    { label: '我有线索', value: 'clue' }
  ]

  if (route.query.type === 'wrong_return') {
    types.push({ label: '领错归还', value: 'wrong_return' })
  }

  return types
})

const getFullImageUrl = url => resolveImageUrl(url)

const itemImage = computed(() => {
  let url = ''

  if (item.value?.image) {
    url = item.value.image
  } else if (item.value?.image_url) {
    url = item.value.image_url
  } else if (Array.isArray(item.value?.images) && item.value.images.length) {
    const firstImage = item.value.images[0]

    url = typeof firstImage === 'string'
      ? firstImage
      : firstImage.image_url || firstImage.url || firstImage.path || ''
  }

  return getFullImageUrl(url)
})

const itemImages = computed(() => {
  if (!item.value) return []

  if (Array.isArray(item.value.images) && item.value.images.length) {
    return item.value.images.map(img => {
      if (typeof img === 'string') return getFullImageUrl(img)
      return getFullImageUrl(img.image_url || img.url || img.path || '')
    }).filter(Boolean)
  }

  const singleUrl = item.value.image || item.value.image_url || ''
  return singleUrl ? [getFullImageUrl(singleUrl)] : []
})

const itemTime = computed(() => {
  const raw = item.value?.happenTime || item.value?.happen_time || item.value?.created_at || ''
  return formatDateTime(raw)
})

const itemCategory = computed(() => {
  if (typeof item.value?.category === 'string') return item.value.category
  if (item.value?.category?.name) return item.value.category.name

  return item.value?.category_name || '其他'
})

const storageText = computed(() => {
  return item.value?.storageCode || item.value?.storage_code || '待审核归档'
})

const heroTitle = computed(() => {
  if (form.claimType === 'wrong_return') return '提交领错归还说明'
  if (form.claimType === 'clue') return '提交线索说明'

  return '提交认领申请'
})

const heroDesc = computed(() => {
  if (form.claimType === 'wrong_return') {
    return '如果领取后发现物品并非本人遗失物，请说明情况并联系管理员处理，避免物品流转错误。'
  }

  if (form.claimType === 'clue') {
    return '如果你掌握该物品的线索，可以提交地点、时间或补充说明，帮助管理员和发布人进一步核验。'
  }

  return '请填写只有真正失主更可能知道的细节。线下领取需凭学生证或校园身份凭证核验；选择邮寄时，也必须先完成身份和物品归属核验。'
})

const proofPlaceholder = computed(() => {
  if (form.claimType === 'wrong_return') {
    return '请说明领取时间、发现错误的原因、当前物品状态，以及你准备如何交回处理。'
  }

  if (form.claimType === 'clue') {
    return '请说明你掌握的线索，例如看到物品的位置、时间、相关场景或可能的保管地点。'
  }

  return '例如：物品特殊划痕、贴纸、校园卡姓名、U盘文件夹名称、购买记录、丢失时间和座位等。'
})

const submitText = computed(() => {
  if (form.claimType === 'wrong_return') return '提交归还说明'
  if (form.claimType === 'clue') return '提交线索'

  return '提交认领申请'
})

const rules = {
  claimType: [
    { required: true, message: '请选择申请类型', trigger: 'change' }
  ],
  proofText: [
    { required: true, message: '请填写证明或说明内容', trigger: 'blur' },
    { min: 12, message: '说明内容至少 12 个字', trigger: 'blur' }
  ],
  pickupMethod: [
    { required: true, message: '请选择领取方式', trigger: 'change' }
  ],
  deliveryAddress: [
    {
      validator: (_, value, callback) => {
        if (form.pickupMethod === 'delivery' && !value) {
          callback(new Error('选择邮寄时请填写收件地址'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '请填写联系电话', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (!value) {
          callback()
          return
        }
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(value)) {
          callback(new Error('请输入有效的11位手机号码'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const normalizeItem = res => {
  const payload = res?.data || res

  return payload?.item || payload
}

const loadItem = async () => {
  pageLoading.value = true
  loadError.value = false
  blockedReason.value = ''

  try {
    const res = await getItemDetailApi(route.params.id)

    item.value = normalizeItem(res)

    if (!item.value) {
      return
    }

    // 检查物品是否可认领
    const status = item.value.status
    if (status === 'completed' || status === 'done' || status === 'closed') {
      blockedReason.value = '该物品已处理完毕，不再接受新的认领或线索申请。'
      return
    }
    if (status === 'claiming') {
      blockedReason.value = '该物品正在认领处理中，请等待管理员核验完成后再提交。'
      return
    }

    if (route.query.type === 'wrong_return') {
      form.claimType = 'wrong_return'
    } else {
      form.claimType = itemType.value === 'found' ? 'claim' : 'clue'
    }

    if (route.query.proofText) {
      form.proofText = route.query.proofText
    }
    if (route.query.proofImages) {
      try {
        const images = JSON.parse(route.query.proofImages)
        if (Array.isArray(images)) {
          form.proofImages = images
        }
      } catch {
        // ignore parse error
      }
    }
  } catch {
    loadError.value = true
  } finally {
    pageLoading.value = false
  }
}

const submit = async () => {
  if (loading.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!form.agree) {
    ElMessage.warning('请先阅读并同意用户须知与平台规则')
    return
  }

  if (form.claimType === 'wrong_return') {
    const confirmed = await ElMessageBox.confirm(
      '领错归还会记录到操作日志并通知管理员，请确认已核对物品与本人信息。',
      '确认提交归还说明',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '再检查一下',
        type: 'warning'
      }
    )
      .then(() => true)
      .catch(() => false)

    if (!confirmed) return
  }

  loading.value = true

  try {
    // 凭证图片先落盘，再把服务端地址写进申请；否则提交的 blob: 地址会失效
    const proofFiles = (form.proofFiles || []).filter(file => file instanceof File)

    if (proofFiles.length) {
      uploadPercent.value = 1

      try {
        const uploadRes = await uploadClaimProofsApi(proofFiles, {
          onUploadProgress: event => {
            if (!event.total) return
            uploadPercent.value = Math.min(99, Math.round((event.loaded / event.total) * 100))
          }
        })
        const payload = uploadRes?.data || uploadRes
        const uploaded = Array.isArray(payload?.images) ? payload.images : []

        form.proofImages = [
          ...form.proofImages.filter(url => !String(url).startsWith('blob:')),
          ...uploaded
        ]
        form.proofFiles = []
        uploadPercent.value = 100
      } catch {
        uploadPercent.value = 0
        ElMessage.error('凭证图片上传失败，请重试或先移除图片后再提交')
        return
      }
    }

    await createClaimApi(form)
    ElMessage.success('申请已提交，等待管理员核验')
    router.push('/my-posts?tab=claims')
  } catch {
    // 错误提示已在 request.js 拦截器中统一处理
  } finally {
    loading.value = false
    setTimeout(() => {
      uploadPercent.value = 0
    }, 800)
  }
}

watch(
  () => form.claimType,
  value => {
    if (value === 'clue' || value === 'wrong_return') {
      form.pickupMethod = 'offline'
      form.deliveryAddress = ''
    }
  }
)

onMounted(() => {
  // 详情页「认领比对」里选好的图片，通过会话缓存带过来，避免重新选图
  const pendingFiles = takeClaimProofFiles()

  if (pendingFiles.length) {
    form.proofFiles = pendingFiles
    form.proofImages = pendingFiles.map(file => URL.createObjectURL(file))
  }

  loadItem()
})
</script>

<template>
  <AppLoading :visible="pageLoading" text="加载物品信息..." />

  <ErrorState
    v-if="!pageLoading && loadError"
    class="container"
    title="物品信息加载失败"
    desc="网络异常或该信息已被移除，请稍后重试。"
    @retry="loadItem"
  />

  <EmptyState
    v-else-if="!pageLoading && !item && !blockedReason"
    class="container"
    title="未找到该物品"
    desc="链接可能已失效，或该信息已被下架。"
    button-text="浏览失物大厅"
    @action="router.push('/items')"
  />

  <section v-else-if="blockedReason" class="claim-blocked container">
    <div class="glass-card blocked-card" role="status">
      <h1>暂时无法提交申请</h1>
      <p>{{ blockedReason }}</p>
      <div class="blocked-actions">
        <el-button v-if="item" type="primary" @click="router.push(`/items/${item.id}`)">返回物品详情</el-button>
        <el-button @click="router.push('/items')">浏览其他信息</el-button>
      </div>
    </div>
  </section>

  <div v-else-if="item" class="claim-apply-page container">
    <section class="claim-hero fade-up">
      <div>
        <span class="kicker">认领与线索处理</span>

        <h1>{{ heroTitle }}</h1>

        <p>{{ heroDesc }}</p>
      </div>
    </section>

    <section class="claim-grid">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="claim-form glass-card">
        <div class="form-section-title">
          <LineIcon name="user-check" tone="blue" />

          <div>
            <h2>核验信息</h2>
            <p>请填写真实、具体、可核验的信息，减少冒领、误领和重复处理。</p>
          </div>
        </div>

        <el-form-item label="申请类型" prop="claimType">
          <div class="type-group">
            <label
              v-for="type in availableClaimTypes"
              :key="type.value"
              class="radio-label"
              :class="{ active: form.claimType === type.value }"
            >
              <input
                v-model="form.claimType"
                type="radio"
                :value="type.value"
                name="claimType"
              />
              <span>{{ type.label }}</span>
            </label>
          </div>
        </el-form-item>

        <el-form-item label="证明或说明内容" prop="proofText">
          <el-input
            v-model.trim="form.proofText"
            type="textarea"
            :rows="5"
            maxlength="240"
            show-word-limit
            :placeholder="proofPlaceholder"
          />
        </el-form-item>

        <el-form-item label="辅助照片，可选">
          <PhotoUploader
            v-model="form.proofImages"
            v-model:file="form.proofFiles"
            title="上传辅助照片"
            desc="可上传购买记录、同款照片、物品细节、现场线索或归还说明照片"
          />
        </el-form-item>

        <div v-if="form.claimType === 'claim'" class="form-section-title">
          <LineIcon name="route" tone="green" />

          <div>
            <h2>领取方式</h2>
            <p>线下领取需出示学生证、校园卡或其他校园身份凭证；邮寄处理需先完成身份与物品归属核验。</p>
          </div>
        </div>

        <el-form-item v-if="form.claimType === 'claim'" label="领取方式" prop="pickupMethod">
          <div class="type-group">
            <label
              class="radio-label"
              :class="{ active: form.pickupMethod === 'offline' }"
            >
              <input
                v-model="form.pickupMethod"
                type="radio"
                value="offline"
                name="pickupMethod"
              />
              <span>线下领取</span>
            </label>
            <label
              class="radio-label"
              :class="{ active: form.pickupMethod === 'delivery' }"
            >
              <input
                v-model="form.pickupMethod"
                type="radio"
                value="delivery"
                name="pickupMethod"
              />
              <span>邮寄到付 / 协商邮寄</span>
            </label>
          </div>
        </el-form-item>

        <div v-if="form.claimType === 'claim'" class="identity-note">
          <b>身份核验要求</b>
          <span>
            线下领取时需出示学生证、校园卡或其他校园身份凭证；选择邮寄时，管理员会先核验注册邮箱、认领联系电话、校园身份信息和物品归属证明，确认无误后再处理邮寄。
          </span>
        </div>

        <el-form-item v-if="form.claimType === 'claim' && form.pickupMethod === 'delivery'" label="收件地址" prop="deliveryAddress">
          <el-input v-model.trim="form.deliveryAddress" placeholder="核验通过后用于邮寄处理，不公开展示" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model.trim="form.phone" placeholder="用于管理员核验和后续联系，不在公开页面展示" />
        </el-form-item>

        <el-form-item label="备注，可选">
          <el-input
            v-model.trim="form.remark"
            type="textarea"
            :rows="3"
            maxlength="120"
            show-word-limit
            placeholder="可补充可联系时间、交接说明或其他情况"
          />
        </el-form-item>

        <el-checkbox v-model="form.agree" class="agree-line">
          我已阅读并同意
          <router-link to="/guide" target="_blank" @click.stop>《用户须知与平台规则》</router-link>
          ，确认所填信息真实有效。
        </el-checkbox>

        <div v-if="uploadPercent" class="upload-progress" role="status" aria-live="polite">
          <div class="upload-bar"><i :style="{ width: `${uploadPercent}%` }" /></div>
          <span>{{ uploadPercent >= 100 ? '凭证上传完成' : `凭证上传中 ${uploadPercent}%` }}</span>
        </div>

        <div class="form-actions">
          <el-button @click="$router.back()">返回</el-button>
          <el-button type="primary" :loading="loading" :disabled="!form.agree" @click="submit">
            {{ submitText }}
          </el-button>
        </div>
      </el-form>

      <aside class="side-stack">
        <div class="glass-card policy-card">
          <LineIcon name="shield" tone="purple" />
          <h3>防冒领机制</h3>
          <p>平台会隐藏敏感信息，并通过细节说明、辅助照片和管理员核验降低冒领风险。</p>
        </div>

        <div class="glass-card policy-card">
          <LineIcon name="truck" tone="orange" />
          <h3>身份核验</h3>
          <p>线下领取需出示学生证或校园身份凭证；邮寄领取需先核验注册邮箱、认领联系电话、校园身份信息和物品归属。</p>
        </div>

        <div class="glass-card policy-card">
          <LineIcon name="rotate" tone="green" />
          <h3>领错归还</h3>
          <p>如果领取后发现物品并非本人遗失物，应及时联系管理员并交回处理。</p>
        </div>

        <div class="glass-card item-image-card">
          <div class="item-image-preview" @click="imageViewerVisible = true">
            <img v-if="itemImages.length" :src="itemImages[0]" :alt="item.name" />
            <div v-else class="item-image-fallback">{{ itemCategory }}</div>
            <div class="image-overlay">
              <LineIcon name="search" tone="white" />
              <span>点击预览</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>

  <el-dialog v-model="imageViewerVisible" title="图片预览" width="80%" destroy-on-close>
    <img :src="itemImages[imageViewerIndex]" style="width: 100%; max-height: 70vh; object-fit: contain;" />
  </el-dialog>
</template>

<style scoped>
.claim-apply-page {
  padding-top: 42px;
}

.claim-blocked {
  padding-top: 80px;
  padding-bottom: 80px;
}

.blocked-card {
  max-width: 560px;
  margin: 0 auto;
  padding: 34px;
  text-align: center;
}

.blocked-card h1 {
  margin: 0 0 12px;
  font-size: 26px;
}

.blocked-card p {
  margin: 0 0 22px;
  color: var(--muted);
  line-height: 1.8;
}

.blocked-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--muted);
}

.upload-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgba(79, 124, 255, .16);
  overflow: hidden;
}

.upload-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--primary-strong), #5b54e8);
  transition: width .2s ease;
}

.claim-hero {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 26px;
}

.claim-hero h1 {
  margin: 18px 0;
  font-size: clamp(32px, 4vw, 48px);
  line-height: .98;
  letter-spacing: -.065em;
}

.claim-hero p {
  max-width: 680px;
  color: var(--muted);
  line-height: 1.85;
}

.claim-item-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 30px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
  height: 100%;
}

.claim-item-info {
  flex-shrink: 0;
}

.claim-item-images {
  flex: 1;
  display: grid;
  gap: 10px;
  min-height: 0;
  border-radius: 22px;
  overflow: hidden;
}

.claim-item-images.count-1 {
  grid-template-columns: 1fr;
}

.claim-item-images.count-2 {
  grid-template-columns: repeat(2, 1fr);
}

.claim-item-images.count-3 {
  grid-template-columns: repeat(3, 1fr);
}

.claim-item-images.count-0 {
  grid-template-columns: 1fr;
}

.claim-item-images {
  height: 200px;
  min-height: 200px;
  max-height: 200px;
}

.claim-item-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  background: #f8fbff;
  display: block;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.claim-item-images img:hover {
  transform: scale(1.02);
}

.claim-item-fallback {
  width: 100%;
  height: 100%;
  min-height: 120px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: rgba(79, 124, 255, .08);
  color: var(--primary-strong);
  font-weight: 900;
}

.claim-item-info b {
  display: block;
  font-size: 19px;
}

.claim-item-info span,
.claim-item-info small {
  display: block;
  margin-top: 6px;
  color: var(--muted);
}

.claim-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 22px;
}

.claim-form {
  padding: 28px;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 8px 0 18px;
}

.form-section-title h2 {
  margin: 0;
}

.form-section-title p {
  margin: 4px 0 0;
  color: var(--muted);
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

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-strong);
  cursor: pointer;
  margin: 0;
}

.identity-note {
  margin: -2px 0 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 159, 67, .10);
  color: #92400e;
  line-height: 1.7;
}

.identity-note b {
  display: block;
  margin-bottom: 4px;
}

.identity-note span {
  font-size: 13px;
}

.agree-line {
  margin-top: 4px;
  line-height: 1.7;
}

.agree-line a {
  color: var(--primary-strong);
  font-weight: 900;
  text-decoration: none;
}

.agree-line a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.side-stack {
  display: grid;
  align-content: start;
  gap: 16px;
}

.policy-card {
  padding: 22px;
}

.policy-card h3 {
  margin: 16px 0 8px;
}

.policy-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.item-image-card {
  padding: 16px;
}

.item-image-preview {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  background: #f8fbff;
}

.item-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-image-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: rgba(79, 124, 255, .08);
  color: var(--primary-strong);
  font-weight: 900;
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 0, 0, .4);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.item-image-preview:hover .image-overlay {
  opacity: 1;
}

.image-overlay :deep(.line-icon) {
  width: 32px;
  height: 32px;
}

@media (max-width: 900px) {
  .claim-hero,
  .claim-grid {
    grid-template-columns: 1fr;
  }
}
</style>
