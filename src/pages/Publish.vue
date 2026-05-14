<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCategoriesApi } from '@/api/category'
import { createItemApi, uploadItemImagesApi } from '@/api/item'
import ItemCard from '@/components/ItemCard.vue'
import PhotoUploader from '@/components/PhotoUploader.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const categoryList = ref([])

const form = reactive({
  type: 'lost',
  name: '',
  categoryId: '',
  categoryName: '',
  location: '',
  happenTime: '',
  description: '',
  contact: '',
  image: '',
  imageFile: null,
  claimHint: '',
  retentionDays: 30,
  visibility: 'public',
  isValuable: false
})

const fallbackCategories = [
  { id: '校园卡', name: '校园卡' },
  { id: '钥匙', name: '钥匙' },
  { id: '电子产品', name: '电子产品' },
  { id: '书本文具', name: '书本文具' },
  { id: '生活用品', name: '生活用品' },
  { id: '贵重物品', name: '贵重物品' },
  { id: '其他', name: '其他' }
]

const locations = [
  '图书馆',
  '教学楼',
  '实验楼',
  '食堂',
  '宿舍区',
  '操场',
  '校门口',
  '其他'
]

const categories = computed(() => {
  return categoryList.value.length ? categoryList.value : fallbackCategories
})

const rules = {
  type: [
    { required: true, message: '请选择信息类型', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入物品名称', trigger: 'blur' },
    { max: 30, message: '名称不能超过 30 字', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入地点', trigger: 'blur' }
  ],
  happenTime: [
    { required: true, message: '请选择时间', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { min: 10, message: '描述不少于 10 个字', trigger: 'blur' }
  ],
  contact: [
    { required: true, message: '请输入联系方式', trigger: 'blur' }
  ],
  visibility: [
    { required: true, message: '请选择可见范围', trigger: 'change' }
  ]
}

const activeStep = computed(() => {
  if (!form.type) {
    return 0
  }

  if (!form.image) {
    return 1
  }

  if (form.name && form.categoryId && form.location && form.happenTime) {
    return 3
  }

  return 2
})

const previewItem = computed(() => {
  return {
    id: 'preview',
    type: form.type,
    name: form.name || '待填写物品名称',
    category: form.categoryName || '其他',
    location: form.location || '待填写地点',
    happenTime: form.happenTime || '待选择时间',
    description: form.description || '这里会实时展示你填写的物品特征描述。',
    status: 'open',
    auditStatus: 'pending',
    image: form.image,
    storageCode: form.type === 'found' ? '待审核入库' : '待匹配',
    retentionDays: form.retentionDays,
    visibility: form.visibility,
    isValuable: form.isValuable,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
})

const assistText = computed(() => {
  if (!form.image) {
    return '建议上传清晰照片。真实平台中照片能显著降低误认成本，也方便后续做图片比对。'
  }

  if (form.description.length < 10) {
    return '建议补充颜色、品牌、特殊标记、遗失或拾取的具体位置，至少 10 个字。'
  }

  if (form.type === 'found' && !form.claimHint) {
    return '招领信息建议填写不公开的核验提示，避免被冒领。'
  }

  return '信息完整度较高。提交后进入待审核，管理员通过后展示在失物大厅。'
})

function normalizeCategories(res) {
  const list = res?.data || res || []

  return list.map(item => {
    if (typeof item === 'string') {
      return {
        id: item,
        name: item
      }
    }

    return {
      id: item.id,
      name: item.name
    }
  })
}

function normalizeCreatedItem(res) {
  const data = res?.data || res || null

  return data?.item || data
}

function handleCategoryChange(value) {
  const currentCategory = categories.value.find(item => String(item.id) === String(value))

  form.categoryName = currentCategory?.name || ''
}

function reset() {
  Object.assign(form, {
    type: 'lost',
    name: '',
    categoryId: '',
    categoryName: '',
    location: '',
    happenTime: '',
    description: '',
    contact: '',
    image: '',
    imageFile: null,
    claimHint: '',
    retentionDays: 30,
    visibility: 'public',
    isValuable: false
  })
}

function getImageList() {
  return form.imageFile ? [form.imageFile] : []
}

async function loadCategories() {
  try {
    const res = await getCategoriesApi()
    categoryList.value = normalizeCategories(res)
  } catch {
    categoryList.value = []
  }
}

async function submit() {
  await formRef.value.validate()
  loading.value = true

  try {
    const res = await createItemApi(form)
    const createdItem = normalizeCreatedItem(res)

    if (createdItem?.id && getImageList().length) {
      await uploadItemImagesApi(createdItem.id, getImageList())
    }

    ElMessage.success('提交成功，已进入待审核状态')
    router.push('/my-posts')
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="publish-page container">
    <section class="page-head fade-up">
      <span class="kicker">分步骤发布 · 照片比对</span>

      <h1>发布时就把“能不能认出来”考虑清楚。</h1>

      <p>在原需求表单字段基础上增强照片上传、实时预览、认领核验提示和保管策略，减少后续沟通成本。</p>
    </section>

    <section class="publish-grid">
      <div class="form-panel glass-card fade-up">
        <el-steps :active="activeStep" finish-status="success" simple>
          <el-step title="类型" />
          <el-step title="照片" />
          <el-step title="信息" />
          <el-step title="联系" />
        </el-steps>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="publish-form">
          <el-form-item label="信息类型" prop="type">
            <el-radio-group v-model="form.type">
              <el-radio-button label="lost">我丢了东西</el-radio-button>
              <el-radio-button label="found">我捡到东西</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="物品照片（强烈建议上传）">
            <PhotoUploader v-model="form.image" v-model:file="form.imageFile" />
          </el-form-item>

          <el-form-item label="物品名称" prop="name">
            <el-input v-model.trim="form.name" maxlength="30" show-word-limit placeholder="例如：黑色无线耳机" />
          </el-form-item>

          <div class="two-col">
            <el-form-item label="物品分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择" @change="handleCategoryChange">
                <el-option v-for="category in categories" :key="category.id || category.name" :label="category.name" :value="category.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="地点" prop="location">
              <el-select v-model="form.location" filterable allow-create placeholder="请选择或输入">
                <el-option v-for="location in locations" :key="location" :label="location" :value="location" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item :label="form.type === 'lost' ? '丢失时间' : '拾取时间'" prop="happenTime">
                <el-date-picker 
                  v-model="form.happenTime" 
                  type="datetime" 
                  value-format="YYYY-MM-DD HH:mm:ss" 
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择时间" 
                  style="width: 100%"
                />
              </el-form-item>

          <el-form-item label="详细描述" prop="description">
            <el-input v-model.trim="form.description" type="textarea" :rows="5" maxlength="260" show-word-limit placeholder="颜色、品牌、特殊标记、可能遗失位置等。不要公开身份证、完整学号等敏感信息。" />
          </el-form-item>

          <el-form-item v-if="form.type === 'found'" label="认领核验提示（可选，不公开展示）">
            <el-input v-model.trim="form.claimHint" maxlength="80" show-word-limit placeholder="例如：请说明挂件样式、卡套颜色、U盘内文件夹名称" />
          </el-form-item>

          <div class="two-col">
            <el-form-item label="联系方式" prop="contact">
              <el-input v-model.trim="form.contact" placeholder="手机号 / QQ / 微信 / 邮箱 / 服务台" />
            </el-form-item>

            <el-form-item label="保管天数">
              <el-input-number v-model="form.retentionDays" :min="7" :max="90" style="width: 100%" />
            </el-form-item>
          </div>

          <div class="two-col">
            <el-form-item label="可见范围" prop="visibility">
              <el-select v-model="form.visibility" placeholder="请选择">
                <el-option label="公开展示" value="public" />
                <el-option label="仅匹配用户可见" value="matched" />
                <el-option label="仅管理员可见" value="admin_only" />
              </el-select>
            </el-form-item>

            <el-form-item label="风险标记">
              <el-checkbox v-model="form.isValuable">贵重物品，认领时加强核验</el-checkbox>
            </el-form-item>
          </div>

          <div class="submit-line">
            <el-button @click="reset">重置</el-button>
            <el-button type="primary" :loading="loading" @click="submit">提交审核</el-button>
          </div>
        </el-form>
      </div>

      <aside class="preview-panel fade-up">
  <div class="preview-header">
    <b>实时预览</b>
    <span>发布后的卡片效果</span>
  </div>

  <div class="live-card">
    <div class="live-cover" :class="{ empty: !form.image }">
      <img v-if="form.image" :src="form.image" alt="物品预览图" />

      <div v-else class="cover-empty">
        <span>上传照片后展示预览</span>
      </div>
    </div>

    <div class="live-body">
      <div class="live-head">
        <b>{{ previewItem.name }}</b>
        <el-tag :type="form.type === 'lost' ? 'warning' : 'success'">
          {{ form.type === 'lost' ? '失物' : '招领' }}
        </el-tag>
      </div>

      <p>{{ previewItem.description }}</p>

      <div class="live-meta">
        <span>{{ previewItem.category }}</span>
        <span>{{ previewItem.location }}</span>
        <span>{{ previewItem.happenTime }}</span>
      </div>

      <div class="live-footer">
        <span>{{ previewItem.auditStatus === 'pending' ? '待审核' : '已展示' }}</span>
        <span>{{ form.image ? '有照片可比对' : '暂无照片' }}</span>
      </div>
    </div>
  </div>

  <RetentionBadge v-if="previewItem.type === 'found'" :item="previewItem" class="preview-retention" />

  <div class="assist-box">
    <b>智能填写建议</b>
    <p>{{ assistText }}</p>
  </div>
</aside>
    </section>
  </div>
</template>

<style scoped>
.publish-page {
  padding-top: 42px;
}

.page-head {
  max-width: 900px;
  margin-bottom: 24px;
}

.page-head h1 {
  margin: 18px 0 12px;
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.04;
  letter-spacing: -.06em;
}

.page-head p {
  color: var(--muted);
  line-height: 1.8;
}

.publish-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 24px;
  align-items: start;
}

.form-panel {
  padding: 24px;
}

.publish-form {
  margin-top: 24px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.submit-line {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.preview-panel {
  position: sticky;
  top: 96px;
  padding: 20px;
  border-radius: 30px;
  background: rgba(255, 255, 255, .70);
  box-shadow: var(--shadow);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
  color: var(--muted);
}

.preview-header b {
  color: var(--ink);
}

.preview-retention {
  margin-top: 14px;
}

.assist-box {
  margin-top: 16px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(79, 124, 255, .08);
  color: var(--muted);
  line-height: 1.7;
}

.assist-box b {
  display: block;
  color: var(--primary-strong);
  margin-bottom: 6px;
}

.assist-box p {
  margin: 0;
}

.live-card {
  overflow: hidden;
  border-radius: 28px;
  background: rgba(255, 255, 255, .88);
  box-shadow: 0 18px 48px rgba(31, 45, 92, .12);
}

.live-cover {
  height: 210px;
  overflow: hidden;
  background: linear-gradient(135deg, #eef4ff, #f8fbff);
}

.live-cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: #f8fbff;
}

.cover-empty {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--muted);
}

.live-body {
  padding: 18px;
}

.live-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.live-head b {
  font-size: 19px;
  line-height: 1.35;
}

.live-body p {
  margin: 12px 0 16px;
  color: var(--muted);
  line-height: 1.7;
}

.live-meta {
  display: grid;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(17, 24, 39, .08);
  color: #64748b;
  font-size: 14px;
}

.live-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  color: #8b95a7;
  font-size: 13px;
}

@media (max-width: 920px) {
  .publish-grid {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    position: static;
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>