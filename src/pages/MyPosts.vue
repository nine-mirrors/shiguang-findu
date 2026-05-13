<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyItemsApi, updateItemStatusApi, deleteItemApi } from '@/api/item'
import { getMyClaimsApi } from '@/api/claim'
import StatCard from '@/components/StatCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()

const items = ref([])
const claims = ref([])
const loading = ref(false)
const activeTab = ref(route.query.tab === 'claims' ? 'claims' : 'posts')

const doneCount = computed(() => {
  const completedItems = items.value.filter(item => ['done', 'completed'].includes(item.status)).length
  const completedClaims = claims.value.filter(claim => claim.status === 'completed').length

  return completedItems + completedClaims
})

const normalizeList = res => {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const getCategoryName = item => {
  if (typeof item.category === 'string') return item.category
  if (item.category?.name) return item.category.name

  return item.category_name || '其他'
}

const getItemStatus = item => item.status || 'open'
const getAuditStatus = item => item.auditStatus || item.audit_status || 'pending'

const getClaimItem = claim => claim.item || claim.lost_found_item || claim.lostFoundItem || null
const getClaimType = claim => claim.claimType || claim.claim_type || 'claim'
const getClaimMethod = claim => claim.method || claim.pickup_method || 'offline'
const getClaimProofText = claim => claim.proofText || claim.proof_text || ''
const getClaimScore = claim => claim.score || claim.match_score || 0
const getClaimCreatedAt = claim => claim.createdAt || claim.created_at || '时间待补充'
const getClaimDeliveryAddress = claim => claim.deliveryAddress || claim.delivery_address || ''

const auditText = status => {
  if (status === 'approved') return '已通过'
  if (status === 'rejected') return '已拒绝'

  return '待审核'
}

const auditType = status => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'

  return 'warning'
}

const itemStatusText = status => {
  if (['done', 'completed'].includes(status)) return '已完成'
  if (status === 'claiming') return '认领中'
  if (status === 'closed') return '已关闭'

  return '进行中'
}

const itemStatusType = status => ['done', 'completed'].includes(status) ? 'success' : 'warning'

const claimTypeText = type => {
  if (type === 'wrong_return') return '领错归还'
  if (type === 'clue') return '线索提交'

  return '认领申请'
}

const claimMethodText = method => method === 'delivery' ? '邮寄申请' : '线下领取'
const claimMethodType = method => method === 'delivery' ? 'warning' : 'success'

const claimStatusText = status => {
  if (['approved', 'handover_pending'].includes(status)) return '待交接'
  if (status === 'completed') return '已完成'
  if (status === 'rejected') return '已拒绝'
  if (status === 'wrong_return_pending') return '归还待审核'

  return '待核验'
}

const claimStatusType = status => {
  if (['approved', 'handover_pending', 'completed'].includes(status)) return 'success'
  if (status === 'rejected') return 'danger'

  return 'warning'
}

const load = async () => {
  loading.value = true

  try {
    const [itemRes, claimRes] = await Promise.all([
      getMyItemsApi(),
      getMyClaimsApi()
    ])

    items.value = normalizeList(itemRes)
    claims.value = normalizeList(claimRes)
  } finally {
    loading.value = false
  }
}

const markDone = async item => {
  await updateItemStatusApi(item.id, {
    status: 'completed'
  })

  ElMessage.success('状态已更新')
  await load()
}

const remove = async item => {
  await ElMessageBox.confirm(`确认删除「${item.name}」？`, '删除确认', {
    type: 'warning'
  })

  await deleteItemApi(item.id)

  ElMessage.success('已删除')
  await load()
}

onMounted(load)

watch(() => route.query.tab, value => {
  activeTab.value = value === 'claims' ? 'claims' : 'posts'
})
</script>

