<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/format'
import { resolveImageUrl } from '@/utils/image'
import LineIcon from '@/components/LineIcon.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  auditAdminClaimApi,
  auditAdminItemApi,
  createDisputeApi,
  deleteAdminItemApi,
  getAdminClaimsApi,
  getAdminItemsApi
} from '@/api/admin'

const props = defineProps({
  tab: {
    type: String,
    default: 'items'
  }
})

const active = ref(props.tab || 'items')
const loading = ref(false)
const keyword = ref('')
const error = ref('')

const items = ref([])
const claims = ref([])

const itemFilter = ref('pending')
const claimFilter = ref('pending')

// 分页
const itemPage = ref(1)
const claimPage = ref(1)
const pageSize = ref(5)

const rejectDialog = ref(false)
const rejectReason = ref('')
const currentRejectItem = ref(null)

const claimRejectDialog = ref(false)
const claimRejectReason = ref('')
const currentRejectClaim = ref(null)

const disputeDialog = ref(false)
const disputeReason = ref('')
const currentDisputeClaim = ref(null)
const disputeLoading = ref(false)
const actionLoading = ref(new Set())

const itemDetailDialog = ref(false)
const currentItemDetail = ref(null)
const itemDetailImages = ref([])
const imageViewerVisible = ref(false)
const imageViewerIndex = ref(0)

const normalizeList = res => {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const getActionKey = (scope, id) => `${scope}:${id || ''}`

const isActionLoading = (scope, id) => {
  return actionLoading.value.has(getActionKey(scope, id))
}

const setActionLoading = (scope, id, value) => {
  const key = getActionKey(scope, id)
  const next = new Set(actionLoading.value)

  if (value) {
    next.add(key)
  } else {
    next.delete(key)
  }

  actionLoading.value = next
}

const runAction = async (scope, id, task) => {
  if (isActionLoading(scope, id)) return false

  setActionLoading(scope, id, true)

  try {
    await task()
    return true
  } finally {
    setActionLoading(scope, id, false)
  }
}

const isDialogCancel = error => error === 'cancel' || error === 'close'

const getFullImageUrl = url => resolveImageUrl(url)

const getAuditStatus = item => item.auditStatus || item.audit_status || 'pending'

const getImage = item => {
  let url = ''

  if (item.image) {
    url = item.image
  } else if (item.image_url) {
    url = item.image_url
  } else if (Array.isArray(item.images) && item.images.length) {
    const firstImage = item.images[0]

    url = typeof firstImage === 'string'
      ? firstImage
      : firstImage.image_url || firstImage.url || firstImage.path || ''
  }

  return getFullImageUrl(url)
}

const getCategoryName = item => {
  if (typeof item.category === 'string') return item.category
  if (item.category?.name) return item.category.name

  return item.category_name || '其他'
}

const getHappenTime = item => formatDateTime(item.happenTime || item.happen_time || item.created_at || '')
const getUserId = item => item.userId || item.user_id || item.user?.id || '-'
const isValuable = item => Boolean(item.isValuable ?? item.is_valuable)

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

const getClaimItem = claim => claim.item || claim.lost_found_item || claim.lostFoundItem || null
const getClaimType = claim => claim.claimType || claim.claim_type || 'claim'
const getClaimMethod = claim => claim.method || claim.pickup_method || 'offline'
const getClaimProofText = claim => claim.proofText || claim.proof_text || '暂无证明描述'
const getClaimCreatedAt = claim => formatDateTime(claim.createdAt || claim.created_at || '')
const getClaimDeliveryAddress = claim => claim.deliveryAddress || claim.delivery_address || ''
const getClaimAuditReason = claim => claim.auditReason || claim.audit_reason || claim.reject_reason || ''

const claimTypeText = type => {
  if (type === 'wrong_return') return '领错归还'
  if (type === 'clue') return '线索提交'

  return '认领申请'
}

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

const itemPendingCount = computed(() => items.value.filter(item => getAuditStatus(item) === 'pending').length)
const itemApprovedCount = computed(() => items.value.filter(item => getAuditStatus(item) === 'approved').length)
const itemRejectedCount = computed(() => items.value.filter(item => getAuditStatus(item) === 'rejected').length)

const claimPendingCount = computed(() => claims.value.filter(claim => claim.status === 'pending').length)
const claimHandoverCount = computed(() => claims.value.filter(claim => ['approved', 'handover_pending'].includes(claim.status)).length)
const claimRejectedCount = computed(() => claims.value.filter(claim => claim.status === 'rejected').length)
const claimCompletedCount = computed(() => claims.value.filter(claim => claim.status === 'completed').length)

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  const source = itemFilter.value === 'all'
    ? items.value
    : items.value.filter(item => getAuditStatus(item) === itemFilter.value)

  let result = source
  if (kw) {
    result = source.filter(item => {
      return `${item.name || ''}${item.location || ''}${item.description || ''}`.toLowerCase().includes(kw)
    })
  }

  // 分页
  const start = (itemPage.value - 1) * pageSize.value
  return result.slice(start, start + pageSize.value)
})

