<script setup>
import { computed, onMounted, ref , watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LineIcon from '@/components/LineIcon.vue'
import ImageWithFallback from '@/components/ImageWithFallback.vue'
import { getAdminItemsApi, auditAdminItemApi, getAdminClaimsApi, auditAdminClaimApi } from '@/api/admin'
import { debounce } from '@/utils/debounce'

const router = useRouter()

const items = ref([])
const claims = ref([])
const itemPendingCount = computed(() => items.value.filter(item => getAuditStatus(item) === 'pending').length)
const itemApprovedCount = computed(() => items.value.filter(item => getAuditStatus(item) === 'approved').length)
const itemRejectedCount = computed(() => items.value.filter(item => getAuditStatus(item) === 'rejected').length)

const claimPendingCount = computed(() => claims.value.filter(claim => claim.status === 'pending').length)
const claimHandoverCount = computed(() => claims.value.filter(claim => ['approved', 'handover_pending'].includes(claim.status)).length)
const claimRejectedCount = computed(() => claims.value.filter(claim => claim.status === 'rejected').length)
const claimCompletedCount = computed(() => claims.value.filter(claim => claim.status === 'completed').length)

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  let source = []
  if (itemFilter.value === 'all') {
    source = items.value
  } else {
    source = items.value.filter(item => getAuditStatus(item) === itemFilter.value)
  }

  if (!kw) return source

  return source.filter(item => {
    return `${item.name || ''}${item.location || ''}${item.description || ''}`.toLowerCase().includes(kw)
  })
})

const filteredClaims = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  const source = claims.value.filter(claim => {
    if (claimFilter.value === 'all') return true
    if (claimFilter.value === 'handover') return ['approved', 'handover_pending'].includes(claim.status)

    return claim.status === claimFilter.value
  })

  if (!kw) return source

  return source.filter(claim => {
    const item = getClaimItem(claim)

    return `${item?.name || ''}${getClaimProofText(claim) || ''}${claim.phone || ''}`.toLowerCase().includes(kw)
  })
})

const emptyText = computed(() => {
  if (active.value === 'items') {
    switch (itemFilter.value) {
      case 'pending':
        return '当前没有待审核的发布信息'
      case 'approved':
        return '当前没有已通过的发布信息'
      case 'rejected':
        return '当前没有已拒绝的发布信息'
      default:
        return '当前没有发布信息'
    }
  }

  switch (claimFilter.value) {
    case 'pending':
      return '当前没有待核验的认领申请'
    case 'handover':
      return '当前没有待交接的认领申请'
    case 'rejected':
      return '当前没有已拒绝的认领申请'
    case 'completed':
      return '当前没有已完成的认领申请'
    default:
      return '当前没有认领申请'
  }
})

const itemFilter = ref('pending')
const claimFilter = ref('pending')
const props = defineProps({
  tab: {
    type: String,
    default: 'items'
  }
})

watch(
  () => props.tab,
  value => {
    if (value === 'claims') {
      active.value = 'claims'
    } else {
      active.value = 'items'
    }
  }
)

const active = ref(props.tab === 'claims' ? 'claims' : 'items')
const keyword = ref('')
const loading = ref(false)

const rejectDialog = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

const normalizeList = res => {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const getImage = item => {
  if (item.image) return item.image
  if (item.image_url) return item.image_url

  if (Array.isArray(item.images) && item.images.length) {
    const firstImage = item.images[0]

    return typeof firstImage === 'string' ? firstImage : firstImage.image_url || firstImage.url || ''
  }

  return ''
}

const getCategoryName = item => {
  if (typeof item.category === 'string') return item.category
  if (item.category?.name) return item.category.name

  return item.category_name || '其他'
}

const getHappenTime = item => item.happenTime || item.happen_time || item.created_at || '时间待补充'
const getUserId = item => item.userId || item.user_id || item.user?.id || '-'
const getAuditStatus = item => item.auditStatus || item.audit_status || 'pending'
const getRejectReason = item => item.rejectReason || item.reject_reason || ''
const isValuable = item => Boolean(item.isValuable || item.is_valuable)

const auditType = status => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'

  return 'warning'
}

