<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/StatCard.vue'
import ItemCard from '@/components/ItemCard.vue'
import LineIcon from '@/components/LineIcon.vue'
import { getCategoriesApi } from '@/api/category'
import { getItemsApi } from '@/api/item'

const router = useRouter()

const keyword = ref('')
const items = ref([])
const categoryList = ref([])

const dashboard = ref({
  total: 0,
  done: 0,
  pending: 0,
  locations: [],
  categories: []
})

function normalizeItems(res) {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const fallbackCategories = [
  { id: 'campus-card', name: '校园卡', icon: 'file' },
  { id: 'key', name: '钥匙', icon: 'lock' },
  { id: 'digital', name: '电子产品', icon: 'camera' },
  { id: 'book', name: '书本文具', icon: 'file' },
  { id: 'daily', name: '生活用品', icon: 'package' },
  { id: 'valuable', name: '贵重物品', icon: 'shield' },
  { id: 'other', name: '其他', icon: 'spark' }
]

const toneMap = {
  校园卡: 'blue',
  钥匙: 'orange',
  电子产品: 'purple',
  书本文具: 'green',
  生活用品: 'ink',
  贵重物品: 'red',
  其他: 'blue'
}

const latest = computed(() => items.value.slice(0, 6))

const categories = computed(() => {
  return categoryList.value.length ? categoryList.value : fallbackCategories
})

function normalizeCategories(res) {
  const list = res?.data || res || []

  return list.map(item => {
    if (typeof item === 'string') {
      return {
        id: item,
        name: item,
        icon: ''
      }
    }

    return {
      id: item.id,
      name: item.name,
      icon: item.icon || ''
    }
  })
}

function countByCategory(categoryName) {
  return dashboard.value.categories?.find(item => item.name === categoryName)?.value || 0
}

function goSearch() {
  router.push({
    path: '/items',
    query: keyword.value ? { keyword: keyword.value } : {}
  })
}

function goCategory(category) {
  router.push({
    path: '/items',
    query: {
      category: category.name
    }
  })
}

async function loadCategories() {
  try {
    const res = await getCategoriesApi()
    categoryList.value = normalizeCategories(res)
  } catch {
    categoryList.value = []
  }
}

async function loadHomeData() {
  const res = await getItemsApi({
    page: 1,
    page_size: 6
  })

  items.value = normalizeItems(res)
  dashboard.value = buildDashboard(items.value)
}

const buildDashboard = list => {
  const approvedItems = list.filter(item => {
    const auditStatus = item.auditStatus || item.audit_status || 'approved'

    return auditStatus === 'approved'
  })

  const done = approvedItems.filter(item => ['done', 'completed'].includes(item.status)).length
  const pending = list.filter(item => (item.auditStatus || item.audit_status) === 'pending').length

  const locationMap = approvedItems.reduce((map, item) => {
    const location = item.location || '未知地点'

    map[location] = (map[location] || 0) + 1

    return map
  }, {})

  const categoryMap = approvedItems.reduce((map, item) => {
    const category = typeof item.category === 'string'
      ? item.category
      : item.category?.name || item.category_name || '其他'

    map[category] = (map[category] || 0) + 1

    return map
  }, {})

  return {
    total: approvedItems.length,
    done,
    pending,
    locations: Object.entries(locationMap).map(([name, value]) => ({ name, value })),
    categories: Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  }
}

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadHomeData()
  ])
})
</script>

<template>
  <div class="home-page">
    <section class="hero container">
      <div class="hero-copy fade-up">
        <span class="kicker">拾光 FindU · 校园智能失物协寻平台</span>

        <h1>拾起遗失之物，找回校园微光。</h1>

        <p>从发布、审核、匹配到认领交接，拾光 FindU 让校园失物信息不再淹没于群聊，让真正的失主更快找到线索，也让每一次归还都有流程和记录。</p>

        <div class="search-box">
          <el-input v-model="keyword" size="large" placeholder="搜索耳机、校园卡、钥匙、图书馆等" @keyup.enter="goSearch" />
          <el-button type="primary" size="large" @click="goSearch">立即查找</el-button>
        </div>

        <div class="hero-actions">
          <el-button type="primary" size="large" @click="$router.push('/publish')">发布失物/招领</el-button>
          <el-button size="large" @click="$router.push('/items')">进入失物大厅</el-button>
        </div>
      </div>

      <div class="hero-panel float-slow">
        <div class="phone-card">
          <div class="phone-top">
            <span></span>
            <b>拾光线索提醒</b>
          </div>

          <div class="match-item">
            <strong>黑色无线耳机</strong>
            <em>匹配度 92%</em>
            <p>分类一致 · 地点相同 · 关键词相似</p>
          </div>

          <div class="match-item soft">
            <strong>耳机充电盒</strong>
            <em>匹配度 81%</em>
            <p>图书馆三楼 · 时间接近</p>
          </div>
        </div>
      </div>
    </section>

    <section class="container stats-grid">
      <StatCard label="平台协寻信息" :value="dashboard.total" icon="pin" tone="blue" :delay="0" />
      <StatCard label="已帮助找回" :value="dashboard.done" icon="check" tone="green" :delay="90" />
      <StatCard label="待审核信息" :value="dashboard.pending" icon="shield" tone="purple" :delay="180" />
      <StatCard label="本周高频地点" :value="dashboard.locations?.[0]?.value || 0" suffix=" 条" icon="route" tone="orange" :delay="270" />
    </section>

    <section class="container categories-section">
      <div class="section-title">
        <div>
          <h2>按分类快速进入</h2>
          <p>减少无效搜索，让用户用最短路径找到相关信息。</p>
        </div>
      </div>

      <div class="category-grid">
        <button v-for="category in categories" :key="category.id || category.name" @click="goCategory(category)">
          <LineIcon :name="category.icon || fallbackCategories.find(item => item.name === category.name)?.icon || 'package'" :tone="toneMap[category.name] || 'blue'" />
          <b>{{ category.name }}</b>
          <small>{{ countByCategory(category.name) }} 条信息</small>
        </button>
      </div>
    </section>

    <section class="container latest-section">
      <div class="section-title">
        <div>
          <h2>最新协寻动态</h2>
          <p>只展示已审核信息，保证前台信息质量。</p>
        </div>

        <el-button @click="$router.push('/items')">查看全部</el-button>
      </div>

      <TransitionGroup name="list" tag="div" class="item-grid">
        <ItemCard v-for="item in latest" :key="item.id" :item="item" />
      </TransitionGroup>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  padding-top: 38px;
  position: relative;
  overflow: hidden;
}

