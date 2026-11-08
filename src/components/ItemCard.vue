<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addFavoriteApi, removeFavoriteApi } from '@/api/favorite'
import { useUserStore } from '@/stores/user'
import { storage } from '@/utils/storage'
import { formatDateTime } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  showFavorite: {
    type: Boolean,
    default: false
  },
  favorited: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:favorited', 'favorite-change'])

const userStore = useUserStore()
const router = useRouter()

const isFavorited = ref(props.favorited)
const favoriteLoading = ref(false)
const hasLoginToken = () => {
  return Boolean(userStore.token || storage.get('token', ''))
}

watch(
  () => props.favorited,
  value => {
    isFavorited.value = value
  }
)

const itemType = computed(() => props.item.type || 'lost')

const itemCategory = computed(() => {
  if (typeof props.item.category === 'string') {
    return props.item.category
  }

  if (props.item.category?.name) {
    return props.item.category.name
  }

  return props.item.category_name || '其他'
})

const getFullImageUrl = url => resolveImageUrl(url)

const itemImage = computed(() => {
  let url = ''

  if (props.item.image) {
    url = props.item.image
  } else if (props.item.image_url) {
    url = props.item.image_url
  } else if (Array.isArray(props.item.images) && props.item.images.length) {
    const firstImage = props.item.images[0]

    url = typeof firstImage === 'string'
      ? firstImage
      : firstImage.image_url || firstImage.url || firstImage.path || ''
  }

  return getFullImageUrl(url?.trim?.() || '')
})

const itemTime = computed(() => {
  const raw = props.item.happenTime || props.item.happen_time || props.item.created_at || ''

  return formatDateTime(raw)
})

const isValuable = computed(() => {
  return Boolean(props.item.isValuable || props.item.is_valuable)
})

const storageText = computed(() => {
  return props.item.storageCode || props.item.storage_code || (itemType.value === 'found' ? '待入库' : '待核对')
})

const categoryClass = computed(() => {
  return `icon-${String(itemCategory.value).replace(/\s/g, '')}`
})

const statusText = computed(() => {
  const status = props.item.status

  if (['done', 'completed'].includes(status)) {
    return itemType.value === 'lost' ? '已找回' : '已认领'
  }

  if (status === 'claiming') {
    return '认领中'
  }

  if (status === 'closed') {
    return '已关闭'
  }

  return itemType.value === 'lost' ? '寻找中' : '待认领'
})

const statusClass = computed(() => {
  return ['done', 'completed'].includes(props.item.status) ? 'status-dot status-done' : 'status-dot status-open'
})