const filteredItemsTotal = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const source = itemFilter.value === 'all'
    ? items.value
    : items.value.filter(item => getAuditStatus(item) === itemFilter.value)
  if (!kw) return source.length
  return source.filter(item => {
    return `${item.name || ''}${item.location || ''}${item.description || ''}`.toLowerCase().includes(kw)
  }).length
})

const filteredClaims = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  const source = claims.value.filter(claim => {
    if (claimFilter.value === 'all') return true
    if (claimFilter.value === 'handover') return ['approved', 'handover_pending'].includes(claim.status)

    return claim.status === claimFilter.value
  })

  let result = source
  if (kw) {
    result = source.filter(claim => {
      const item = getClaimItem(claim)
      return `${item?.name || ''}${getClaimProofText(claim) || ''}${claim.phone || ''}`.toLowerCase().includes(kw)
    })
  }

  // 分页
  const start = (claimPage.value - 1) * pageSize.value
  return result.slice(start, start + pageSize.value)
})

const filteredClaimsTotal = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const source = claims.value.filter(claim => {
    if (claimFilter.value === 'all') return true
    if (claimFilter.value === 'handover') return ['approved', 'handover_pending'].includes(claim.status)
    return claim.status === claimFilter.value
  })
  if (!kw) return source.length
  return source.filter(claim => {
    const item = getClaimItem(claim)
    return `${item?.name || ''}${getClaimProofText(claim) || ''}${claim.phone || ''}`.toLowerCase().includes(kw)
  }).length
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

const emptyDesc = computed(() => {
  if (keyword.value.trim()) {
    return '没有匹配当前关键词的记录，可以清空搜索或切换筛选条件后再试。'
  }

  return active.value === 'items'
    ? '切换上方的状态筛选，可以查看其它审核状态的发布信息。'
    : '切换上方的状态筛选，可以查看其它状态的认领申请。'
})

const loadItems = async () => {
  const res = await getAdminItemsApi()
  items.value = normalizeList(res)
}

const loadClaims = async () => {
  const res = await getAdminClaimsApi()
  claims.value = normalizeList(res)
}

const load = async () => {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([
      loadItems(),
      loadClaims()
    ])
  } catch {
    error.value = '审核列表加载失败，请检查网络连接后重试。'
    ElMessage.error('加载审核列表失败')
  } finally {
    loading.value = false
  }
}

const applyItemAudit = async (item, auditStatus, rejectReason = '') => {
  await auditAdminItemApi(item.id, {
    auditStatus,
    rejectReason
  })

  ElMessage.success(auditStatus === 'approved' ? '已通过该发布信息' : '已拒绝该发布信息')
  await loadItems()
}

