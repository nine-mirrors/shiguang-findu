<script setup>
import { onMounted, ref } from 'vue'
import { getFavoritesApi } from '@/api/favorite'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'

const items = ref([])
const loading = ref(false)
const loadError = ref(false)

const normalizeFavorites = res => {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const normalizeFavoriteItems = list => {
  return list
    .map(item => item.item || item.lost_found_item || item.lostFoundItem || item)
    .filter(item => item && item.id)
}

const loadFavorites = async () => {
  loading.value = true
  loadError.value = false

  try {
    const res = await getFavoritesApi()
    const list = normalizeFavorites(res)

    items.value = normalizeFavoriteItems(list)
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const handleFavoriteChange = ({ itemId, favorited }) => {
  if (!favorited) {
    items.value = items.value.filter(item => String(item.id) !== String(itemId))
  }
}

onMounted(loadFavorites)
</script>

<template>
  <div class="favorites-page container">
    <section class="page-title fade-up">
      <div>
        <span class="kicker">收藏夹</span>

        <h1>保存感兴趣的失物 / 招领信息。</h1>

        <p>用于后续查看物品状态、进入详情页继续核对信息，也可以随时取消收藏。</p>
      </div>

      <el-button :loading="loading" plain @click="loadFavorites">刷新收藏</el-button>
    </section>

    <section v-if="loading" class="loading-grid">
      <el-skeleton v-for="item in 6" :key="item" animated>
        <template #template>
          <div class="skeleton-card">
            <el-skeleton-item variant="image" class="skeleton-image" />
            <el-skeleton-item variant="h3" style="width: 70%" />
            <el-skeleton-item variant="text" style="width: 95%" />
            <el-skeleton-item variant="text" style="width: 60%" />
          </div>
        </template>
      </el-skeleton>
    </section>

    <ErrorState
      v-else-if="loadError"
      title="收藏夹加载失败"
      desc="暂时没能取回收藏列表，可以重新加载。"
      button-text="重新加载"
      @retry="loadFavorites"
    />

    <TransitionGroup v-else-if="items.length" name="list" tag="section" class="item-grid">
      <div v-for="item in items" :key="item.id" class="favorite-card-wrap">
        <div class="card-overlay-wrap">
          <ItemCard
            :item="item"
            show-favorite
            :favorited="true"
            @favorite-change="handleFavoriteChange"
          />
        </div>
      </div>
    </TransitionGroup>

    <EmptyState
      v-else
      title="暂无收藏"
      desc="在物品详情页点击收藏后，会在这里集中展示。"
      button-text="去失物大厅看看"
      @action="$router.push('/items')"
    />
  </div>
</template>

<style scoped>
.favorites-page {
  padding-top: 42px;
}

.page-title {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
}

.page-title h1 {
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.02;
  letter-spacing: -.06em;
  margin: 18px 0 12px;
}

.page-title p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.item-grid,
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 26px;
}

.favorite-card-wrap {
  display: grid;
  gap: 12px;
}

.card-overlay-wrap {
  position: relative;
}

.skeleton-card {
  padding: 16px;
  display: grid;
  gap: 14px;
  border-radius: 26px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.skeleton-image {
  width: 100%;
  height: 180px;
  border-radius: 20px;
}

@media (max-width: 920px) {
  .item-grid,
  .loading-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-title {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .item-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }
}
</style>