const getClaimItem = claim => claim.item || claim.lost_found_item || claim.lostFoundItem || null
const getClaimType = claim => claim.claimType || claim.claim_type || 'claim'
const getClaimMethod = claim => claim.method || claim.pickup_method || 'offline'
const getClaimProofText = claim => claim.proofText || claim.proof_text || ''
const getClaimCreatedAt = claim => claim.createdAt || claim.created_at || '时间待补充'
const getClaimDeliveryAddress = claim => claim.deliveryAddress || claim.delivery_address || ''
const getClaimScore = claim => claim.score || claim.match_score || 0

const auditText = status => {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
    default:
      return '待审核'
  }
}

const claimTypeText = type => {
  switch (type) {
    case 'wrong_return':
      return '领错归还'
    case 'clue':
      return '线索提交'
    default:
      return '认领申请'
  }
}

const claimStatusText = status => {
  switch (status) {
    case 'approved':
    case 'handover_pending':
      return '待交接'
    case 'completed':
      return '已完成'
    case 'rejected':
      return '已拒绝'
    default:
      return '待核验'
  }
}

const claimStatusType = status => {
  switch (status) {
    case 'approved':
    case 'handover_pending':
    case 'completed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'warning'
  }
}

const load = async () => {
  loading.value = true

  try {
    const [itemRes, claimRes] = await Promise.all([
      getAdminItemsApi(),
      getAdminClaimsApi()
    ])

    items.value = normalizeList(itemRes)
    claims.value = normalizeList(claimRes)
  } catch {
  } finally {
    loading.value = false
  }
}

const audit = async (item, status) => {
  try {
    await auditAdminItemApi(item.id, {
      auditStatus: status,
      rejectReason: status === 'rejected' ? '信息不完整或疑似重复' : ''
    })

    ElMessage.success(status === 'approved' ? '已通过' : '已拒绝')
    load()
  } catch {
  }
}

const openReject = item => {
  rejectTarget.value = item
  rejectReason.value = getRejectReason(item)
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) return ElMessage.warning('请填写拒绝原因')

  try {
    await auditAdminItemApi(rejectTarget.value.id, {
      auditStatus: 'rejected',
      rejectReason: rejectReason.value
    })

    ElMessage.success('已拒绝并记录原因')
    rejectDialog.value = false
    load()
  } catch {
  }
}

const markDuplicate = async item => {
  try {
    await auditAdminItemApi(item.id, {
      auditStatus: 'rejected',
      rejectReason: '疑似重复发布，请合并或补充说明后重新提交'
    })

    ElMessage.success('已标记为疑似重复')
    load()
  } catch {
  }
}

const auditClaimRow = async (claim, status) => {
  try {
    await auditAdminClaimApi(claim.id, {
      status,
      remark: status === 'rejected' ? '证明细节不足或身份核验未通过' : '核验通过，进入交接流程'
    })

    ElMessage.success(status === 'approved' ? '认领申请已通过，已进入运营处理的交接队列' : '认领申请已驳回')
    load()
  } catch {
  }
}

const goItem = claim => {
  const item = getClaimItem(claim)

  if (item?.id) {
    const itemId = typeof item.id === 'object' ? item.id.id : item.id
    router.push(`/items/${itemId}`)
  }
}

onMounted(load)
</script>

