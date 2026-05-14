<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getItemDetailApi, getItemsApi } from '@/api/item'
import { getFavoritesApi, addFavoriteApi, removeFavoriteApi } from '@/api/favorite'
import { findSimilarItems } from '@/utils/match'
import { useUserStore } from '@/stores/user'
import StatusTimeline from '@/components/StatusTimeline.vue'
import ItemCard from '@/components/ItemCard.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'
import ClaimComparePanel from '@/components/ClaimComparePanel.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const item = ref(null)
const similar = ref([])
const favorite = ref(false)
const loading = ref(true)
const error = ref(null)

const itemType = computed(() => item.value?.type || 'lost')

const itemCategory = computed(() => {
  if (typeof item.value?.category === 'string') {
    return item.value.category
  }

  if (item.value?.category?.name) {
    return item.value.category.name
  }

  return item.value?.category_name || '其他'
})

const itemImage = computed(() => {
  if (item.value?.image) {
    return item.value.image
  }

  if (item.value?.image_url) {
    return item.value.image_url
  }

  if (Array.isArray(item.value?.images) && item.value.images.length) {
    const firstImage = item.value.images[0]

    return typeof firstImage === 'string' ? firstImage : firstImage.image_url || firstImage.url || ''
  }

  return ''
})

const itemTime = computed(() => {
  return item.value?.happenTime || item.value?.happen_time || item.value?.created_at || '时间待补充'
})

const hasPhoto = computed(() => {
  return Boolean(itemImage.value)
})

