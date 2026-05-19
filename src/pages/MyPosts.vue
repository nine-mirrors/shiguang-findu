<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyItemsApi, updateItemStatusApi, deleteItemApi } from '@/api/item'
import { getMyClaimsApi, createClaimApi } from '@/api/claim'
import { formatDateTime } from '@/utils/format'
import StatCard from '@/components/StatCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppLoading from '@/components/AppLoading.vue'

const route = useRoute()

const items = ref([])
const claims = ref([])
const loading = ref(false)
const activeTab = ref(route.query.tab === 'claims' ? 'claims' : 'posts')

const wrongReturnDialog = ref(false)
const wrongReturnForm = ref({
  claimId: '',
  itemId: '',
  reason: '',
  phone: ''
})
const wrongReturnLoading = ref(false)
const itemActionLoading = ref(new Set())

const getItemActionKey = (action, item) => `${action}:${item?.id || ''}`

const isItemActionLoading = (action, item) => {
  return itemActionLoading.value.has(getItemActionKey(action, item))
}

const setItemActionLoading = (action, item, value) => {
  const key = getItemActionKey(action, item)
  const next = new Set(itemActionLoading.value)

  if (value) {
    next.add(key)
  } else {
    next.delete(key)
  }

  itemActionLoading.value = next
}

