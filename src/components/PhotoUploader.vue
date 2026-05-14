<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  file: {
    type: Object,
    default: null
  },
  title: {
    type: String,
    default: '上传物品照片'
  },
  desc: {
    type: String,
    default: '支持 JPG / PNG / WEBP，建议拍清楚颜色、品牌和特殊标记'
  }
})

const emit = defineEmits(['update:modelValue', 'update:file'])

const fileInput = ref(null)
const previewVisible = ref(false)
const objectUrl = ref('')

const revokeObjectUrl = () => {
  if (!objectUrl.value) return

  try {
    URL.revokeObjectUrl(objectUrl.value)
  } catch (e) {
    // URL 可能已经被 revoke，忽略错误
  }
  objectUrl.value = ''
}

const clearNativeInput = () => {
  if (fileInput.value) fileInput.value.value = ''
}

const syncExternalClear = () => {
  if (props.modelValue || props.file) return

  revokeObjectUrl()
  clearNativeInput()
  previewVisible.value = false
}

const choose = () => {
  fileInput.value?.click()
}

const clear = () => {
  revokeObjectUrl()
  previewVisible.value = false
  emit('update:modelValue', '')
  emit('update:file', null)
  clearNativeInput()
}

const onFileChange = event => {
  const currentFile = event.target.files?.[0]

  if (!currentFile) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(currentFile.type)) {
    ElMessage.warning('请上传 JPG、PNG 或 WEBP 图片')
    clearNativeInput()
    return
  }

  if (currentFile.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 2MB，正式上线建议后端压缩或使用对象存储')
    clearNativeInput()
    return
  }

  revokeObjectUrl()

  objectUrl.value = URL.createObjectURL(currentFile)

  emit('update:modelValue', objectUrl.value)
  emit('update:file', currentFile)

  clearNativeInput()
}

watch(
  () => [props.modelValue, props.file],
  syncExternalClear
)

onBeforeUnmount(revokeObjectUrl)
</script>

<template>
  <div class="photo-uploader" :class="{ 'has-photo': modelValue }">
    <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="file-input" @change="onFileChange" />

    <div v-if="modelValue" class="photo-preview" @click="previewVisible = true">
      <img :src="modelValue" alt="物品照片预览" />

      <div class="photo-mask">
        <el-button size="small" @click.stop="choose">重新选择</el-button>
        <el-button size="small" type="danger" plain @click.stop="clear">移除</el-button>
      </div>
    </div>

    <button v-else type="button" class="upload-empty" @click="choose">
      <span class="camera-icon"></span>
      <b>{{ title }}</b>
      <small>{{ desc }}</small>
    </button>

    <el-dialog v-model="previewVisible" title="照片完整预览" width="min(920px, 92vw)" append-to-body>
      <div class="full-preview">
        <img :src="modelValue" alt="完整照片预览" />
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

.upload-empty {
  width: 100%;
  min-height: 172px;
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
  min-height: 220px;
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
  min-height: 220px;
  max-height: 320px;
  object-fit: contain;
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