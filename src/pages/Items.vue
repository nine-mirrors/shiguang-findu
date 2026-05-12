<template>
  <div class="items-page container">
    <section class="page-head fade-up">
      <span class="kicker">失物招领大厅</span>
      <h1>用筛选和匹配，缩短找回路径。</h1>
      <p>已审核通过的信息会出现在大厅。列表切换带有平滑动效，搜索、分类、地点、状态都能组合筛选。</p>
    </section>

    <section class="filter-card glass-card fade-up">
      <el-input v-model="query.keyword" size="large" clearable placeholder="搜索物品名称、地点、描述关键词" @keyup.enter="load" />
      <el-select v-model="query.type" size="large" placeholder="类型" @change="load"><el-option label="全部类型" value="all" /><el-option label="失物" value="lost" /><el-option label="招领" value="found" /></el-select>
      <el-select v-model="query.category" size="large" placeholder="分类" @change="load"><el-option label="全部分类" value="all" /><el-option v-for="c in categories" :key="c" :label="c" :value="c" /></el-select>
      <el-select v-model="query.location" size="large" placeholder="地点" @change="load"><el-option label="全部地点" value="all" /><el-option v-for="l in locations" :key="l" :label="l" :value="l" /></el-select>
      <el-select v-model="query.status" size="large" placeholder="状态" @change="load"><el-option label="全部状态" value="all" /><el-option label="进行中" value="open" /><el-option label="已完成" value="done" /></el-select>
      <el-select v-model="query.hasPhoto" size="large" placeholder="照片" @change="load"><el-option label="全部照片" value="all" /><el-option label="仅看有照片" value="with" /></el-select>
      <el-button type="primary" size="large" @click="load">搜索</el-button>
    </section>

    <div class="result-bar">
      <b>共找到 {{ items.length }} 条信息</b>
      <span>当前排序：发布时间倒序</span>
    </div>

    <EmptyState v-if="!loading && !items.length" title="暂时没有匹配的信息" desc="换一个关键词，或者直接发布一条新的失物/招领信息。" button-text="去发布" @action="$router.push('/publish')" />
    <TransitionGroup v-else name="list" tag="section" class="item-grid">
      <ItemCard v-for="item in pagedItems" :key="item.id" :item="item" />
    </TransitionGroup>
    <div v-if="items.length > pageSize" class="pagination-bar"><el-pagination v-model:current-page="page" background layout="prev, pager, next" :page-size="pageSize" :total="items.length" /></div>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { categories, locations, fetchItems } from '@/api/lostFound'
const route = useRoute(); const loading = ref(false); const items = ref([]); const page = ref(1); const pageSize = 6
const query = reactive({ keyword: '', type: 'all', category: 'all', location: 'all', status: 'all', hasPhoto: 'all' })
const pagedItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))
async function load(){ loading.value = true; page.value = 1; items.value = await fetchItems(query); loading.value = false }
function syncRoute(){ query.keyword = route.query.keyword || ''; query.category = route.query.category || 'all'; query.hasPhoto = route.query.hasPhoto || 'all'; load() }
onMounted(syncRoute)
watch(() => route.query, syncRoute)
</script>
<style scoped>
.items-page { padding-top: 42px; }
.page-head { max-width: 820px; margin-bottom: 24px; }.page-head h1 { margin: 18px 0 12px; font-size: clamp(36px,5vw,58px); letter-spacing: -.065em; line-height: 1.02; }.page-head p { color: var(--muted); line-height: 1.8; }
.filter-card { padding: 18px; display: grid; grid-template-columns: 1.5fr repeat(5, 1fr) 110px; gap: 12px; }
.result-bar { margin: 22px 0; display: flex; justify-content: space-between; color: var(--muted); }.result-bar b { color: var(--ink); }
.item-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }.pagination-bar { display: flex; justify-content: center; margin-top: 28px; }
@media(max-width:1050px){.filter-card{grid-template-columns:repeat(2,1fr)}.item-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.filter-card,.item-grid{grid-template-columns:1fr}.result-bar{flex-direction:column;gap:6px}}
</style>