const doneCount = computed(() => {
  const completedItems = items.value.filter(item => ['done', 'completed', 'closed'].includes(item.status)).length
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
const getItemRejectReason = item => item.rejectReason || item.reject_reason || ''

const getClaimItem = claim => claim.item || claim.lost_found_item || claim.lostFoundItem || null
const getClaimType = claim => claim.claimType || claim.claim_type || 'claim'
const getClaimMethod = claim => claim.method || claim.pickup_method || 'offline'
const getClaimProofText = claim => claim.proofText || claim.proof_text || ''
const getClaimCreatedAt = claim => formatDateTime(claim.createdAt || claim.created_at || '')
const getClaimDeliveryAddress = claim => claim.deliveryAddress || claim.delivery_address || ''
const getClaimAuditReason = claim => claim.auditReason || claim.audit_reason || claim.reject_reason || ''

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
  if (['done', 'completed', 'closed'].includes(status)) return '已完成'
  if (status === 'claiming') return '认领中'

  return '进行中'
}

const itemStatusType = status => {
  if (['done', 'completed', 'closed'].includes(status)) return 'success'

  return 'warning'
}

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

const shouldShowIdentityNote = claim => {
  return getClaimType(claim) === 'claim' && ['approved', 'handover_pending'].includes(claim.status)
}

const shouldShowRejectReason = claim => {
  return claim.status === 'rejected' && getClaimAuditReason(claim)
}

const canWrongReturn = claim => {
  return getClaimType(claim) === 'claim' && claim.status === 'completed'
}

const openWrongReturn = claim => {
  if (!canWrongReturn(claim)) {
    ElMessage.warning('只有已完成的认领申请才能发起领错归还')
    return
  }
  wrongReturnForm.value = {
    claimId: claim.id,
    itemId: getClaimItem(claim)?.id || '',
    reason: '',
    phone: ''
  }
  wrongReturnDialog.value = true
}

const submitWrongReturn = async () => {
  if (wrongReturnLoading.value) return

  if (!wrongReturnForm.value.reason.trim()) {
    ElMessage.warning('请填写归还原因')
    return
  }

  if (!wrongReturnForm.value.phone.trim()) {
    ElMessage.warning('请填写联系电话')
    return
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(wrongReturnForm.value.phone.trim())) {
    ElMessage.warning('请输入有效的11位手机号码')
    return
  }

  wrongReturnLoading.value = true
  try {
    await createClaimApi({
      itemId: wrongReturnForm.value.itemId,
      claimType: 'wrong_return',
      proofText: wrongReturnForm.value.reason,
      pickupMethod: 'offline',
      phone: wrongReturnForm.value.phone.trim()
    })
    ElMessage.success('领错归还申请已提交，等待管理员审核')
    wrongReturnDialog.value = false
    await load()
  } catch (error) {
    console.error('提交领错归还失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    wrongReturnLoading.value = false
  }
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

const canMarkDone = item => {
  const auditStatus = getAuditStatus(item)
  const itemStatus = getItemStatus(item)

  return auditStatus === 'approved' && !['done', 'completed', 'closed'].includes(itemStatus)
}

const canClose = item => {
  const itemStatus = getItemStatus(item)

  return !['done', 'completed', 'closed'].includes(itemStatus)
}

const markDone = async item => {
  if (!canMarkDone(item)) {
    ElMessage.warning('该信息暂不满足标记完成的条件')
    return
  }

  if (isItemActionLoading('done', item)) return

  setItemActionLoading('done', item, true)

  try {
    await ElMessageBox.confirm(
      `确认将「${item.name || '该信息'}」标记为已完成吗？`,
      '标记完成确认',
      {
        type: 'warning',
        confirmButtonText: '确认完成',
        cancelButtonText: '取消'
      }
    )

    await updateItemStatusApi(item.id, {
      status: 'closed'
    })

    ElMessage.success('状态已更新为已完成')
    await load()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记完成失败:', error)
      ElMessage.error('标记失败，请稍后重试')
    }
  } finally {
    setItemActionLoading('done', item, false)
  }
}

const remove = async item => {
  if (isItemActionLoading('delete', item)) return

  const forbiddenStatuses = ['completed', 'done', 'claimed', 'closed']
  const status = item.status

  if (forbiddenStatuses.includes(status)) {
    ElMessage.warning('已完成或已认领的信息无法删除，如需处理请联系管理员')
    return
  }

  setItemActionLoading('delete', item, true)

  try {
    await ElMessageBox.confirm(
      `确认删除「${item.name || '该信息'}」？删除后将无法在我的发布中查看。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )

    await deleteItemApi(item.id)

    ElMessage.success('已删除')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  } finally {
    setItemActionLoading('delete', item, false)
  }
}

onMounted(load)

watch(() => route.query.tab, value => {
  activeTab.value = value === 'claims' ? 'claims' : 'posts'
})
</script>

<template>
  <div class="my-page container">
    <AppLoading :visible="loading" text="加载我的信息..." />

    <section class="section-title fade-up">
      <div>
        <span class="kicker">我的协寻中心</span>

        <h2>发布、认领、线索与归还进度都在这里追踪。</h2>

        <p>你可以查看发布审核状态、认领核验结果、交接进度和驳回原因。</p>
      </div>

      <el-button plain :loading="loading" @click="load">刷新</el-button>
    </section>

    <section class="mini-stats">
      <StatCard label="我的发布" :value="items.length" icon="pin" tone="blue" />
      <StatCard label="我的申请" :value="claims.length" icon="user-check" tone="purple" />
      <StatCard label="已完成" :value="doneCount" icon="check" tone="green" />
    </section>

    <el-tabs v-model="activeTab" class="soft-tabs">
      <el-tab-pane label="我的发布" name="posts">
        <section v-if="loading" class="loading-list">
          <el-skeleton v-for="item in 3" :key="item" animated>
            <template #template>
              <div class="skeleton-row">
                <el-skeleton-item variant="h3" style="width: 36%" />
                <el-skeleton-item variant="text" style="width: 78%" />
                <el-skeleton-item variant="text" style="width: 48%" />
              </div>
            </template>
          </el-skeleton>
        </section>

        <EmptyState
          v-else-if="!items.length"
          title="你还没有发布信息"
          desc="发布一条失物或招领信息后，会在这里跟踪审核和处理状态。"
          button-text="立即发布"
          @action="$router.push('/publish')"
        />

        <section v-else class="post-list">
          <div v-for="item in items" :key="item.id" class="post-row glass-card">
            <div class="row-main">
              <b>{{ item.name }}</b>

              <p>{{ item.description }}</p>

              <div class="row-tags">
                <el-tag class="soft-tag" :class="item.type === 'lost' ? 'type-lost' : 'type-found'">
                  {{ item.type === 'lost' ? '失物' : '招领' }}
                </el-tag>

                <el-tag>{{ getCategoryName(item) }}</el-tag>
                <el-tag :type="auditType(getAuditStatus(item))">{{ auditText(getAuditStatus(item)) }}</el-tag>
                <el-tag :type="itemStatusType(getItemStatus(item))">{{ itemStatusText(getItemStatus(item)) }}</el-tag>
              </div>

              <div v-if="getAuditStatus(item) === 'rejected' && getItemRejectReason(item)" class="reason-line">
                驳回原因：{{ getItemRejectReason(item) }}
              </div>
            </div>

            <div class="row-actions">
              <el-button @click="$router.push(`/items/${item.id}`)">查看</el-button>
              <el-button
                class="edit-btn"
                :disabled="getAuditStatus(item) === 'approved'"
                @click="$router.push(`/publish/${item.id}/edit`)"
              >
                编辑
              </el-button>
              <el-button
                type="success"
                :loading="isItemActionLoading('done', item)"
                :disabled="!canMarkDone(item) || isItemActionLoading('done', item)"
                @click="markDone(item)"
              >
                标记完成
              </el-button>
              <el-button
                type="danger"
                plain
                :loading="isItemActionLoading('delete', item)"
                @click="remove(item)"
              >
                删除
              </el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="我的认领/线索" name="claims">
        <section v-if="loading" class="loading-list">
          <el-skeleton v-for="item in 3" :key="item" animated>
            <template #template>
              <div class="skeleton-row">
                <el-skeleton-item variant="h3" style="width: 34%" />
                <el-skeleton-item variant="text" style="width: 82%" />
                <el-skeleton-item variant="text" style="width: 52%" />
              </div>
            </template>
          </el-skeleton>
        </section>

        <EmptyState
          v-else-if="!claims.length"
          title="还没有认领申请"
          desc="在物品详情页点击我要认领或我有线索后，会在这里显示审核进度。"
          button-text="去失物大厅"
          @action="$router.push('/items')"
        />

        <section v-else class="post-list">
          <div v-for="claim in claims" :key="claim.id" class="post-row glass-card claim-row">
            <div class="row-main">
              <b>{{ getClaimItem(claim)?.name || '关联物品已删除' }}</b>

              <p>{{ getClaimProofText(claim) || '暂无证明说明' }}</p>

              <div class="row-tags">
                <el-tag>{{ claimTypeText(getClaimType(claim)) }}</el-tag>
                <el-tag :type="claimMethodType(getClaimMethod(claim))">{{ claimMethodText(getClaimMethod(claim)) }}</el-tag>
                <el-tag :type="claimStatusType(claim.status)">{{ claimStatusText(claim.status) }}</el-tag>
              </div>

              <div v-if="shouldShowIdentityNote(claim)" class="identity-line">
                待交接不代表可直接领取。线下领取需出示学生证、校园卡或其他校园身份凭证；邮寄处理需先核验注册邮箱、认领联系电话、校园身份信息和物品归属证明。
              </div>

              <div v-if="getClaimMethod(claim) === 'delivery' && getClaimDeliveryAddress(claim)" class="privacy-line">
                收件地址：仅核验通过后用于邮寄处理，不在公开页面展示。
              </div>

              <div v-if="shouldShowRejectReason(claim)" class="reason-line">
                驳回原因：{{ getClaimAuditReason(claim) }}
              </div>
            </div>

            <div class="claim-extra">
              <span>提交时间：{{ getClaimCreatedAt(claim) }}</span>

              <span v-if="claim.status === 'pending'">当前状态：等待管理员核验</span>
              <span v-else-if="['approved', 'handover_pending'].includes(claim.status)">当前状态：等待交接处理</span>
              <span v-else-if="claim.status === 'completed'">当前状态：已完成</span>
              <span v-else-if="claim.status === 'rejected'">当前状态：已驳回</span>

              <el-button
                v-if="getClaimItem(claim)?.id"
                size="small"
                plain
                @click="$router.push(`/items/${getClaimItem(claim).id}`)"
              >
                查看关联物品
              </el-button>
              <el-button
                v-if="canWrongReturn(claim)"
                size="small"
                type="warning"
                plain
                @click="$router.push(`/items/${getClaimItem(claim).id}/claim?type=wrong_return`)"
              >
                领错归还
              </el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="wrongReturnDialog" title="领错归还申请" width="480px">
      <p style="margin-bottom: 16px; color: var(--muted);">
        如果你发现认领的物品并非自己的，可以发起领错归还。管理员审核后会安排重新入库。
      </p>
      <el-form :model="wrongReturnForm" label-position="top">
        <el-form-item label="归还原因">
          <el-input
            v-model="wrongReturnForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明领错的原因，例如：物品相似但细节不符、误认等"
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
            v-model.trim="wrongReturnForm.phone"
            placeholder="用于管理员联系确认归还事宜"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wrongReturnDialog = false">取消</el-button>
        <el-button type="warning" :loading="wrongReturnLoading" @click="submitWrongReturn">
          提交归还申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.my-page {
  padding-top: 42px;
}

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.section-title h2 {
  font-size: clamp(32px, 4vw, 48px);
  letter-spacing: -.05em;
}

.section-title p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
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

.post-list,
.loading-list {
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

.row-main {
  min-width: 0;
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
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.edit-btn {
  background: linear-gradient(135deg, #315fff, #4f7cff);
  border: 0;
  color: #fff;
}
.edit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e4af5, #3d6aff);
  color: #fff;
}
.edit-btn.is-disabled {
  background: rgba(49, 94, 255, 0.25);
  color: rgba(255, 255, 255, 0.65);
  border: 0;
}

.claim-row {
  align-items: flex-start;
}

.claim-extra {
  min-width: 190px;
  display: grid;
  gap: 8px;
  color: #8b95a7;
  font-size: 13px;
  text-align: right;
}

.identity-line,
.privacy-line,
.reason-line {
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: 14px;
  line-height: 1.65;
  font-size: 13px;
}

.identity-line {
  background: rgba(255, 159, 67, .10);
  color: #92400e;
}

.privacy-line {
  background: rgba(79, 124, 255, .08);
  color: #315fff;
}

.reason-line {
  background: rgba(244, 63, 94, .08);
  color: #be123c;
}

.skeleton-row {
  padding: 20px;
  display: grid;
  gap: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 14px 34px rgba(31, 45, 92, .08);
}

@media (max-width: 880px) {
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .mini-stats {
    grid-template-columns: 1fr;
  }

  .post-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .row-actions,
  .claim-extra {
    justify-content: flex-start;
    text-align: left;
  }
}
</style>
