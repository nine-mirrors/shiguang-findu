<template>
  <div class="detail-page container" v-if="item">
    <section class="detail-hero fade-up">
      <div class="detail-visual" :class="item.type">
        <img v-if="item.image" :src="item.image" alt="物品照片" />
        <div v-else class="fallback-large"><span>{{ item.category }}</span></div>
      </div>
      <div class="detail-copy">
        <div class="tag-line"><el-tag class="soft-tag" :class="item.type === 'lost' ? 'type-lost' : 'type-found'">{{ item.type === 'lost' ? '失物信息' : '招领信息' }}</el-tag><el-tag class="soft-tag">{{ item.category }}</el-tag><el-tag class="soft-tag">{{ item.image ? '有照片' : '暂无照片' }}</el-tag></div>
        <h1>{{ item.name }}</h1>
        <p>{{ item.description }}</p>
        <div class="info-grid"><div><b>地点</b><span>{{ item.location }}</span></div><div><b>时间</b><span>{{ item.happenTime }}</span></div><div><b>联系方式</b><span>{{ maskedContact }}</span></div><div><b>当前状态</b><span>{{ statusText }}</span></div></div>
        <div class="detail-actions"><el-button type="primary" size="large" @click="$router.push(`/items/${item.id}/claim`)">{{ item.type === 'found' ? '我要认领' : '我有线索' }}</el-button><el-button size="large" @click="toggleFav">{{ favorite ? '取消收藏' : '收藏' }}</el-button><el-button size="large" @click="$router.push('/guide')">查看用户须知</el-button></div>
      </div>
    </section>

    <section class="detail-grid">
      <div class="glass-card panel"><h2>状态追踪</h2><StatusTimeline :item="item" /></div>
      <div class="glass-card panel"><h2>保管与滞留规则</h2><RetentionBadge :item="item" /><ul class="safety"><li>招领物品进入保管期，临近到期时管理员优先提醒或集中处理。</li><li>超过保管期仍无人认领，可按校内规则移交服务台、学院办公室、保卫处，或进入捐赠/公益处理流程。</li><li>贵重物品、证件、银行卡、U盘等应走人工核验和线下交接，不建议公开敏感信息。</li></ul></div>
    </section>

    <section class="claim-section"><ClaimComparePanel :item="item" /></section>

    <section class="similar-section" v-if="similar.length">
      <div class="section-title"><div><h2>系统为你找到的相似信息</h2><p>基于分类、地点、时间和描述关键词进行本地匹配模拟。</p></div></div>
      <TransitionGroup name="list" tag="div" class="item-grid"><ItemCard v-for="s in similar" :key="s.id" :item="s" /></TransitionGroup>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchAllItems, fetchItemDetail, isFavorite, toggleFavorite } from '@/api/lostFound'
import { findSimilarItems } from '@/utils/match'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import StatusTimeline from '@/components/StatusTimeline.vue'
import ItemCard from '@/components/ItemCard.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'
import ClaimComparePanel from '@/components/ClaimComparePanel.vue'
const route = useRoute(); const item = ref(null); const similar = ref([]); const favorite = ref(false); const userStore = useUserStore()
const statusText = computed(() => item.value?.status === 'done' ? (item.value.type === 'lost' ? '已找回' : '已认领') : (item.value?.type === 'lost' ? '寻找中' : '待认领'))
const maskedContact = computed(() => {
  const text = String(item.value?.contact || '')
  return text.replace(/(\d{3})\d{4}(\d{4})/g, '$1****$2').replace(/([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g, '$1***$2')
})
async function load(){ item.value = await fetchItemDetail(route.params.id); similar.value = findSimilarItems(item.value, await fetchAllItems(), 3); favorite.value = userStore.isLogin ? await isFavorite(userStore.user.id, item.value.id) : false }
async function toggleFav(){ if(!userStore.isLogin){ ElMessage.warning('请先登录后再收藏'); return } favorite.value = await toggleFavorite(userStore.user.id, item.value.id); ElMessage.success(favorite.value ? '已加入收藏夹' : '已取消收藏') }
onMounted(load); watch(() => route.params.id, load)
</script>
<style scoped>
.detail-page { padding-top: 42px; }.detail-hero { display: grid; grid-template-columns: 420px 1fr; gap: 30px; align-items: stretch; }.detail-visual { min-height: 420px; border-radius: 38px; display: grid; place-items: center; overflow:hidden; background: linear-gradient(135deg, rgba(79,124,255,.24), rgba(108,99,255,.13)); box-shadow: var(--shadow); }.detail-visual.found { background: linear-gradient(135deg, rgba(0,184,148,.22), rgba(79,124,255,.12)); }.detail-visual img{width:100%;height:100%;object-fit:contain;background:linear-gradient(135deg,#f8fbff,#eef4ff);}.fallback-large{width:180px;height:180px;border-radius:52px;background:rgba(255,255,255,.7);display:grid;place-items:center;font-weight:900;color:var(--primary-strong);font-size:28px;animation:floatSlow 5s infinite;}
.detail-copy { padding: 36px; border-radius: 38px; background: rgba(255,255,255,.78); box-shadow: var(--shadow); }.tag-line { display: flex; flex-wrap:wrap; gap: 8px; }.detail-copy h1 { margin: 22px 0 14px; font-size: clamp(34px, 5vw, 58px); letter-spacing: -.06em; }.detail-copy p { color: var(--muted); line-height: 1.9; font-size: 16px; }.info-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-top: 24px; }.info-grid div { padding: 16px; border-radius: 20px; background: rgba(79,124,255,.06); }.info-grid b { display:block; margin-bottom: 7px; }.info-grid span { color: var(--muted); }.detail-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
.detail-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 22px; margin-top: 26px; }.panel { padding: 28px; }.panel h2 { margin-top: 0; }.safety { padding-left: 20px; color: var(--muted); line-height: 1.9; }.claim-section{margin-top:26px;}.similar-section { margin-top: 54px; }.item-grid { display: grid; grid-template-columns: repeat(3,1fr); gap:20px; }
@media(max-width:900px){.detail-hero,.detail-grid{grid-template-columns:1fr}.item-grid{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}.detail-visual{min-height:260px}}
</style>