<template>
  <div class="review-page fade-up">
    <el-tabs v-model="active" class="admin-tabs">
      <el-tab-pane label="内容审核" name="items">
        <div class="review-overview">
          <button type="button" :class="{ active: itemFilter === 'all' }" @click="itemFilter = 'all'">
            <b>{{ items.length }}</b>
            <span>全部信息</span>
          </button>

          <button type="button" :class="{ active: itemFilter === 'pending' }" @click="itemFilter = 'pending'">
            <b>{{ itemPendingCount }}</b>
            <span>待审核信息</span>
          </button>

          <button type="button" :class="{ active: itemFilter === 'approved' }" @click="itemFilter = 'approved'">
            <b>{{ itemApprovedCount }}</b>
            <span>已通过信息</span>
          </button>

          <button type="button" :class="{ active: itemFilter === 'rejected' }" @click="itemFilter = 'rejected'">
            <b>{{ itemRejectedCount }}</b>
            <span>已拒绝信息</span>
          </button>
        </div>

        <div class="toolbar">
          <el-radio-group v-model="itemFilter">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="approved">已通过</el-radio-button>
            <el-radio-button label="rejected">已拒绝</el-radio-button>
          </el-radio-group>

          <el-input v-model="keyword" placeholder="搜索物品名称 / 地点 / 描述" clearable />
        </div>

        <section class="review-list">
          <div v-for="item in filteredItems" :key="item.id" class="review-row glass-card">
            <ImageWithFallback v-if="getImage(item)" :src="getImage(item)" :fallback-text="getCategoryName(item)" :alt="item.name" />

            <div v-else class="placeholder">
              <LineIcon name="package" />
            </div>

            <div class="review-body">
              <div class="title">
                <b>{{ item.name }}</b>
                <el-tag :type="item.type === 'lost' ? 'primary' : 'success'">{{ item.type === 'lost' ? '失物' : '招领' }}</el-tag>
                <el-tag :type="auditType(getAuditStatus(item))">{{ auditText(getAuditStatus(item)) }}</el-tag>
                <el-tag v-if="isValuable(item)" type="warning">贵重物品</el-tag>
              </div>

              <p>{{ item.description }}</p>

              <div class="meta">
                {{ getCategoryName(item) }} · {{ item.location }} · {{ getHappenTime(item) }} · 发布人 #{{ getUserId(item) }}
              </div>

              <div class="privacy-line">联系方式仅后台核验可见，前台展示需脱敏。</div>
            </div>

            <div class="actions">
              <el-button type="success" :disabled="getAuditStatus(item) === 'approved'" @click="audit(item, 'approved')">通过</el-button>
              <el-button type="danger" plain :disabled="getAuditStatus(item) === 'rejected'" @click="openReject(item)">拒绝</el-button>
              <el-button plain type="warning" @click="markDuplicate(item)">疑似重复</el-button>
            </div>
          </div>

          <div v-if="!loading && !filteredItems.length" class="empty-review">
            {{ emptyText }}
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="认领核验" name="claims">
        <div class="review-overview">
          <button type="button" :class="{ active: claimFilter === 'all' }" @click="claimFilter = 'all'">
            <b>{{ claims.length }}</b>
            <span>全部申请</span>
          </button>

          <button type="button" :class="{ active: claimFilter === 'pending' }" @click="claimFilter = 'pending'">
            <b>{{ claimPendingCount }}</b>
            <span>待核验申请</span>
          </button>

          <button type="button" :class="{ active: claimFilter === 'handover' }" @click="claimFilter = 'handover'">
            <b>{{ claimHandoverCount }}</b>
            <span>待交接申请</span>
          </button>

          <button type="button" :class="{ active: claimFilter === 'rejected' }" @click="claimFilter = 'rejected'">
            <b>{{ claimRejectedCount }}</b>
            <span>已拒绝申请</span>
          </button>
        </div>

        <div class="toolbar">
          <el-radio-group v-model="claimFilter">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="pending">待核验</el-radio-button>
            <el-radio-button label="handover">待交接</el-radio-button>
            <el-radio-button label="rejected">已拒绝</el-radio-button>
            <el-radio-button label="completed">已完成</el-radio-button>
          </el-radio-group>

          <el-input v-model="keyword" placeholder="搜索关联物品 / 证明内容 / 联系电话" clearable />
        </div>

        <section class="review-list">
          <div v-for="claim in filteredClaims" :key="claim.id" class="review-row glass-card claim-review">
            <div class="score-ring" :class="getClaimScore(claim) >= 80 ? 'good' : getClaimScore(claim) >= 60 ? 'mid' : 'bad'">
              <b>{{ getClaimScore(claim) }}%</b>
              <span>匹配度</span>
            </div>

            <div class="review-body">
              <div class="title">
                <b>{{ getClaimItem(claim)?.name || '关联物品已删除' }}</b>
                <el-tag :type="claimStatusType(claim.status)">{{ claimStatusText(claim.status) }}</el-tag>
                <el-tag>{{ claimTypeText(getClaimType(claim)) }}</el-tag>
              </div>

              <p>{{ getClaimProofText(claim) }}</p>

              <div class="meta">
                {{ getClaimMethod(claim) === 'delivery' ? '邮寄领取' : '线下领取' }} · {{ claim.phone }} · {{ getClaimCreatedAt(claim) }}
              </div>

              <div v-if="getClaimDeliveryAddress(claim)" class="privacy-line">
                收件地址：已加密保存，仅核验通过后用于邮寄交接。
              </div>
            </div>

            <div class="actions">
              <el-button type="success" :disabled="['approved', 'handover_pending', 'completed'].includes(claim.status)" @click="auditClaimRow(claim, 'approved')">核验通过</el-button>
              <el-button type="danger" plain :disabled="claim.status === 'rejected' || claim.status === 'completed'" @click="auditClaimRow(claim, 'rejected')">驳回</el-button>
              <el-button plain @click="goItem(claim)">查看关联信息</el-button>
            </div>
          </div>

          <div v-if="!loading && !filteredClaims.length" class="empty-review">
            {{ emptyText }}
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="rejectDialog" title="填写拒绝原因" width="460px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="例如：图片不清晰、描述过少、疑似重复发布、包含敏感信息等" />

      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.review-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.review-overview button {
  padding: 16px 18px;
  border: 1px solid rgba(79, 124, 255, .08);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .09), rgba(0, 184, 148, .05));
  text-align: left;
  cursor: pointer;
  transition: .22s ease;
}

