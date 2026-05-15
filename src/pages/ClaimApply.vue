<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getItemDetailApi } from '@/api/item'
import { createClaimApi } from '@/api/claim'
import { formatDateTime } from '@/utils/format'
import PhotoUploader from '@/components/PhotoUploader.vue'
import LineIcon from '@/components/LineIcon.vue'
import AppLoading from '@/components/AppLoading.vue'

const route = useRoute()
const router = useRouter()

const pageLoading = ref(true)
const item = ref(null)
const formRef = ref()
const loading = ref(false)

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
  return [
    { label: '我要认领', value: 'claim' },
    { label: '我有线索', value: 'clue' }
  ]
})

const getFullImageUrl = url => {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url

  const baseURL = import.meta.env.VITE_API_BASE_URL || ''

  if (url.startsWith('/storage/')) return `${baseURL}${url}`
  if (url.startsWith('storage/')) return `${baseURL}/${url}`

  return `${baseURL}/storage/${url.startsWith('/') ? url.slice(1) : url}`
}

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
    { required: true, message: '请填写联系电话', trigger: 'blur' }
  ]
}

const normalizeItem = res => {
  const payload = res?.data || res

  return payload?.item || payload
}

const loadItem = async () => {
  try {
    const res = await getItemDetailApi(route.params.id)

    item.value = normalizeItem(res)

    if (!item.value) {
      ElMessage.error('未找到该物品信息')
      return
    }

    // 检查物品是否可认领
    const status = item.value.status
    if (status === 'completed' || status === 'done' || status === 'closed') {
      ElMessage.warning('该物品已处理完毕，不可提交认领申请')
      return
    }
    if (status === 'claiming') {
      ElMessage.warning('该物品正在认领处理中，请耐心等待')
      return
    }

    form.claimType = itemType.value === 'found' ? 'claim' : 'clue'
  } catch {
    ElMessage.error('加载物品信息失败')
  } finally {
    pageLoading.value = false
  }
}

const submit = async () => {
  if (loading.value) return

  await formRef.value.validate()

  if (!form.agree) {
    ElMessage.warning('请先阅读并同意用户须知与平台规则')
    return
  }

  loading.value = true

  try {
    await createClaimApi(form)
    ElMessage.success('申请已提交，等待管理员核验')
    router.push('/my-posts?tab=claims')
  } catch {
    ElMessage.error('提交申请失败，请重试')
  } finally {
    loading.value = false
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

onMounted(loadItem)
</script>

<template>
  <AppLoading :visible="pageLoading" text="加载物品信息..." />

  <div v-if="item" class="claim-apply-page container">
    <section class="claim-hero fade-up">
      <div>
        <span class="kicker">认领与线索处理</span>

        <h1>{{ heroTitle }}</h1>

        <p>{{ heroDesc }}</p>
      </div>

      <div class="claim-item-card">
        <img v-if="itemImage" :src="itemImage" alt="物品照片" />

        <div v-else class="claim-item-fallback">
          {{ itemCategory }}
        </div>

        <div>
          <b>{{ item.name }}</b>
          <span>{{ item.location }} · {{ itemTime }}</span>
          <small>{{ storageText }}</small>
        </div>
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
          <el-radio-group v-model="form.claimType" class="type-group">
            <el-radio-button
              v-for="type in availableClaimTypes"
              :key="type.value"
              :label="type.value"
            >
              {{ type.label }}
            </el-radio-button>
          </el-radio-group>
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
          <el-radio-group v-model="form.pickupMethod">
            <el-radio-button label="offline">线下领取</el-radio-button>
            <el-radio-button label="delivery">邮寄到付 / 协商邮寄</el-radio-button>
          </el-radio-group>
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
      </aside>
    </section>
  </div>
</template>

<style scoped>
.claim-apply-page {
  padding-top: 42px;
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
  font-size: clamp(38px, 6vw, 64px);
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
  gap: 14px;
  align-items: center;
  border-radius: 30px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.claim-item-card img {
  width: 118px;
  height: 92px;
  object-fit: contain;
  border-radius: 22px;
  background: #f8fbff;
}

.claim-item-fallback {
  width: 118px;
  height: 92px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: rgba(79, 124, 255, .08);
  color: var(--primary-strong);
  font-weight: 900;
}

.claim-item-card b {
  display: block;
  font-size: 19px;
}

.claim-item-card span,
.claim-item-card small {
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
  gap: 8px;
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

@media (max-width: 900px) {
  .claim-hero,
  .claim-grid {
    grid-template-columns: 1fr;
  }
}
</style>