.home-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(79, 124, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(0, 184, 148, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 70%),
    linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%);
  pointer-events: none;
  z-index: 0;
}

.home-page::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(79, 124, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 124, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

.home-page > * {
  position: relative;
  z-index: 1;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr);
  gap: 38px;
  align-items: center;
  min-height: 540px;
  padding: 40px 0;
}

.hero-copy {
  animation: slideUp 0.8s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-copy h1 {
  margin: 24px 0 18px;
  font-size: clamp(42px, 6vw, 78px);
  line-height: .96;
  letter-spacing: -.075em;
  max-width: 760px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-copy p {
  max-width: 660px;
  color: #4b5563;
  line-height: 1.9;
  font-size: 17px;
}

.search-box {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
  max-width: 620px;
  padding: 10px;
  margin: 28px 0 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 60px rgba(31, 45, 92, 0.15);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.search-box:hover {
  box-shadow: 0 24px 80px rgba(31, 45, 92, 0.2);
  transform: translateY(-2px);
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-panel {
  min-height: 420px;
  display: grid;
  place-items: center;
  padding: 28px;
  border-radius: 42px;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), transparent 18rem), linear-gradient(135deg, rgba(79, 124, 255, 0.2), rgba(0, 184, 148, 0.12));
  box-shadow: 0 34px 90px rgba(31, 45, 92, 0.15);
  animation: floatUp 0.8s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes floatUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes floatSlow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.float-slow {
  animation: floatSlow 6s ease-in-out infinite;
}

.phone-card {
  width: min(390px, 100%);
  padding: 22px;
  border-radius: 34px;
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(18px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8), 0 24px 70px rgba(31, 45, 92, .18);
}

.phone-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.phone-top span {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--success);
  box-shadow: 0 0 0 7px rgba(0, 184, 148, .12);
}

.match-item {
  padding: 18px;
  margin-bottom: 12px;
  border-radius: 24px;
  background: white;
  border: 1px solid rgba(79, 124, 255, .12);
}

.match-item strong {
  display: block;
}

.match-item em {
  display: inline-block;
  margin: 8px 0;
  color: #7c3aed;
  font-style: normal;
  font-weight: 900;
}

.match-item p {
  margin: 0;
  color: var(--muted);
}

.match-item.soft {
  opacity: .78;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 12px;
}

.categories-section,
.latest-section {
  margin-top: 58px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
  gap: 14px;
}

.category-grid button {
  display: grid;
  justify-items: center;
  gap: 7px;
  padding: 22px 14px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .78);
  border-radius: 26px;
  background: rgba(255, 255, 255, .74);
  box-shadow: 0 18px 42px rgba(31, 45, 92, .08);
  transition: .28s ease;
}

.category-grid button:hover {
  transform: translateY(-7px);
  box-shadow: 0 28px 60px rgba(31, 45, 92, .14);
}

.category-grid small {
  color: var(--muted);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    display: none;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .item-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .home-page {
    padding-top: 20px;
  }

  .hero {
    min-height: auto;
    padding: 20px 0;
  }

  .hero-copy h1 {
    font-size: 36px;
    margin: 16px 0 12px;
  }

  .hero-copy p {
    font-size: 15px;
    line-height: 1.8;
  }

  .search-box {
    grid-template-columns: 1fr;
    padding: 8px;
    margin: 20px 0 14px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-actions .el-button {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .categories-section,
  .latest-section {
    margin-top: 32px;
  }

  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .category-grid button {
    padding: 16px 10px;
    min-height: 90px;
  }

  .category-grid button b {
    font-size: 13px;
  }

  .category-grid small {
    font-size: 11px;
  }

  .item-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-title .el-button {
    width: 100%;
  }
}
</style>