<template>
  <div class="favorites-page container">
    <section class="page-title fade-up"><span class="kicker">收藏夹</span><h1>保存感兴趣的失物 / 招领信息。</h1><p>用于后续查看和状态跟踪，收藏信息发生状态变化时可进入通知中心提醒。</p></section>
    <TransitionGroup v-if="items.length" name="list" tag="section" class="item-grid">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
    </TransitionGroup>
    <EmptyState v-else title="暂无收藏" desc="在物品详情页点击收藏后，会在这里集中展示。" action-text="去失物大厅看看" @action="$router.push('/items')" />
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { fetchFavorites } from '@/api/lostFound'
import { useUserStore } from '@/stores/user'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
const userStore = useUserStore(); const items = ref([])
onMounted(async()=>{ items.value = await fetchFavorites(userStore.user?.id) })
</script>
<style scoped>.favorites-page{padding-top:42px}.page-title h1{font-size:clamp(36px,5vw,56px);line-height:1.02;letter-spacing:-.06em;margin:18px 0 12px}.page-title p{color:var(--muted)}.item-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:26px}@media(max-width:920px){.item-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.item-grid{grid-template-columns:1fr}}</style>