.review-overview button:hover,
.review-overview button.active {
  transform: translateY(-2px);
  border-color: rgba(79, 124, 255, .36);
  box-shadow: 0 14px 32px rgba(31, 45, 92, .10);
}

.review-overview b {
  display: block;
  font-size: 25px;
}

.review-overview span {
  color: var(--muted);
  font-weight: 800;
}

.toolbar {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns: auto minmax(240px, 360px);
  gap: 14px;
  align-items: center;
}

.admin-tabs {
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.review-list {
  display: grid;
  gap: 14px;
}

.review-row {
  padding: 18px;
  display: grid;
  grid-template-columns: 106px 1fr auto;
  gap: 18px;
  align-items: center;
  background: #fff;
}

.review-row img {
  width: 106px;
  height: 86px;
  object-fit: contain;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(17, 24, 39, .07);
}

.placeholder {
  width: 106px;
  height: 86px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #f8fafc;
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title b {
  font-size: 18px;
}

.review-body p {
  color: var(--muted);
  line-height: 1.7;
  margin: 9px 0;
}

.meta,
.privacy-line {
  color: #8b95a7;
}

.privacy-line {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(79, 124, 255, .06);
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.score-ring {
  width: 90px;
  height: 90px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 999px;
  background: conic-gradient(var(--primary) 0 80%, #eef2f7 0);
}

.score-ring b {
  display: block;
}

.score-ring span {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

.score-ring.good {
  background: conic-gradient(var(--success) 0 86%, #eef2f7 0);
}

.score-ring.mid {
  background: conic-gradient(var(--warning) 0 66%, #eef2f7 0);
}

.score-ring.bad {
  background: conic-gradient(var(--danger) 0 45%, #eef2f7 0);
}

.empty-review {
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: 30px;
  border: 1px dashed rgba(79, 124, 255, .24);
  border-radius: 22px;
  background: rgba(248, 251, 255, .72);
  color: var(--muted);
  font-weight: 800;
}

@media (max-width: 880px) {
  .review-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .review-row {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }

  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.el-radio-button) {
    flex: 1;
    min-width: calc(50% - 4px);
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    text-align: center;
    border-radius: 6px;
  }
}
</style>