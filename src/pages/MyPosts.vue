<template>
  <div class="my-page container">
    <section class="section-title fade-up"><div><span class="kicker">我的协寻中心</span><h2>发布、认领、领错归还都在这里追踪</h2><p>真实上线时，用户需要看到每一次申请的审核状态和后续交接方式。</p></div></section>
    <section class="mini-stats"><StatCard label="我的发布" :value="items.length" icon="pin" tone="blue" /><StatCard label="我的申请" :value="claims.length" icon="user-check" tone="purple" /><StatCard label="已完成" :value="doneCount" icon="check" tone="green" /></section>

    <el-tabs v-model="activeTab" class="soft-tabs">
      <el-tab-pane label="我的发布" name="posts">
        <EmptyState v-if="!items.length" title="你还没有发布信息" desc="发布一条失物或招领信息后，会在这里跟踪状态。" button-text="立即发布" @action="$router.push('/publish')" />
        <section v-else class="post-list">
          <div v-for="item in items" :key="item.id" class="post-row glass-card">
            <div class="row-main"><b>{{ item.name }}</b><p>{{ item.description }}</p><div class="row-tags"><el-tag class="soft-tag" :class="item.type === 'lost' ? 'type-lost' : 'type-found'">{{ item.type === 'lost' ? '失物' : '招领' }}</el-tag><el-tag>{{ item.category }}</el-tag><el-tag :type="auditType(item.auditStatus)">{{ auditText(item.auditStatus) }}</el-tag><el-tag :type="item.status === 'done' ? 'success' : 'warning'">{{ item.status === 'done' ? '已完成' : '进行中' }}</el-tag></div></div>
            <div class="row-actions"><el-button @click="$router.push(`/items/${item.id}`)" :disabled="item.auditStatus !== 'approved'">查看</el-button><el-button type="success" :disabled="item.status === 'done'" @click="markDone(item)">标记完成</el-button><el-button type="danger" plain @click="remove(item)">删除</el-button></div>
          </div>
        </section>
      </el-tab-pane>
      <el-tab-pane label="我的认领/线索" name="claims">
        <EmptyState v-if="!claims.length" title="还没有认领申请" desc="在物品详情页点击我要认领或我有线索后，会在这里显示审核进度。" button-text="去失物大厅" @action="$router.push('/items')" />
        <section v-else class="post-list">
          <div v-for="claim in claims" :key="claim.id" class="post-row glass-card claim-row">
            <div class="row-main"><b>{{ claim.item?.name || '关联物品已删除' }}</b><p>{{ claim.proofText }}</p><div class="row-tags"><el-tag>{{ claimTypeText(claim.claimType) }}</el-tag><el-tag :type="claim.method === 'mail' ? 'warning' : 'success'">{{ claim.method === 'mail' ? '邮寄申请' : '线下领取' }}</el-tag><el-tag :type="claimStatusType(claim.status)">{{ claimStatusText(claim.status) }}</el-tag><el-tag>可信度 {{ claim.score }}%</el-tag></div></div>
            <div class="claim-extra"><span>提交时间：{{ claim.createdAt }}</span><span v-if="claim.deliveryAddress">收件地址：已加密，仅管理员可见</span></div>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { deleteItem, fetchMyClaims, fetchMyItems, updateItemStatus } from '@/api/lostFound'
import StatCard from '@/components/StatCard.vue'
import EmptyState from '@/components/EmptyState.vue'
const userStore = useUserStore(); const route = useRoute(); const items = ref([]); const claims = ref([]); const activeTab = ref(route.query.tab === 'claims' ? 'claims' : 'posts')
const doneCount = computed(() => items.value.filter(i=>i.status==='done').length + claims.value.filter(c=>c.status==='completed').length)
function auditText(s){ return s === 'approved' ? '已通过' : s === 'rejected' ? '已拒绝' : '待审核' } function auditType(s){ return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning' }
function claimTypeText(t){ return t === 'wrong_return' ? '领错归还' : t === 'tip' ? '线索提交' : '认领申请' }
function claimStatusText(s){ return ['approved','handover_pending'].includes(s) ? '待交接' : s === 'completed' ? '已完成' : s === 'rejected' ? '已拒绝' : s === 'wrong_return_pending' ? '归还待审核' : '待核验' } function claimStatusType(s){ return ['approved','handover_pending','completed'].includes(s) ? 'success' : s === 'rejected' ? 'danger' : 'warning' }
async function load(){ items.value = await fetchMyItems(userStore.user.id); claims.value = await fetchMyClaims(userStore.user.id) }
async function markDone(item){ await updateItemStatus(item.id,'done'); ElMessage.success('状态已更新'); load() }
async function remove(item){ await ElMessageBox.confirm(`确认删除「${item.name}」？`,'删除确认',{type:'warning'}); await deleteItem(item.id); ElMessage.success('已删除'); load() }
onMounted(load)
</script>
<style scoped>
.my-page{padding-top:42px}.section-title h2{font-size:clamp(30px,4vw,46px);letter-spacing:-.05em;}.mini-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}.soft-tabs{padding:20px;border-radius:30px;background:rgba(255,255,255,.62);box-shadow:var(--shadow)}.post-list{display:grid;gap:14px}.post-row{padding:20px;display:flex;align-items:center;justify-content:space-between;gap:20px}.row-main b{font-size:18px}.row-main p{margin:8px 0 12px;color:var(--muted);line-height:1.7}.row-tags{display:flex;flex-wrap:wrap;gap:8px}.row-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.claim-row{align-items:flex-start}.claim-extra{min-width:230px;color:var(--muted);display:grid;gap:8px;font-size:13px;line-height:1.7}@media(max-width:780px){.mini-stats{grid-template-columns:1fr}.post-row{align-items:flex-start;flex-direction:column}.row-actions{justify-content:flex-start}.claim-extra{min-width:0}}
</style>
