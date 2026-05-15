<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppLoading from '@/components/AppLoading.vue'
import { getCategoriesApi } from '@/api/category'
import { getItemsApi } from '@/api/item'

const route = useRoute()

const loading = ref(false)
const items = ref([])
const categoryList = ref([])
const page = ref(1)
const pageSize = 6

const query = reactive({
  keyword: '',
  type: 'all',
  category: 'all',
  location: 'all',
  status: 'all',
  hasPhoto: 'all'
})

const fallbackCategories = [
  { id: '校园卡', name: '校园卡' },
  { id: '钥匙', name: '钥匙' },
  { id: '电子产品', name: '电子产品' },
  { id: '书本文具', name: '书本文具' },
  { id: '生活用品', name: '生活用品' },
  { id: '贵重物品', name: '贵重物品' },
  { id: '其他', name: '其他' }
]

const locations = [
  '图书馆',
  '教学楼',
  '实验楼',
  '食堂',
  '宿舍区',
  '操场',
  '校门口',
  '其他'
]

const categories = computed(() => {
  return categoryList.value.length ? categoryList.value : fallbackCategories
})

const pagedItems = computed(() => {
  return items.value.slice((page.value - 1) * pageSize, page.value * pageSize)
})

function normalizeCategories(res) {
  const list = res?.data || res || []

  return list.map(item => {
    if (typeof item === 'string') {
      return {
        id: item,
        name: item
      }
    }

    return {
      id: item.id,
      name: item.name
    }
  })
}

function normalizeItems(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

function buildParams() {
  const params = {
    page: 1,
    page_size: 100
  }

  if (query.keyword) {
    params.keyword = query.keyword
  }

  if (query.type !== 'all') {
    params.type = query.type
  }

  if (query.category !== 'all') {
    const currentCategory = categories.value.find(item => String(item.id) === String(query.category) || item.name === query.category)

    if (currentCategory?.id && !Number.isNaN(Number(currentCategory.id))) {
      params.category_id = currentCategory.id
    } else {
      params.category = currentCategory?.name || query.category
    }
  }

  if (query.location !== 'all') {
    params.location = query.location
  }

  if (query.status !== 'all') {
    params.status = query.status
  }

  if (query.hasPhoto === 'with') {
    params.has_photo = 1
  }

  return params
}

async function loadCategories() {
  const res = await getCategoriesApi()
  categoryList.value = normalizeCategories(res)
}

async function load() {
  loading.value = true
  page.value = 1

  try {
    const res = await getItemsApi(buildParams())
    items.value = normalizeItems(res)
  } finally {
    loading.value = false
  }
}

function syncRoute() {
  query.keyword = route.query.keyword || ''
  query.category = route.query.category || 'all'
  query.type = route.query.type || 'all'
  query.location = route.query.location || 'all'
  query.status = route.query.status || 'all'
  query.hasPhoto = route.query.hasPhoto || 'all'

  load()
}

onMounted(async () => {
  await loadCategories()
  syncRoute()
})

watch(() => route.query, syncRoute)
</script>

<template>
  <div class="items-page container">
    <AppLoading :visible="loading" text="加载物品列表..." />

    <section class="page-head fade-up">
      <span class="kicker">失物招领大厅</span>

      <h1>用筛选和匹配，缩短找回路径。</h1>

      <p>已审核通过的信息会出现在大厅。列表切换带有平滑动效，搜索、分类、地点、状态都能组合筛选。</p>
    </section>

    <section class="filter-card glass-card fade-up">
      <el-input v-model="query.keyword" size="large" clearable placeholder="搜索物品名称、地点、描述关键词" @keyup.enter="load" />

      <el-select v-model="query.type" size="large" placeholder="类型" @change="load">
        <el-option label="全部类型" value="all" />
        <el-option label="失物" value="lost" />
        <el-option label="招领" value="found" />
      </el-select>

      <el-select v-model="query.category" size="large" placeholder="分类" @change="load">
        <el-option label="全部分类" value="all" />
        <el-option v-for="category in categories" :key="category.id || category.name" :label="category.name" :value="category.id || category.name" />
      </el-select>

      <el-select v-model="query.location" size="large" placeholder="地点" @change="load">
        <el-option label="全部地点" value="all" />
        <el-option v-for="location in locations" :key="location" :label="location" :value="location" />
      </el-select>

      <el-select v-model="query.status" size="large" placeholder="状态" @change="load">
        <el-option label="全部状态" value="all" />
        <el-option label="寻找中 / 待认领" value="open" />
        <el-option label="认领中" value="claiming" />
        <el-option label="已完成" value="completed" />
      </el-select>

      <el-select v-model="query.hasPhoto" size="large" placeholder="照片" @change="load">
        <el-option label="全部照片" value="all" />
        <el-option label="仅看有照片" value="with" />
      </el-select>

      <el-button type="primary" size="large" :loading="loading" @click="load">搜索</el-button>
    </section>

    <div class="result-bar">
      <b>共找到 {{ items.length }} 条信息</b>
      <span>当前排序：发布时间倒序</span>
    </div>

    <EmptyState v-if="!loading && !items.length" title="暂时没有匹配的信息" desc="换一个关键词，或者直接发布一条新的失物/招领信息。" button-text="去发布" @action="$router.push('/publish')" />

    <TransitionGroup v-else name="list" tag="section" class="item-grid">
      <ItemCard v-for="item in pagedItems" :key="item.id" :item="item" />
    </TransitionGroup>

    <div v-if="items.length > pageSize" class="pagination-bar">
      <el-pagination v-model:current-page="page" background layout="prev, pager, next" :page-size="pageSize" :total="items.length" />
    </div>
  </div>
</template>

<style scoped>
.items-page {
  padding-top: 42px;
}

.page-head {
  max-width: 820px;
  margin-bottom: 24px;
}

.page-head h1 {
  margin: 18px 0 12px;
  font-size: clamp(36px, 5vw, 58px);
  letter-spacing: -.065em;
  line-height: 1.02;
}

.page-head p {
  color: var(--muted);
  line-height: 1.8;
}

.filter-card {
  padding: 18px;
  display: grid;
  grid-template-columns: 1.5fr repeat(5, 1fr) 110px;
  gap: 12px;
}

.result-bar {
  margin: 22px 0;
  display: flex;
  justify-content: space-between;
  color: var(--muted);
}

.result-bar b {
  color: var(--ink);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 1050px) {
  .filter-card {
    grid-template-columns: repeat(2, 1fr);
  }

  .item-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .filter-card,
  .item-grid {
    grid-template-columns: 1fr;
  }

  .result-bar {
    flex-direction: column;
    gap: 6px;
  }
}
</style>