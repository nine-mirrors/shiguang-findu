<script setup>
import { onMounted, ref } from 'vue'
import { getFavoritesApi } from '@/api/favorite'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const items = ref([])
const loading = ref(false)

function normalizeFavorites(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

function normalizeFavoriteItems(list) {
  return list.map(item => {
    return item.item || item.lost_found_item || item
  })
}

async function loadFavorites() {
  loading.value = true

  try {
    const res = await getFavoritesApi()
    const list = normalizeFavorites(res)

    items.value = normalizeFavoriteItems(list)
  } finally {
    loading.value = false
  }
}

onMounted(loadFavorites)
</script>

<template>
  <div class="favorites-page container">
    <section class="page-title fade-up">
      <span class="kicker">收藏夹</span>

      <h1>保存感兴趣的失物 / 招领信息。</h1>

      <p>用于后续查看和状态跟踪，收藏信息发生状态变化时可进入通知中心提醒。</p>
    </section>

    <TransitionGroup v-if="items.length" name="list" tag="section" class="item-grid">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
    </TransitionGroup>

    <EmptyState v-else-if="!loading" title="暂无收藏" desc="在物品详情页点击收藏后，会在这里集中展示。" button-text="去失物大厅看看" @action="$router.push('/items')" />
  </div>
</template>

<style scoped>
.favorites-page {
  padding-top: 42px;
}

.page-title h1 {
  font-size: clamp(36px, 5vw, 56px);
  line-height: 1.02;
  letter-spacing: -.06em;
  margin: 18px 0 12px;
}

.page-title p {
  color: var(--muted);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 26px;
}

@media (max-width: 920px) {
  .item-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .item-grid {
    grid-template-columns: 1fr;
  }
}
</style>