const statusText = computed(() => {
  const status = item.value?.status

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

const maskedContact = computed(() => {
  const text = String(item.value?.contact || '')

  return text
    .replace(/(\d{3})\d{4}(\d{4})/g, '$1****$2')
    .replace(/([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g, '$1***$2')
})

function normalizeItem(res) {
  return res?.data || res || null
}

function normalizeItems(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

function normalizeFavorites(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

async function loadSimilar() {
  const res = await getItemsApi({
    page: 1,
    page_size: 100
  })

  similar.value = findSimilarItems(item.value, normalizeItems(res), 3)
}

async function loadFavorite() {
  if (!userStore.isLogin || !item.value?.id) {
    favorite.value = false
    return
  }

  const res = await getFavoritesApi()
  const list = normalizeFavorites(res)

  favorite.value = list.some(favoriteItem => {
    const currentId = favoriteItem.item_id || favoriteItem.itemId || favoriteItem.item?.id || favoriteItem.id

    return String(currentId) === String(item.value.id)
  })
}

async function load() {
  loading.value = true
  error.value = null

  try {
    const res = await getItemDetailApi(route.params.id)

    item.value = normalizeItem(res)

    if (!item.value) {
      router.push('/404')
      return
    }

    await Promise.all([
      loadSimilar(),
      loadFavorite()
    ])
  } catch (err) {
    if (err.response?.status === 404) {
      router.push('/404')
    } else {
      error.value = err
    }
  } finally {
    loading.value = false
  }
}

async function toggleFav() {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录后再收藏')
    return
  }

  if (favorite.value) {
    await removeFavoriteApi(item.value.id)
    favorite.value = false
    ElMessage.success('已取消收藏')
  } else {
    await addFavoriteApi(item.value.id)
    favorite.value = true
    ElMessage.success('已加入收藏夹')
  }
}

onMounted(load)

watch(() => route.params.id, load)
</script>

<template>
  <div class="detail-page container">
    <LoadingState v-if="loading" text="正在加载物品详情..." />

    <ErrorState v-else-if="error" title="加载失败" desc="网络连接异常，请稍后重试。" @retry="load" />

    <template v-else-if="item">
      <section class="detail-hero fade-up">
        <div class="detail-visual" :class="itemType">
          <img v-if="itemImage" :src="itemImage" alt="物品照片" />
          <div v-else class="fallback-large">
            <span>{{ itemCategory }}</span>
          </div>
        </div>

      <div class="detail-copy">
        <div class="tag-line">
          <el-tag class="soft-tag" :class="itemType === 'lost' ? 'type-lost' : 'type-found'">{{ itemType === 'lost' ? '失物信息' : '招领信息' }}</el-tag>
          <el-tag class="soft-tag">{{ itemCategory }}</el-tag>
          <el-tag class="soft-tag">{{ hasPhoto ? '有照片' : '暂无照片' }}</el-tag>
        </div>

        <h1>{{ item.name }}</h1>

        <p>{{ item.description }}</p>

        <div class="info-grid">
          <div>
            <b>地点</b>
            <span>{{ item.location }}</span>
          </div>

          <div>
            <b>时间</b>
            <span>{{ itemTime }}</span>
          </div>

          <div>
            <b>联系方式</b>
            <span>{{ maskedContact || '登录后按规则查看' }}</span>
          </div>

          <div>
            <b>当前状态</b>
            <span>{{ statusText }}</span>
          </div>
        </div>

        <div class="detail-actions">
          <el-button type="primary" size="large" @click="$router.push(`/items/${item.id}/claim`)">{{ itemType === 'found' ? '我要认领' : '我有线索' }}</el-button>
          <el-button size="large" @click="toggleFav">{{ favorite ? '取消收藏' : '收藏' }}</el-button>
          <el-button size="large" @click="$router.push('/guide')">查看用户须知</el-button>
        </div>
      </div>
    </section>

    <section class="detail-grid">
      <div class="glass-card panel">
        <h2>状态追踪</h2>
        <StatusTimeline :item="item" />
      </div>

      <div class="glass-card panel">
        <h2>保管与滞留规则</h2>
        <RetentionBadge :item="item" />

        <ul class="safety">
          <li>招领物品进入保管期，临近到期时管理员优先提醒或集中处理。</li>
          <li>超过保管期仍无人认领，可按校内规则移交服务台、学院办公室或保卫处。</li>
          <li>贵重物品、证件、银行卡、U盘等应走人工核验和线下交接，不建议公开敏感信息。</li>
        </ul>
      </div>
    </section>

    <section class="claim-section">
      <ClaimComparePanel :item="item" />
    </section>

    <section class="similar-section" v-if="similar.length">
      <div class="section-title">
        <div>
          <h2>系统为你找到的相似信息</h2>
          <p>基于分类、地点、时间和描述关键词进行基础匹配推荐。</p>
        </div>
      </div>

      <TransitionGroup name="list" tag="div" class="item-grid">
        <ItemCard v-for="similarItem in similar" :key="similarItem.id" :item="similarItem" />
      </TransitionGroup>
    </section>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  padding-top: 42px;
}

.detail-hero {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 30px;
  align-items: stretch;
}

.detail-visual {
  min-height: 420px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 38px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .24), rgba(108, 99, 255, .13));
  box-shadow: var(--shadow);
}

.detail-visual.found {
  background: linear-gradient(135deg, rgba(0, 184, 148, .22), rgba(79, 124, 255, .12));
}

.detail-visual img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: linear-gradient(135deg, #f8fbff, #eef4ff);
}

.fallback-large {
  width: 180px;
  height: 180px;
  display: grid;
  place-items: center;
  border-radius: 52px;
  background: rgba(255, 255, 255, .7);
  font-weight: 900;
  color: var(--primary-strong);
  font-size: 28px;
  animation: floatSlow 5s infinite;
}

.detail-copy {
  padding: 36px;
  border-radius: 38px;
  background: rgba(255, 255, 255, .78);
  box-shadow: var(--shadow);
}

.tag-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-copy h1 {
  margin: 22px 0 14px;
  font-size: clamp(34px, 5vw, 58px);
  letter-spacing: -.06em;
}

.detail-copy p {
  color: var(--muted);
  line-height: 1.9;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 24px;
}

.info-grid div {
  padding: 16px;
  border-radius: 20px;
  background: rgba(79, 124, 255, .06);
}

.info-grid b {
  display: block;
  margin-bottom: 7px;
}

.info-grid span {
  color: var(--muted);
}

.detail-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 22px;
  margin-top: 26px;
}

.panel {
  padding: 28px;
}

.panel h2 {
  margin-top: 0;
}

.safety {
  padding-left: 20px;
  color: var(--muted);
  line-height: 1.9;
}

.claim-section {
  margin-top: 26px;
}

.similar-section {
  margin-top: 54px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .detail-hero,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .item-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .detail-visual {
    min-height: 260px;
  }
}
</style>