async function toggleFavorite() {
  if (!props.item?.id) {
    ElMessage.warning('物品信息缺少 ID')
    return
  }

  if (!hasLoginToken()) {
    ElMessage.warning('请先登录后再收藏')
    return
  }

  if (favoriteLoading.value) return

  favoriteLoading.value = true

  try {
    if (!isFavorited.value) {
      await addFavoriteApi(props.item.id)

      isFavorited.value = true

      emit('update:favorited', true)
      emit('favorite-change', {
        itemId: props.item.id,
        favorited: true
      })

      ElMessage.success('已加入收藏夹')
      return
    }

    await ElMessageBox.confirm('是否取消收藏？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await removeFavoriteApi(props.item.id)

    isFavorited.value = false

    emit('update:favorited', false)
    emit('favorite-change', {
      itemId: props.item.id,
      favorited: false
    })

    ElMessage.success('已取消收藏')
  } finally {
    favoriteLoading.value = false
  }
}

const goDetail = () => {
  if (!props.item?.id) {
    ElMessage.warning('物品信息不完整')
    return
  }

  router.push(`/items/${props.item.id}`)
}
</script>

<template>
  <article class="item-card" @click="goDetail">
    <div class="visual" :class="itemType">
      <img v-if="itemImage" :src="itemImage" alt="物品照片" loading="lazy" decoding="async" />

      <div v-else class="fallback-icon" :class="categoryClass">
        <span class="fallback-label">物品照片</span>
      </div>

      <div class="badge-row">
        <el-tag class="soft-tag" :class="itemType === 'lost' ? 'type-lost' : 'type-found'">
          {{ itemType === 'lost' ? '失物' : '招领' }}
        </el-tag>

        <el-tag v-if="isValuable" class="soft-tag valuable-tag">贵重</el-tag>
      </div>

      <button
  v-if="showFavorite"
  type="button"
  class="fav-btn"
  :class="{ favorited: isFavorited }"
  :disabled="favoriteLoading"
  :title="isFavorited ? '已收藏' : '收藏'"
  @click.stop.prevent="toggleFavorite"
>
        <svg v-if="!isFavorited" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>

        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </button>
    </div>

    <div class="body">
      <div class="title-row">
        <h3>{{ item.name || '未命名物品' }}</h3>

        <span class="status">
          <i :class="statusClass"></i>
          {{ statusText }}
        </span>
      </div>

      <p>{{ item.description || '暂无描述' }}</p>

      <div class="meta">
        <span class="pin-icon"></span>
        <span>{{ item.location || '位置未知' }}</span>
        <span class="clock-icon"></span>
        <span>{{ itemTime }}</span>
      </div>

      <div class="card-footer">
        <small>{{ storageText }}</small>
        <small>{{ itemImage ? '有照片可核对' : '暂无照片' }}</small>
      </div>
    </div>
  </article>
</template>

<style scoped>
.item-card {
  cursor: pointer;
  overflow: hidden;
  border-radius: 30px;
  background: rgba(255, 255, 255, .86);
  border: 1px solid rgba(255, 255, 255, .82);
  box-shadow: 0 18px 44px rgba(31, 45, 92, .11);
  transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 28px 70px rgba(31, 45, 92, .16);
  border-color: rgba(79, 124, 255, .22);
}

.visual {
  position: relative;
  height: 166px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 28% 20%, rgba(255, 255, 255, .82), transparent 30%), linear-gradient(135deg, rgba(79, 124, 255, .24), rgba(108, 99, 255, .16));
}

.visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  transition: .35s ease;
}

.item-card:hover .visual img {
  transform: scale(1.05);
}

.visual.found {
  background: radial-gradient(circle at 28% 20%, rgba(255, 255, 255, .82), transparent 30%), linear-gradient(135deg, rgba(0, 184, 148, .20), rgba(79, 124, 255, .12));
}

.visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, .04), rgba(0, 0, 0, .20));
  opacity: .56;
  pointer-events: none;
}

