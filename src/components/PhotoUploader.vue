<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  file: {
    type: Array,
    default: () => []
  },
  max: {
    type: Number,
    default: 3
  },
  title: {
    type: String,
    default: '上传物品照片'
  },
  desc: {
    type: String,
    default: '支持 JPG / PNG / WEBP，最多上传3张，建议拍清楚颜色、品牌和特殊标记'
  }
})

const emit = defineEmits(['update:modelValue', 'update:file'])

const fileInput = ref(null)
const previewVisible = ref(false)
const previewIndex = ref(0)
const objectUrls = ref([])

const imageUrls = computed(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  if (typeof props.modelValue === 'string' && props.modelValue) return [props.modelValue]
  return []
})

const imageFiles = computed(() => {
  return Array.isArray(props.file) ? props.file : []
})

const canAddMore = computed(() => {
  return imageUrls.value.length < props.max
})

const revokeObjectUrls = () => {
  objectUrls.value.forEach(url => URL.revokeObjectURL(url))
  objectUrls.value = []
}

const clearNativeInput = () => {
  if (fileInput.value) fileInput.value.value = ''
}

const syncExternalClear = () => {
  if (props.modelValue?.length === 0 && props.file?.length === 0) {
    revokeObjectUrls()
    clearNativeInput()
    previewVisible.value = false
  }
}

const choose = () => {
  fileInput.value?.click()
}

const removeImage = (index) => {
  const newUrls = [...imageUrls.value]
  const newFiles = [...imageFiles.value]

  newUrls.splice(index, 1)
  newFiles.splice(index, 1)

  emit('update:modelValue', newUrls)
  emit('update:file', newFiles)
}

const clearAll = () => {
  revokeObjectUrls()
  previewVisible.value = false
  emit('update:modelValue', [])
  emit('update:file', [])
  clearNativeInput()
}

const onFileChange = event => {
  const files = Array.from(event.target.files || [])

  if (!files.length) return

  const remainingSlots = props.max - imageUrls.value.length
  const filesToAdd = files.slice(0, remainingSlots)

  if (files.length > remainingSlots) {
    ElMessage.warning(`最多只能上传 ${props.max} 张图片，已自动截取前 ${remainingSlots} 张`)
  }

  const validFiles = []
  const validUrls = []

  for (const file of filesToAdd) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      ElMessage.warning(`文件 ${file.name} 格式不正确，已跳过`)
      continue
    }

    if (file.size > 2 * 1024 * 1024) {
      ElMessage.warning(`文件 ${file.name} 超过 2MB，已跳过`)
      continue
    }

    validFiles.push(file)
    const url = URL.createObjectURL(file)
    objectUrls.value.push(url)
    validUrls.push(url)
  }

  if (validFiles.length > 0) {
    const newUrls = [...imageUrls.value, ...validUrls]
    const newFiles = [...imageFiles.value, ...validFiles]
    emit('update:modelValue', newUrls)
    emit('update:file', newFiles)
  }

  clearNativeInput()
}

const openPreview = (index) => {
  previewIndex.value = index
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
}

watch(
  () => [props.modelValue, props.file],
  syncExternalClear
)

onBeforeUnmount(revokeObjectUrls)
</script>

<template>
  <div class="photo-uploader">
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="file-input"
      multiple
      @change="onFileChange"
    />

    <div class="upload-grid" :class="{ 'has-photos': imageUrls.length > 0 }">
      <div
        v-for="(url, index) in imageUrls"
        :key="index"
        class="photo-preview"
        @click="openPreview(index)"
      >
        <img :src="url" :alt="`物品照片 ${index + 1}`" />

        <div class="photo-mask">
          <el-button size="small" @click.stop="removeImage(index)">移除</el-button>
        </div>
      </div>

      <button
        v-if="canAddMore"
        type="button"
        class="upload-empty"
        @click="choose"
      >
        <span class="camera-icon"></span>
        <b>{{ title }}</b>
        <small>{{ desc }}</small>
      </button>
    </div>

    <div v-if="imageUrls.length > 0" class="upload-tip">
      已上传 {{ imageUrls.length }}/{{ max }} 张图片
      <el-button size="small" type="danger" plain @click="clearAll">清空全部</el-button>
    </div>

    <el-dialog
      v-model="previewVisible"
      title="照片完整预览"
      width="min(920px, 92vw)"
      append-to-body
      @close="closePreview"
    >
      <div class="full-preview">
        <img :src="imageUrls[previewIndex]" :alt="`物品照片 ${previewIndex + 1}`" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.photo-uploader {
  width: 100%;
}

.file-input {
  display: none;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  height: 100%;
}

.upload-grid.has-photos:has(> .photo-preview:nth-child(1):nth-last-child(1)) {
  grid-template-columns: 1fr;
}

.upload-grid.has-photos:has(> .photo-preview:nth-child(1):nth-last-child(2)),
.upload-grid.has-photos:has(> .photo-preview:nth-child(2):nth-last-child(1)) {
  grid-template-columns: repeat(2, 1fr);
}

.upload-grid.has-photos:has(> .photo-preview:nth-child(1):nth-last-child(3)),
.upload-grid.has-photos:has(> .photo-preview:nth-child(2):nth-last-child(2)),
.upload-grid.has-photos:has(> .photo-preview:nth-child(3):nth-last-child(1)) {
  grid-template-columns: repeat(3, 1fr);
}

.upload-empty {
  min-height: 0;
  height: 100%;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 22px;
  border: 1px dashed rgba(79, 124, 255, .38);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .08), rgba(0, 184, 148, .06));
  color: var(--ink);
  cursor: pointer;
  transition: .25s ease;
  text-align: center;
}

.upload-empty:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 124, 255, .72);
  box-shadow: 0 18px 42px rgba(31, 45, 92, .10);
}

.upload-empty b {
  font-size: 16px;
}

.upload-empty small {
  color: var(--muted);
  line-height: 1.6;
  max-width: 320px;
}

.camera-icon {
  width: 58px;
  height: 58px;
  position: relative;
  border-radius: 22px;
  background: rgba(255, 255, 255, .72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .85), 0 12px 28px rgba(79, 124, 255, .12);
}

.camera-icon::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 18px;
  width: 32px;
  height: 24px;
  border: 3px solid var(--primary);
  border-radius: 9px;
}

.camera-icon::after {
  content: '';
  position: absolute;
  left: 24px;
  top: 24px;
  width: 10px;
  height: 10px;
  border: 3px solid var(--primary);
  border-radius: 999px;
  background: white;
}

.photo-preview {
  position: relative;
  overflow: hidden;
  min-height: 0;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: #eef2f7;
  box-shadow: 0 16px 42px rgba(31, 45, 92, .10);
  cursor: zoom-in;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: none;
  object-fit: cover;
  display: block;
  background: linear-gradient(135deg, #f8fbff, #eef4ff);
}

.photo-mask {
  position: absolute;
  inset: auto 12px 12px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, .74);
  backdrop-filter: blur(14px);
  opacity: 0;
  transform: translateY(8px);
  transition: .25s ease;
}

.photo-preview:hover .photo-mask {
  opacity: 1;
  transform: translateY(0);
}

.upload-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  color: var(--muted);
  font-size: 14px;
}

.full-preview {
  width: 100%;
  min-height: 420px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 20px;
  background: #f8fbff;
}

.full-preview img {
  width: 100%;
  max-height: 72vh;
  object-fit: contain;
  display: block;
}
</style>
