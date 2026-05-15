<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFavoritesApi, removeFavoriteApi } from '@/api/favorite'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const items = ref([])
const loading = ref(false)

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

  try {
    const res = await getFavoritesApi()
    const list = normalizeFavorites(res)

    items.value = normalizeFavoriteItems(list)
  } finally {
    loading.value = false
  }
}

const removeFavorite = async item => {
  if (!item?.id) return ElMessage.warning('收藏记录缺少物品 ID')

  await ElMessageBox.confirm(
    `确定取消收藏「${item.name || '该物品'}」吗？`,
    '取消收藏',
    {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想'
    }
  )

  await removeFavoriteApi(item.id)
  ElMessage.success('已取消收藏')
  await loadFavorites()
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

    <TransitionGroup v-else-if="items.length" name="list" tag="section" class="item-grid">
      <div v-for="item in items" :key="item.id" class="favorite-card-wrap">
        <ItemCard :item="item" />

        <div class="favorite-actions">
          <el-button plain size="small" @click="$router.push(`/items/${item.id}`)">查看详情</el-button>
          <el-button plain size="small" type="danger" @click="removeFavorite(item)">取消收藏</el-button>
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
  font-size: clamp(36px, 5vw, 56px);
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

.favorite-actions {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-radius: 20px;
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 12px 28px rgba(31, 45, 92, .08);
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

  .favorite-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>