.badge-row {
  position: absolute;
  z-index: 2;
  top: 14px;
  left: 14px;
  right: 50px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.valuable-tag {
  color: #b42318;
  background: rgba(244, 63, 94, .12);
}

.fallback-icon {
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 30px;
  background: rgba(255, 255, 255, .72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8);
  animation: floatSlow 5.4s ease-in-out infinite;
}

.fallback-icon .fallback-label {
  position: relative;
  z-index: 2;
  display: block;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.fallback-icon span:not(.fallback-label),
.fallback-icon::before,
.fallback-icon::after {
  content: '';
  position: absolute;
  display: block;
}

.icon-电子产品 span {
  width: 45px;
  height: 30px;
  top: 22px;
  border: 4px solid var(--primary);
  border-radius: 999px 999px 18px 18px;
  border-bottom-color: transparent;
}

.icon-电子产品::before {
  width: 17px;
  height: 26px;
  left: 17px;
  top: 35px;
  border: 4px solid var(--primary);
  border-radius: 10px;
}

.icon-电子产品::after {
  width: 17px;
  height: 26px;
  right: 17px;
  top: 35px;
  border: 4px solid var(--primary);
  border-radius: 10px;
}

.icon-校园卡 span {
  width: 48px;
  height: 34px;
  border: 4px solid var(--primary);
  border-radius: 10px;
}

.icon-校园卡::before {
  width: 14px;
  height: 14px;
  left: 23px;
  top: 28px;
  border-radius: 50%;
  background: var(--primary);
}

.icon-校园卡::after {
  width: 22px;
  height: 4px;
  right: 20px;
  bottom: 28px;
  border-radius: 999px;
  background: var(--primary);
}

.icon-钥匙 span {
  width: 22px;
  height: 22px;
  left: 20px;
  top: 26px;
  border: 5px solid var(--warning);
  border-radius: 50%;
}

.icon-钥匙::before {
  width: 34px;
  height: 5px;
  left: 39px;
  top: 38px;
  border-radius: 999px;
  background: var(--warning);
}

.icon-钥匙::after {
  width: 5px;
  height: 14px;
  right: 18px;
  top: 38px;
  background: var(--warning);
  box-shadow: -10px 0 0 var(--warning);
}

.icon-书本文具 span {
  width: 44px;
  height: 52px;
  border: 4px solid var(--primary);
  border-radius: 8px;
  transform: skewY(-3deg);
}

.icon-书本文具::before {
  width: 4px;
  height: 44px;
  left: 43px;
  top: 22px;
  background: var(--primary);
}

.icon-生活用品 span {
  width: 42px;
  height: 42px;
  border: 4px solid var(--success);
  border-radius: 8px 8px 22px 22px;
}

.icon-贵重物品 span {
  width: 42px;
  height: 48px;
  border: 4px solid var(--danger);
  border-radius: 22px 22px 16px 16px;
}

.icon-贵重物品::before {
  width: 18px;
  height: 10px;
  left: 33px;
  top: 34px;
  border-left: 4px solid var(--danger);
  border-bottom: 4px solid var(--danger);
  transform: rotate(-45deg);
}

.icon-其他 span {
  width: 48px;
  height: 40px;
  border: 4px solid var(--secondary);
  border-radius: 12px;
}

.body {
  padding: 18px;
}

.title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.title-row h3 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -.02em;
}

.body p {
  margin: 10px 0 12px;
  color: var(--muted);
  line-height: 1.7;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 47px;
}

.status {
  white-space: nowrap;
  font-size: 13px;
  color: var(--muted);
  padding-top: 3px;
}

.meta {
  display: grid;
  grid-template-columns: 16px auto 16px auto;
  align-items: center;
  gap: 7px;
  color: #6b7280;
  font-size: 13px;
}

.pin-icon,
.clock-icon {
  width: 14px;
  height: 14px;
  position: relative;
  display: inline-block;
}

.pin-icon::before {
  content: '';
  position: absolute;
  inset: 1px 3px 4px;
  border: 3px solid var(--primary);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.clock-icon {
  border: 2px solid var(--success);
  border-radius: 50%;
}

.clock-icon::before {
  content: '';
  position: absolute;
  width: 2px;
  height: 5px;
  left: 5px;
  top: 2px;
  background: var(--success);
}

.clock-icon::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 2px;
  left: 5px;
  top: 6px;
  background: var(--success);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  padding-top: 13px;
  border-top: 1px solid rgba(17, 24, 39, .08);
  color: #8b95a7;
}

.card-footer small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .9);
  color: #f59e0b;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .12);
  transition: .2s ease;
}

.fav-btn:hover {
  background: #f59e0b;
  color: #fff;
}

.fav-btn.favorited {
  color: #10b981;
}

.fav-btn.favorited:hover {
  background: #10b981;
  color: #fff;
}

.fav-btn:disabled {
  opacity: .7;
  cursor: not-allowed;
}

.fav-btn svg {
  pointer-events: none;
}

@media (pointer: coarse), (max-width: 620px) {
  .fav-btn {
    width: 40px;
    height: 40px;
  }
}
</style>