const audit = async (item, auditStatus, rejectReason = '') => {
  try {
    return await runAction('item', item.id, () => applyItemAudit(item, auditStatus, rejectReason))
  } catch {
    ElMessage.error('操作失败，请稍后重试')
    return false
  }
}

const openReject = item => {
  currentRejectItem.value = item
  rejectReason.value = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!currentRejectItem.value) return

  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }

  const completed = await audit(currentRejectItem.value, 'rejected', rejectReason.value.trim())

  if (!completed) return

  rejectDialog.value = false
  currentRejectItem.value = null
  rejectReason.value = ''
}

const markDuplicate = async item => {
  try {
    await runAction('item', item.id, async () => {
      await ElMessageBox.confirm(`确认将「${item.name}」标记为疑似重复并拒绝？拒绝后该信息将不再公开展示。`, '疑似重复确认', {
        type: 'warning',
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消'
      })

      await applyItemAudit(item, 'rejected', '疑似重复发布，请合并或补充更明确的信息')
    })
  } catch (error) {
    if (!isDialogCancel(error)) {
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

const removeItem = async item => {
  try {
    await runAction('item', item.id, async () => {
      await ElMessageBox.confirm(`确认删除「${item.name}」？删除后该信息及其图片将无法恢复。`, '删除确认', {
        type: 'danger',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      })

      await deleteAdminItemApi(item.id)
      ElMessage.success('已删除该发布信息')
      await loadItems()
    })
  } catch (error) {
    if (!isDialogCancel(error)) {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

const applyClaimAudit = async (claim, status, auditReason = '') => {
  const isApprove = status === 'approved'

  await auditAdminClaimApi(claim.id, {
    status,
    auditReason: auditReason || (isApprove
      ? '证明材料初步通过，进入交接流程。实际领取仍需核验学生证、校园卡或其他校园身份凭证。'
      : '证明材料不足或信息不一致')
  })

  ElMessage.success(isApprove ? '认领申请已通过，等待交接核验' : '认领申请已驳回')
  await loadClaims()
}

const auditClaimRow = async (claim, status, auditReason = '') => {
  try {
    return await runAction('claim', claim.id, () => applyClaimAudit(claim, status, auditReason))
  } catch {
    ElMessage.error('操作失败，请稍后重试')
    return false
  }
}

const approveClaim = async claim => {
  try {
    await runAction('claim', claim.id, async () => {
      await ElMessageBox.confirm(
        '核验通过仅表示证明材料初步通过。实际交接时仍需核验学生证、校园卡或其他校园身份凭证；邮寄处理前也需核验注册邮箱、认领联系电话、校园身份信息和物品归属证明。',
        '确认核验通过',
        {
          type: 'warning',
          confirmButtonText: '确认通过',
          cancelButtonText: '取消'
        }
      )

      await applyClaimAudit(claim, 'approved')
    })
  } catch (error) {
    if (!isDialogCancel(error)) {
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

const openRejectClaim = claim => {
  currentRejectClaim.value = claim
  claimRejectReason.value = ''
  claimRejectDialog.value = true
}

const confirmRejectClaim = async () => {
  if (!currentRejectClaim.value) return

  if (!claimRejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  const completed = await auditClaimRow(currentRejectClaim.value, 'rejected', claimRejectReason.value.trim())

  if (!completed) return

  claimRejectDialog.value = false
  currentRejectClaim.value = null
  claimRejectReason.value = ''
}

const goItem = claim => {
  const item = getClaimItem(claim)

  if (!item?.id) {
    ElMessage.warning('关联物品不存在或已删除')
    return
  }

  openItemDetail(item)
}

const openItemDetail = item => {
  currentItemDetail.value = item
  itemDetailImages.value = getItemImages(item)
  itemDetailDialog.value = true
}

const getItemImages = item => {
  if (!item) return []

  if (Array.isArray(item.images) && item.images.length) {
    return item.images.map(img => {
      if (typeof img === 'string') return getFullImageUrl(img)
      return getFullImageUrl(img.image_url || img.url || img.path || '')
    }).filter(Boolean)
  }

  const singleUrl = item.image || item.image_url || ''
  return singleUrl ? [getFullImageUrl(singleUrl)] : []
}

const openDispute = claim => {
  currentDisputeClaim.value = claim
  disputeReason.value = ''
  disputeDialog.value = true
}

const submitDispute = async () => {
  if (disputeLoading.value) return

  if (!currentDisputeClaim.value) return

  if (!disputeReason.value.trim()) {
    ElMessage.warning('请填写争议原因')
    return
  }

  disputeLoading.value = true
  try {
    await createDisputeApi({
      itemId: getClaimItem(currentDisputeClaim.value)?.id,
      claimId: currentDisputeClaim.value.id,
      reason: disputeReason.value.trim()
    })
    ElMessage.success('争议已登记')
    disputeDialog.value = false
    currentDisputeClaim.value = null
    disputeReason.value = ''
  } catch (error) {
    console.error('登记争议失败:', error)
    ElMessage.error('登记失败，请稍后重试')
  } finally {
    disputeLoading.value = false
  }
}

// 删除或筛选后当前页可能超出总页数，自动回落到最后一页
const clampPage = (pageRef, total) => {
  const maxPage = Math.max(1, Math.ceil(total / pageSize.value))
  if (pageRef.value > maxPage) pageRef.value = maxPage
}

watch(filteredItemsTotal, total => clampPage(itemPage, total))
watch(filteredClaimsTotal, total => clampPage(claimPage, total))

watch([itemFilter, keyword], () => {
  itemPage.value = 1
})

watch([claimFilter, keyword], () => {
  claimPage.value = 1
})

watch(
  () => props.tab,
  value => {
    active.value = value || 'items'
  }
)

onMounted(load)
</script>

<template>
  <div class="review-page fade-up">
    <ErrorState
      v-if="error && !loading"
      title="审核数据加载失败"
      :desc="error"
      @retry="load"
    />

    <el-tabs v-else v-model="active" class="admin-tabs">
      <el-tab-pane label="内容审核" name="items">
        <h2 class="sr-only">发布信息审核列表</h2>

        <div class="review-overview" aria-label="发布信息审核概览">
          <button type="button" :class="{ active: itemFilter === 'all' }" @click="itemFilter = 'all'">
            <b>{{ loading ? '—' : items.length }}</b>
            <span>全部信息</span>
          </button>

          <button type="button" :class="{ active: itemFilter === 'pending' }" @click="itemFilter = 'pending'">
            <b>{{ loading ? '—' : itemPendingCount }}</b>
            <span>待审核信息</span>
          </button>

          <button type="button" :class="{ active: itemFilter === 'approved' }" @click="itemFilter = 'approved'">
            <b>{{ loading ? '—' : itemApprovedCount }}</b>
            <span>已通过信息</span>
          </button>

          <button type="button" :class="{ active: itemFilter === 'rejected' }" @click="itemFilter = 'rejected'">
            <b>{{ loading ? '—' : itemRejectedCount }}</b>
            <span>已拒绝信息</span>
          </button>
        </div>

        <div class="toolbar">
          <div class="filter-pills" role="group" aria-label="按审核状态筛选发布信息">
            <button type="button" :class="{ active: itemFilter === 'all' }" @click="itemFilter = 'all'">全部</button>
            <button type="button" :class="{ active: itemFilter === 'pending' }" @click="itemFilter = 'pending'">待审核</button>
            <button type="button" :class="{ active: itemFilter === 'approved' }" @click="itemFilter = 'approved'">已通过</button>
            <button type="button" :class="{ active: itemFilter === 'rejected' }" @click="itemFilter = 'rejected'">已拒绝</button>
          </div>

          <el-input v-model="keyword" placeholder="搜索物品名称 / 地点 / 描述" clearable aria-label="搜索发布信息" />
        </div>

        <section v-if="loading" class="review-list" aria-busy="true" aria-label="发布审核列表加载中">
          <el-skeleton v-for="n in 3" :key="n" animated class="skeleton-card glass-card">
            <template #template>
              <div class="skeleton-inner">
                <el-skeleton-item variant="image" class="skeleton-thumb" />

                <div class="skeleton-copy">
                  <el-skeleton-item variant="h3" style="width: 38%" />
                  <el-skeleton-item variant="text" style="width: 88%" />
                  <el-skeleton-item variant="text" style="width: 64%" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </section>

        <section v-else class="review-list">
          <EmptyState
            v-if="!filteredItems.length"
            :title="emptyText"
            :desc="emptyDesc"
          />

          <div v-for="item in filteredItems" :key="item.id" class="review-row glass-card">
            <img v-if="getImage(item)" :src="getImage(item)" :alt="`${item.name || '物品'}的发布图片`" />

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

              <div class="privacy-line">联系方式仅管理员核验可见，公开页面展示时应进行脱敏处理。</div>
            </div>

            <div class="actions">
              <el-button
                type="success"
                :loading="isActionLoading('item', item.id)"
                :disabled="getAuditStatus(item) === 'approved' || isActionLoading('item', item.id)"
                @click="audit(item, 'approved')"
              >
                通过
              </el-button>
              <el-button
                type="danger"
                plain
                :loading="isActionLoading('item', item.id)"
                :disabled="getAuditStatus(item) === 'rejected' || isActionLoading('item', item.id)"
                @click="openReject(item)"
              >
                拒绝
              </el-button>
              <el-button
                plain
                type="warning"
                :loading="isActionLoading('item', item.id)"
                :disabled="isActionLoading('item', item.id)"
                @click="markDuplicate(item)"
              >
                疑似重复
              </el-button>
              <el-button
                plain
                type="info"
                :loading="isActionLoading('item', item.id)"
                :disabled="isActionLoading('item', item.id)"
                @click="removeItem(item)"
              >
                删除
              </el-button>
              <el-button plain @click="openItemDetail(item)">查看详情</el-button>
            </div>
          </div>

          <div v-if="filteredItemsTotal > pageSize" class="pagination-bar">
            <el-pagination
              v-model:current-page="itemPage"
              :page-size="pageSize"
              :total="filteredItemsTotal"
              layout="prev, pager, next, jumper"
              background
              aria-label="发布信息审核分页"
            />
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="认领核验" name="claims">
        <h2 class="sr-only">认领申请核验列表</h2>

        <div class="review-overview" aria-label="认领申请核验概览">
          <button type="button" :class="{ active: claimFilter === 'all' }" @click="claimFilter = 'all'">
            <b>{{ loading ? '—' : claims.length }}</b>
            <span>全部申请</span>
          </button>

          <button type="button" :class="{ active: claimFilter === 'pending' }" @click="claimFilter = 'pending'">
            <b>{{ loading ? '—' : claimPendingCount }}</b>
            <span>待核验申请</span>
          </button>

          <button type="button" :class="{ active: claimFilter === 'handover' }" @click="claimFilter = 'handover'">
            <b>{{ loading ? '—' : claimHandoverCount }}</b>
            <span>待交接申请</span>
          </button>

          <button type="button" :class="{ active: claimFilter === 'rejected' }" @click="claimFilter = 'rejected'">
            <b>{{ loading ? '—' : claimRejectedCount }}</b>
            <span>已拒绝申请</span>
          </button>
        </div>

        <div class="toolbar">
          <div class="filter-pills" role="group" aria-label="按状态筛选认领申请">
            <button type="button" :class="{ active: claimFilter === 'all' }" @click="claimFilter = 'all'">全部</button>
            <button type="button" :class="{ active: claimFilter === 'pending' }" @click="claimFilter = 'pending'">待核验</button>
            <button type="button" :class="{ active: claimFilter === 'handover' }" @click="claimFilter = 'handover'">待交接</button>
            <button type="button" :class="{ active: claimFilter === 'rejected' }" @click="claimFilter = 'rejected'">已拒绝</button>
            <button type="button" :class="{ active: claimFilter === 'completed' }" @click="claimFilter = 'completed'">已完成</button>
          </div>

          <el-input v-model="keyword" placeholder="搜索关联物品 / 证明内容 / 联系电话" clearable aria-label="搜索认领申请" />
        </div>

        <section v-if="loading" class="review-list" aria-busy="true" aria-label="认领核验列表加载中">
          <el-skeleton v-for="n in 3" :key="n" animated class="skeleton-card glass-card">
            <template #template>
              <div class="skeleton-inner">
                <el-skeleton-item variant="image" class="skeleton-thumb" />

                <div class="skeleton-copy">
                  <el-skeleton-item variant="h3" style="width: 42%" />
                  <el-skeleton-item variant="text" style="width: 86%" />
                  <el-skeleton-item variant="text" style="width: 58%" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </section>

        <section v-else class="review-list">
          <EmptyState
            v-if="!filteredClaims.length"
            :title="emptyText"
            :desc="emptyDesc"
          />

          <div v-for="claim in filteredClaims" :key="claim.id" class="review-row glass-card claim-review">
            <div class="claim-icon">
              <LineIcon name="user-check" tone="green" />
              <span>{{ claimTypeText(getClaimType(claim)) }}</span>
            </div>

            <div class="review-body">
              <div class="title">
                <b>{{ getClaimItem(claim)?.name || '关联物品已删除' }}</b>
                <el-tag :type="claimStatusType(claim.status)">{{ claimStatusText(claim.status) }}</el-tag>
                <el-tag>{{ claimTypeText(getClaimType(claim)) }}</el-tag>
              </div>

              <p>{{ getClaimProofText(claim) }}</p>

              <div class="meta">
                {{ getClaimMethod(claim) === 'delivery' ? '邮寄领取' : '线下领取' }} · {{ claim.phone || '未填写联系电话' }} · {{ getClaimCreatedAt(claim) }}
              </div>

              <div v-if="getClaimDeliveryAddress(claim)" class="privacy-line">
                收件地址：仅核验通过后用于邮寄交接，不在公开页面展示。
              </div>

              <div v-if="getClaimAuditReason(claim)" class="reason-line">
                审核说明：{{ getClaimAuditReason(claim) }}
              </div>
            </div>

            <div class="actions">
              <el-button
                type="success"
                :loading="isActionLoading('claim', claim.id)"
                :disabled="['approved', 'handover_pending', 'completed'].includes(claim.status) || isActionLoading('claim', claim.id)"
                @click="approveClaim(claim)"
              >
                核验通过
              </el-button>
              <el-button
                type="danger"
                plain
                :loading="isActionLoading('claim', claim.id)"
                :disabled="claim.status === 'rejected' || claim.status === 'completed' || isActionLoading('claim', claim.id)"
                @click="openRejectClaim(claim)"
              >
                驳回
              </el-button>
              <el-button
                plain
                type="warning"
                :disabled="isActionLoading('claim', claim.id)"
                @click="openDispute(claim)"
              >
                登记争议
              </el-button>
              <el-button plain @click="goItem(claim)">查看关联信息</el-button>
            </div>
          </div>

          <div v-if="filteredClaimsTotal > pageSize" class="pagination-bar">
            <el-pagination
              v-model:current-page="claimPage"
              :page-size="pageSize"
              :total="filteredClaimsTotal"
              layout="prev, pager, next, jumper"
              background
              aria-label="认领核验分页"
            />
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="rejectDialog" title="填写拒绝原因" width="min(460px, 92vw)">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="例如：图片不清晰、描述过少、疑似重复发布、包含敏感信息等" aria-label="拒绝原因" />

      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button
          type="danger"
          :loading="!!currentRejectItem && isActionLoading('item', currentRejectItem.id)"
          :disabled="!!currentRejectItem && isActionLoading('item', currentRejectItem.id)"
          @click="confirmReject"
        >
          确认拒绝
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="claimRejectDialog" title="填写认领驳回原因" width="min(480px, 92vw)">
      <el-input
        v-model="claimRejectReason"
        type="textarea"
        :rows="4"
        placeholder="例如：证明材料不足、物品细节不一致、身份信息无法核验、联系方式无法确认等"
        aria-label="认领驳回原因"
      />

      <template #footer>
        <el-button @click="claimRejectDialog = false">取消</el-button>
        <el-button
          type="danger"
          :loading="!!currentRejectClaim && isActionLoading('claim', currentRejectClaim.id)"
          :disabled="!!currentRejectClaim && isActionLoading('claim', currentRejectClaim.id)"
          @click="confirmRejectClaim"
        >
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="disputeDialog" title="登记争议" width="min(480px, 92vw)">
      <p class="dialog-tip">
        如果该认领申请存在纠纷（如多人同时认领、证明材料冲突等），请登记争议原因。
      </p>
      <el-input
        v-model="disputeReason"
        type="textarea"
        :rows="4"
        placeholder="例如：多人同时认领同一物品，证明材料冲突；物品归属存在疑问等"
        aria-label="争议原因"
      />

      <template #footer>
        <el-button @click="disputeDialog = false">取消</el-button>
        <el-button type="warning" :loading="disputeLoading" :disabled="disputeLoading" @click="submitDispute">确认登记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="itemDetailDialog" title="物品详情" width="min(720px, 94vw)" class="item-detail-dialog" append-to-body>
      <div v-if="currentItemDetail" class="detail-content">
        <div v-if="itemDetailImages.length" class="detail-images">
          <img
            v-for="(url, idx) in itemDetailImages"
            :key="idx"
            :src="url"
            :alt="`物品照片 ${idx + 1}`"
            @click="imageViewerIndex = idx; imageViewerVisible = true"
          />
        </div>

        <el-dialog
          v-model="imageViewerVisible"
          title="图片预览"
          width="min(960px, 94vw)"
          destroy-on-close
          append-to-body
        >
          <img :src="itemDetailImages[imageViewerIndex]" alt="物品大图预览" class="detail-preview" />
        </el-dialog>

        <div class="detail-info">
          <h3>{{ currentItemDetail.name }}</h3>

          <div class="detail-tags">
            <el-tag :type="currentItemDetail.type === 'lost' ? 'primary' : 'success'">
              {{ currentItemDetail.type === 'lost' ? '失物' : '招领' }}
            </el-tag>
            <el-tag :type="auditType(getAuditStatus(currentItemDetail))">
              {{ auditText(getAuditStatus(currentItemDetail)) }}
            </el-tag>
            <el-tag v-if="isValuable(currentItemDetail)" type="warning">贵重物品</el-tag>
          </div>

          <p class="detail-desc">{{ currentItemDetail.description || '暂无描述' }}</p>

          <div class="detail-meta">
            <div><b>分类：</b>{{ getCategoryName(currentItemDetail) }}</div>
            <div><b>地点：</b>{{ currentItemDetail.location || '未填写' }}</div>
            <div><b>时间：</b>{{ getHappenTime(currentItemDetail) }}</div>
            <div><b>发布人ID：</b>#{{ getUserId(currentItemDetail) }}</div>
          </div>

          <div v-if="currentItemDetail.contact" class="detail-contact">
            <b>联系方式（管理员可见）：</b>{{ currentItemDetail.contact }}
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="itemDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.review-page {
  min-width: 0;
}

.review-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  padding: 6px;
}

.review-overview button {
  padding: 16px 18px;
  border: 1px solid rgba(79, 124, 255, .08);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .09), rgba(0, 184, 148, .05));
  text-align: left;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
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
  font-variant-numeric: tabular-nums;
}

.review-overview span {
  color: var(--muted);
  font-weight: 800;
}

.toolbar {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: 14px;
  align-items: center;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pills button {
  min-width: 76px;
  min-height: 40px;
  padding: 9px 16px;
  border: 1px solid rgba(79, 124, 255, .14);
  border-radius: 999px;
  background: rgba(255, 255, 255, .78);
  color: #64748b;
  font-weight: 900;
  cursor: pointer;
  transition: color .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
}

.filter-pills button:hover {
  color: var(--primary-strong);
  border-color: rgba(79, 124, 255, .34);
  background: rgba(79, 124, 255, .06);
}

.filter-pills button.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 12px 26px rgba(79, 124, 255, .20);
}

.admin-tabs {
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.review-list {
  display: grid;
  gap: 16px;
  min-width: 0;
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

.claim-icon {
  width: 106px;
  height: 94px;
  display: grid;
  place-items: center;
  gap: 6px;
  padding: 10px;
  border-radius: 20px;
  background: rgba(0, 184, 148, .08);
  color: #047857;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title b {
  font-size: 18px;
  overflow-wrap: anywhere;
}

.review-body {
  min-width: 0;
}

.review-body p {
  color: var(--muted);
  line-height: 1.7;
  margin: 9px 0;
  overflow-wrap: anywhere;
}

.meta,
.privacy-line {
  color: #8b95a7;
  overflow-wrap: anywhere;
}

.privacy-line,
.identity-line,
.reason-line {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 14px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.privacy-line {
  background: rgba(79, 124, 255, .06);
}

.identity-line {
  background: rgba(255, 159, 67, .10);
  color: #92400e;
  font-size: 13px;
}

.reason-line {
  background: rgba(244, 63, 94, .08);
  color: #be123c;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.actions :deep(.el-button) {
  min-height: 40px;
  border-radius: 999px;
  font-weight: 800;
}

.skeleton-card {
  padding: 18px;
  background: #fff;
}

.skeleton-inner {
  display: grid;
  grid-template-columns: 106px 1fr;
  gap: 18px;
  align-items: center;
}

.skeleton-thumb {
  width: 106px;
  height: 86px;
  border-radius: 18px;
}

.skeleton-copy {
  min-width: 0;
  display: grid;
  gap: 12px;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  max-width: 100%;
  padding: 20px 0 10px;
  overflow-x: auto;
}

.dialog-tip {
  margin: 0 0 16px;
  color: var(--muted);
  line-height: 1.7;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-images img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  background: #f8fbff;
  cursor: zoom-in;
  transition: transform .18s ease, box-shadow .18s ease;
}

.detail-images img:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(79, 124, 255, 0.25);
}

.detail-preview {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.detail-info h3 {
  margin: 0 0 12px;
  font-size: 22px;
  overflow-wrap: anywhere;
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.detail-desc {
  color: var(--muted);
  line-height: 1.75;
  margin: 0 0 16px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(248, 251, 255, .72);
  overflow-wrap: anywhere;
}

.detail-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.detail-meta > div {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(79, 124, 255, .06);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.detail-contact {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(0, 184, 148, .08);
  color: #047857;
  font-size: 14px;
  overflow-wrap: anywhere;
}

@media (max-width: 960px) {
  .review-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .review-row {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }
}

@media (max-width: 620px) {
  .admin-tabs {
    padding: 14px;
    border-radius: 22px;
  }

  .review-overview {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .review-row {
    padding: 16px;
    gap: 14px;
  }

  .review-row img,
  .placeholder,
  .claim-icon {
    width: 100%;
    height: 160px;
  }

  .review-row img {
    object-fit: cover;
    border-radius: 16px;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
    min-height: 42px;
  }

  .skeleton-inner {
    grid-template-columns: 1fr;
  }

  .skeleton-thumb {
    width: 100%;
    height: 140px;
  }

  .detail-meta {
    grid-template-columns: 1fr;
  }
}
</style>
