<template>
  <div class="home-page">
    <section class="hero container">
      <div class="hero-copy fade-up">
        <span class="kicker">拾光 FindU 智能协寻中心</span>
        <h1>把“找东西”从群消息里救出来。</h1>
        <p>面向校园真实场景的失物招领平台：统一发布、智能匹配、状态追踪、审核管理，让每一条协寻信息都有清晰去向。</p>
        <div class="search-box">
          <el-input v-model="keyword" size="large" placeholder="搜索耳机、校园卡、钥匙、图书馆等" @keyup.enter="goSearch" />
          <el-button type="primary" size="large" @click="goSearch">立即查找</el-button>
        </div>
        <div class="hero-actions"><el-button type="primary" size="large" @click="$router.push('/publish')">发布失物/招领</el-button><el-button size="large" @click="$router.push('/items')">进入失物大厅</el-button></div>
      </div>
      <div class="hero-panel float-slow">
        <div class="phone-card">
          <div class="phone-top"><span></span><b>智能匹配提醒</b></div>
          <div class="match-item"><strong>黑色无线耳机</strong><em>匹配度 92%</em><p>分类一致 · 地点相同 · 关键词相似</p></div>
          <div class="match-item soft"><strong>耳机充电盒</strong><em>匹配度 81%</em><p>图书馆三楼 · 时间接近</p></div>
        </div>
      </div>
    </section>

    <section class="container stats-grid">
      <StatCard label="平台协寻信息" :value="dashboard.total" icon="pin" tone="blue" :delay="0" />
      <StatCard label="已帮助找回" :value="dashboard.done" icon="check" tone="green" :delay="90" />
      <StatCard label="待审核信息" :value="dashboard.pending" icon="shield" tone="purple" :delay="180" />
      <StatCard label="本周高频地点" :value="dashboard.locations?.[0]?.value || 0" :suffix="' 条'" icon="route" tone="orange" :delay="270" />
    </section>

    <section class="container categories-section">
      <div class="section-title"><div><h2>按分类快速进入</h2><p>减少无效搜索，让用户用最短路径找到相关信息。</p></div></div>
      <div class="category-grid">
        <button v-for="cat in categories" :key="cat" @click="$router.push({ path: '/items', query: { category: cat } })">
          <LineIcon :name="iconMap[cat] || 'package'" :tone="toneMap[cat] || 'blue'" /><b>{{ cat }}</b><small>{{ countByCategory(cat) }} 条信息</small>
        </button>
      </div>
    </section>

    <section class="container latest-section">
      <div class="section-title">
        <div><h2>最新协寻动态</h2><p>只展示已审核信息，保证前台信息质量。</p></div>
        <el-button @click="$router.push('/items')">查看全部</el-button>
      </div>
      <TransitionGroup name="list" tag="div" class="item-grid">
        <ItemCard v-for="item in latest" :key="item.id" :item="item" />
      </TransitionGroup>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/StatCard.vue'
import ItemCard from '@/components/ItemCard.vue'
import LineIcon from '@/components/LineIcon.vue'
import { categories, fetchDashboard, fetchItems } from '@/api/lostFound'
const router = useRouter(); const keyword = ref(''); const dashboard = ref({ total:0, done:0, pending:0, locations:[], categories:[] }); const items = ref([])
const iconMap = { '校园卡': 'file', '钥匙': 'lock', '电子产品': 'camera', '书本文具': 'file', '生活用品': 'package', '贵重物品': 'shield', '其他': 'spark' }
const toneMap = { '校园卡': 'blue', '钥匙': 'orange', '电子产品': 'purple', '书本文具': 'green', '生活用品': 'ink', '贵重物品': 'red', '其他': 'blue' }
const latest = computed(() => items.value.slice(0, 6))
function countByCategory(cat){ return dashboard.value.categories?.find(i => i.name === cat)?.value || 0 }
function goSearch(){ router.push({ path: '/items', query: keyword.value ? { keyword: keyword.value } : {} }) }
onMounted(async()=>{ dashboard.value = await fetchDashboard(); items.value = await fetchItems() })
</script>
<style scoped>
.home-page { padding-top: 38px; }
.hero { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr); gap: 38px; align-items: center; min-height: 540px; }
.hero-copy h1 { margin: 24px 0 18px; font-size: clamp(42px, 6vw, 78px); line-height: .96; letter-spacing: -.075em; max-width: 760px; }
.hero-copy p { max-width: 660px; color: #4b5563; line-height: 1.9; font-size: 17px; }
.search-box { display: grid; grid-template-columns: 1fr 120px; gap: 12px; max-width: 620px; padding: 10px; margin: 28px 0 18px; border-radius: 24px; background: rgba(255,255,255,.82); box-shadow: 0 20px 50px rgba(31,45,92,.12); }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-panel { min-height: 420px; border-radius: 42px; padding: 28px; background: radial-gradient(circle at top left, rgba(255,255,255,.80), transparent 18rem), linear-gradient(135deg, rgba(79,124,255,.25), rgba(0,184,148,.14)); box-shadow: 0 34px 90px rgba(31,45,92,.18); display: grid; place-items: center; }
.phone-card { width: min(390px, 100%); padding: 22px; border-radius: 34px; background: rgba(255,255,255,.78); backdrop-filter: blur(18px); box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 24px 70px rgba(31,45,92,.18); }
.phone-top { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }.phone-top span { width: 12px; height: 12px; border-radius: 999px; background: var(--success); box-shadow: 0 0 0 7px rgba(0,184,148,.12); }
.match-item { padding: 18px; border-radius: 24px; background: white; margin-bottom: 12px; border: 1px solid rgba(79,124,255,.12); }.match-item strong { display: block; }.match-item em { display: inline-block; margin: 8px 0; color: #7c3aed; font-style: normal; font-weight: 900; }.match-item p { margin: 0; color: var(--muted); }.match-item.soft { opacity: .78; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 12px; }
.categories-section, .latest-section { margin-top: 58px; }
.category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(138px, 1fr)); gap: 14px; }
.category-grid button { cursor: pointer; border: 1px solid rgba(255,255,255,.78); border-radius: 26px; background: rgba(255,255,255,.74); padding: 22px 14px; display: grid; gap: 7px; justify-items: center; box-shadow: 0 18px 42px rgba(31,45,92,.08); transition: .28s ease; }
.category-grid button:hover { transform: translateY(-7px); box-shadow: 0 28px 60px rgba(31,45,92,.14); }
.category-grid small { color: var(--muted); }
.item-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media(max-width:980px){.hero{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}.category-grid{grid-template-columns:repeat(3,1fr)}.item-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.search-box{grid-template-columns:1fr}.stats-grid,.category-grid,.item-grid{grid-template-columns:1fr}.hero-copy h1{font-size:42px}}
</style>
