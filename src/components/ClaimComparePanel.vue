<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PhotoUploader from './PhotoUploader.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const proofImages = ref([])
const proofFiles = ref([])
const proofText = ref('')

const itemType = computed(() => props.item?.type || 'found')

const actionText = computed(() => {
  return itemType.value === 'found' ? '提交认领申请' : '提交线索'
})

const itemImage = computed(() => {
  if (props.item?.image) return props.item.image
  if (props.item?.image_url) return props.item.image_url

  if (Array.isArray(props.item?.images) && props.item.images.length) {
    const firstImage = props.item.images[0]

    return typeof firstImage === 'string' ? firstImage : firstImage.image_url || firstImage.url || ''
  }

  return ''
})

const itemText = computed(() => {
  return `${props.item?.name || ''} ${props.item?.description || ''}`.toLowerCase()
})

const score = computed(() => {
  let value = 28

  if (proofImages.value.length) value += 28
  if (proofText.value.length >= 20) value += 24

  const hits = proofText.value
    .toLowerCase()
    .split(/[\s,，。；;、/]+/)
    .filter(word => word.length >= 2 && itemText.value.includes(word))
    .length

  value += Math.min(20, hits * 7)

  return Math.min(96, value)
})

const scoreText = computed(() => {
  if (score.value >= 80) return '证明信息较充分，建议进入线下核验。'
  if (score.value >= 60) return '信息有参考价值，建议补充更具体的物品细节。'

  return '信息偏少，真实上线时应要求补充细节或人工复核。'
})

const reset = () => {
  proofImages.value = []
  proofFiles.value = []
  proofText.value = ''
}

const goClaim = () => {
  if (!props.item?.id) return ElMessage.warning('物品信息缺少 ID，暂时无法进入认领流程')

  router.push(`/items/${props.item.id}/claim`)
}
</script>

<template>
  <div class="claim-panel glass-card">
    <div class="claim-head">
      <div>
        <h2>{{ itemType === 'found' ? '认领比对' : '线索提交' }}</h2>
        <p>用照片和细节描述减少误认、冒领，让交接更可信。</p>
      </div>

      <el-tag class="soft-tag">辅助比对</el-tag>
    </div>

    <div class="compare-grid">
      <div class="compare-side">
        <span>平台照片</span>

        <div class="compare-photo" :class="{ empty: !itemImage }">
          <img v-if="itemImage" :src="itemImage" alt="平台物品照片" />
          <b v-else>暂无公开照片</b>
        </div>
      </div>

      <div class="compare-side">
        <span>{{ itemType === 'found' ? '我的证明照片' : '我提供的线索照片' }}</span>

        <PhotoUploader
          v-model="proofImages"
          v-model:file="proofFiles"
          title="上传比对照片"
          desc="例如备用照片、购买记录、同款细节或现场线索"
        />
      </div>
    </div>

    <el-input
      v-model="proofText"
      type="textarea"
      :rows="4"
      maxlength="180"
      show-word-limit
      placeholder="请填写只有真正失主更可能知道的细节：颜色、划痕、贴纸、挂件、文件夹名称、校园卡姓名等。"
    />

    <div v-if="proofText || proofImages.length" class="score-box">
      <div>
        <b>可信度预估</b>
        <p>{{ scoreText }}</p>
      </div>

      <strong>{{ score }}%</strong>
    </div>

    <div class="claim-actions">
      <el-button class="claim-clear-btn" @click="reset">清空</el-button>
      <el-button type="primary" class="claim-submit-btn" @click="goClaim">{{ actionText }}</el-button>
    </div>
  </div>
</template>

<style scoped>
.claim-panel {
  padding: 28px;
}

.claim-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

h2 {
  margin: 0 0 8px;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 16px;
}

.compare-side {
  display: flex;
  flex-direction: column;
}

.compare-side > span {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 13px;
}

.compare-photo {
  height: 260px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 24px;
  background: #eef2f7;
  color: var(--muted);
}

.compare-photo img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: linear-gradient(135deg, #f8fbff, #eef4ff);
}

.compare-side :deep(.photo-uploader) {
  height: 260px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.compare-side :deep(.upload-grid) {
  height: 100%;
}

.compare-side :deep(.upload-empty),
.compare-side :deep(.photo-preview) {
  height: 100%;
  min-height: 0;
}

.compare-side :deep(.photo-preview img) {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: none;
  object-fit: cover;
}

.score-box {
  margin-top: 14px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .10), rgba(0, 184, 148, .08));
}

.score-box strong {
  font-size: 30px;
  color: var(--primary-strong);
}

.claim-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.claim-clear-btn {
  min-width: 88px;
  height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.claim-submit-btn {
  min-width: 136px;
  height: 40px;
  border-radius: 999px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }

  .compare-photo,
  .compare-side :deep(.photo-uploader),
  .compare-side :deep(.upload-empty),
  .compare-side :deep(.photo-preview),
  .compare-side :deep(.photo-preview img) {
    height: 230px;
    min-height: 0;
    max-height: 230px;
  }

  .compare-side :deep(.photo-preview img) {
    object-fit: cover;
  }

  .claim-actions {
    justify-content: stretch;
  }

  .claim-actions .el-button {
    flex: 1;
  }
}
</style>