<template>
  <div class="my-page container">
    <section class="section-title fade-up">
      <div>
        <span class="kicker">我的协寻中心</span>

        <h2>发布、认领、领错归还都在这里追踪</h2>

        <p>真实上线时，用户需要看到每一次申请的审核状态和后续交接方式。</p>
      </div>
    </section>

    <section class="mini-stats">
      <StatCard label="我的发布" :value="items.length" icon="pin" tone="blue" />
      <StatCard label="我的申请" :value="claims.length" icon="user-check" tone="purple" />
      <StatCard label="已完成" :value="doneCount" icon="check" tone="green" />
    </section>

    <el-tabs v-model="activeTab" class="soft-tabs">
      <el-tab-pane label="我的发布" name="posts">
        <EmptyState v-if="!loading && !items.length" title="你还没有发布信息" desc="发布一条失物或招领信息后，会在这里跟踪状态。" button-text="立即发布" @action="$router.push('/publish')" />

        <section v-else class="post-list">
          <div v-for="item in items" :key="item.id" class="post-row glass-card">
            <div class="row-main">
              <b>{{ item.name }}</b>

              <p>{{ item.description }}</p>

              <div class="row-tags">
                <el-tag class="soft-tag" :class="item.type === 'lost' ? 'type-lost' : 'type-found'">{{ item.type === 'lost' ? '失物' : '招领' }}</el-tag>
                <el-tag>{{ getCategoryName(item) }}</el-tag>
                <el-tag :type="auditType(getAuditStatus(item))">{{ auditText(getAuditStatus(item)) }}</el-tag>
                <el-tag :type="itemStatusType(getItemStatus(item))">{{ itemStatusText(getItemStatus(item)) }}</el-tag>
              </div>
            </div>

            <div class="row-actions">
              <el-button :disabled="getAuditStatus(item) !== 'approved'" @click="$router.push(`/items/${item.id}`)">查看</el-button>
              <el-button type="success" :disabled="['done', 'completed'].includes(getItemStatus(item))" @click="markDone(item)">标记完成</el-button>
              <el-button type="danger" plain @click="remove(item)">删除</el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="我的认领/线索" name="claims">
        <EmptyState v-if="!loading && !claims.length" title="还没有认领申请" desc="在物品详情页点击我要认领或我有线索后，会在这里显示审核进度。" button-text="去失物大厅" @action="$router.push('/items')" />

        <section v-else class="post-list">
          <div v-for="claim in claims" :key="claim.id" class="post-row glass-card claim-row">
            <div class="row-main">
              <b>{{ getClaimItem(claim)?.name || '关联物品已删除' }}</b>

              <p>{{ getClaimProofText(claim) }}</p>

              <div class="row-tags">
                <el-tag>{{ claimTypeText(getClaimType(claim)) }}</el-tag>
                <el-tag :type="claimMethodType(getClaimMethod(claim))">{{ claimMethodText(getClaimMethod(claim)) }}</el-tag>
                <el-tag :type="claimStatusType(claim.status)">{{ claimStatusText(claim.status) }}</el-tag>
                <el-tag>匹配度 {{ getClaimScore(claim) }}%</el-tag>
              </div>
            </div>

            <div class="claim-extra">
              <span>提交时间：{{ getClaimCreatedAt(claim) }}</span>
              <span v-if="getClaimDeliveryAddress(claim)">收件地址：已加密，仅管理员可见</span>
            </div>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.my-page {
  padding-top: 42px;
}

.section-title h2 {
  font-size: clamp(30px, 4vw, 46px);
  letter-spacing: -.05em;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.soft-tabs {
  padding: 20px;
  border-radius: 30px;
  background: rgba(255, 255, 255, .62);
  box-shadow: var(--shadow);
}

.post-list {
  display: grid;
  gap: 14px;
}

.post-row {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.row-main b {
  font-size: 18px;
}

.row-main p {
  margin: 8px 0 12px;
  color: var(--muted);
  line-height: 1.7;
}

.row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.claim-row {
  align-items: flex-start;
}

.claim-extra {
  min-width: 230px;
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 780px) {
  .mini-stats {
    grid-template-columns: 1fr;
  }

  .post-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .row-actions {
    justify-content: flex-start;
  }

  .claim-extra {
    min-width: 0;
  }
}
</style>