<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LineIcon from '@/components/LineIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  createAnnouncementApi,
  createHandoverRecordApi,
  getAdminClaimsApi,
  getAdminOverdueItemsApi,
  getAnnouncementsApi,
  getDisputesApi,
  resolveDisputeApi,
  transferOverdueItemApi
} from '@/api/admin'

const props = defineProps({
  tab: {
    type: String,
    default: 'handover'
  }
})

const active = ref(props.tab)
const handovers = ref([])
const storageRows = ref([])
const announcements = ref([])
const disputes = ref([])
const loading = ref(false)

const notice = reactive({
  title: '',
  content: ''
})

const transferDialog = ref(false)
const transferTarget = ref(null)
const transferForm = reactive({
  target: '学院办公室',
  remark: ''
})

const resolveDialog = ref(false)
const resolveTarget = ref(null)
const resolveText = ref('')

const handoverDialog = ref(false)
const handoverTarget = ref(null)
const handoverForm = reactive({
  method: 'offline',
  methodText: '线下交接',
  remark: ''
})

const unresolvedDisputeCount = computed(() => {
  return disputes.value.filter(item => item.status !== 'resolved').length
})

const normalizeList = res => {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const normalizeHandovers = list => {
  return list.filter(item => ['approved', 'handover_pending'].includes(item.status))
}

const getClaimItem = claim => claim.item || claim.lost_found_item || claim.lostFoundItem || null
const getClaimItemId = claim => getClaimItem(claim)?.id || claim.item_id || claim.lost_found_item_id || ''
const getClaimMethod = claim => claim.method || claim.pickup_method || 'offline'
const getClaimProofText = claim => claim.proofText || claim.proof_text || ''
const getClaimantName = claim => claim.claimantName || claim.claimant_name || claim.user?.username || '申请人'
const getClaimScore = claim => claim.score || claim.match_score || 0
const getDeliveryAddress = claim => claim.deliveryAddress || claim.delivery_address || ''

const getStorageItem = row => row.item || row.lost_found_item || row.lostFoundItem || null
const getStorageCode = row => row.storageCode || row.storage_code || '未入库'
const getStorageLocation = row => row.storageLocation || row.storage_location || '未填写保管地点'
const getExpireAt = row => row.expireAt || row.expire_at || '时间待补充'
const getDisposalStatus = row => row.disposalStatus || row.disposal_status || 'normal'

const getAnnouncementCreatedAt = item => item.createdAt || item.created_at || '时间待补充'

const getDisputeItem = dispute => dispute.item || dispute.lost_found_item || dispute.lostFoundItem || null
const getDisputeClaimantName = dispute => dispute.claimantName || dispute.claimant_name || dispute.user?.username || '申请人'
const getDisputeCreatedAt = dispute => dispute.createdAt || dispute.created_at || '时间待补充'

const statusText = status => {
  switch (status) {
    case 'transferred':
      return '已移交'
    case 'near_expired':
      return '临近到期'
    case 'overdue':
      return '已滞留'
    default:
      return '正常保管'
  }
}

const statusTone = status => {
  switch (status) {
    case 'near_expired':
      return 'orange'
    case 'transferred':
      return 'green'
    default:
      return 'blue'
  }
}

const load = async () => {
  loading.value = true

  try {
    const [claimRes, storageRes, announcementRes, disputeRes] = await Promise.all([
      getAdminClaimsApi(),
      getAdminOverdueItemsApi(),
      getAnnouncementsApi(),
      getDisputesApi()
    ])

    handovers.value = normalizeHandovers(normalizeList(claimRes))
    storageRows.value = normalizeList(storageRes)
    announcements.value = normalizeList(announcementRes)
    disputes.value = normalizeList(disputeRes)
  } finally {
    loading.value = false
  }
}

const finishHandover = (row, method) => {
  handoverTarget.value = row
  handoverForm.method = method
  handoverForm.methodText = method === 'delivery' ? '邮寄交接' : '线下交接'
  handoverForm.remark = ''
  handoverDialog.value = true
}

const confirmHandover = async () => {
  if (!handoverTarget.value) return

  const claimId = handoverTarget.value.id
  const itemId = getClaimItemId(handoverTarget.value)

  if (!claimId || !itemId) return ElMessage.warning('交接记录缺少认领申请 ID 或物品 ID')

  await createHandoverRecordApi({
    claimId,
    itemId,
    method: handoverForm.method,
    remark: handoverForm.remark
  })

  ElMessage.success('已生成交接记录，后端应同步更新认领和物品状态')
  handoverDialog.value = false
  await load()
}

const openTransfer = row => {
  transferTarget.value = row
  transferForm.target = '学院办公室'
  transferForm.remark = ''
  transferDialog.value = true
}

const confirmTransfer = async () => {
  if (!transferTarget.value) return
  if (!transferForm.target.trim()) return ElMessage.warning('请填写移交对象')

  await transferOverdueItemApi(transferTarget.value.id, {
    target: transferForm.target,
    remark: transferForm.remark
  })

  ElMessage.success('已登记移交')
  transferDialog.value = false
  await load()
}

const submitNotice = async () => {
  if (!notice.title.trim() || !notice.content.trim()) return ElMessage.warning('请填写公告标题和内容')

  await createAnnouncementApi({
    title: notice.title,
    content: notice.content,
    status: 'published'
  })

  ElMessage.success('公告已发布，并生成站内通知')
  notice.title = ''
  notice.content = ''
  await load()
}

const openResolve = row => {
  resolveTarget.value = row
  resolveText.value = row.result || ''
  resolveDialog.value = true
}

const confirmResolve = async () => {
  if (!resolveTarget.value) return
  if (!resolveText.value.trim()) return ElMessage.warning('请填写处理结论')

  await resolveDisputeApi(resolveTarget.value.id, {
    result: resolveText.value
  })

  ElMessage.success('争议已结案')
  resolveDialog.value = false
  await load()
}

onMounted(load)
</script>

<template>
  <div class="ops-page fade-up">
    <section class="ops-summary">
      <div class="ops-tile glass-card">
        <LineIcon name="user-check" tone="green" />
        <span>待交接认领</span>
        <b>{{ handovers.length }}</b>
      </div>

      <div class="ops-tile glass-card">
        <LineIcon name="package" tone="orange" />
        <span>保管记录</span>
        <b>{{ storageRows.length }}</b>
      </div>

      <div class="ops-tile glass-card">
        <LineIcon name="megaphone" tone="blue" />
        <span>平台公告</span>
        <b>{{ announcements.length }}</b>
      </div>

      <div class="ops-tile glass-card">
        <LineIcon name="alert" tone="red" />
        <span>争议处理</span>
        <b>{{ unresolvedDisputeCount }}</b>
      </div>
    </section>

    <el-tabs v-model="active" class="admin-tabs">
      <el-tab-pane label="交接处理" name="handover">
        <section class="ops-list">
          <EmptyState v-if="!loading && !handovers.length" title="暂无待交接申请" desc="认领审核通过后，会进入这里进行线下或邮寄交接。" />

          <div v-for="claim in handovers" :key="claim.id" class="ops-row glass-card handover-row">
            <LineIcon :name="getClaimMethod(claim) === 'delivery' ? 'truck' : 'user-check'" :tone="getClaimMethod(claim) === 'delivery' ? 'orange' : 'green'" />

            <div>
              <div class="title">
                <b>{{ getClaimItem(claim)?.name || '关联物品已删除' }}</b>
                <el-tag type="success">待交接</el-tag>
                <el-tag>{{ getClaimMethod(claim) === 'delivery' ? '邮寄领取' : '线下领取' }}</el-tag>
              </div>

              <p>{{ getClaimProofText(claim) }}</p>

              <small>申请人：{{ getClaimantName(claim) }} · 手机：{{ claim.phone }} · 匹配度 {{ getClaimScore(claim) }}%</small>

              <div v-if="getDeliveryAddress(claim)" class="privacy-note">邮寄地址已加密保存，确认归属后由工作人员处理。</div>
            </div>

            <div class="actions">
              <el-button type="success" @click="finishHandover(claim, 'offline')">完成线下交接</el-button>
              <el-button type="primary" plain @click="finishHandover(claim, 'delivery')">登记邮寄交接</el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="滞留物品" name="storage">
        <section class="ops-list">
          <EmptyState v-if="!loading && !storageRows.length" title="暂无滞留物品" desc="超过保管期仍无人认领的物品会进入这里处理。" />

          <div v-for="row in storageRows" :key="row.id" class="ops-row glass-card">
            <LineIcon name="package" :tone="statusTone(getDisposalStatus(row))" />

            <div>
              <div class="title">
                <b>{{ getStorageItem(row)?.name || '物品已删除' }}</b>
                <el-tag>{{ statusText(getDisposalStatus(row)) }}</el-tag>
              </div>

              <p>{{ getStorageCode(row) }} · {{ getStorageLocation(row) }} · 到期 {{ getExpireAt(row) }}</p>

              <small>{{ row.remark }}</small>
            </div>

            <div class="actions">
              <el-button :disabled="getDisposalStatus(row) === 'transferred'" type="primary" plain @click="openTransfer(row)">登记移交</el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="公告发布" name="announcements">
        <div class="announce-box glass-card">
          <h2>发布平台公告</h2>

          <p>公告会同步进入用户通知中心，用于安全提醒、政策更新和热点区域提示。</p>

          <el-form :model="notice" label-position="top" class="notice-form">
            <el-form-item label="公告标题">
              <el-input v-model="notice.title" placeholder="例如：图书馆三楼失物高发提醒" />
            </el-form-item>

            <el-form-item label="公告内容">
              <el-input v-model="notice.content" type="textarea" :rows="4" placeholder="请输入公告内容" />
            </el-form-item>

            <el-button type="primary" @click="submitNotice">发布公告并通知用户</el-button>
          </el-form>
        </div>

        <section class="ops-list after">
          <EmptyState v-if="!loading && !announcements.length" title="暂无公告" desc="发布平台公告后，会在这里展示公告记录。" />

          <div v-for="item in announcements" :key="item.id" class="ops-row glass-card">
            <LineIcon name="megaphone" tone="blue" />

            <div>
              <div class="title">
                <b>{{ item.title }}</b>
                <el-tag>{{ item.status === 'published' ? '已发布' : '草稿' }}</el-tag>
              </div>

              <p>{{ item.content }}</p>

              <small>{{ getAnnouncementCreatedAt(item) }}</small>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="争议处理" name="disputes">
        <section class="ops-list">
          <EmptyState v-if="!loading && !disputes.length" title="暂无争议记录" desc="发生认领纠纷或领错归还争议时，会进入这里处理。" />

          <div v-for="item in disputes" :key="item.id" class="ops-row glass-card">
            <LineIcon name="alert" :tone="item.status === 'resolved' ? 'green' : 'red'" />

            <div>
              <div class="title">
                <b>{{ getDisputeItem(item)?.name || '关联物品' }}</b>
                <el-tag :type="item.status === 'resolved' ? 'success' : 'warning'">{{ item.status === 'resolved' ? '已结案' : '处理中' }}</el-tag>
              </div>

              <p>{{ item.reason }}</p>

              <small>申请人：{{ getDisputeClaimantName(item) }} · {{ getDisputeCreatedAt(item) }}</small>

              <p v-if="item.result" class="result">处理结论：{{ item.result }}</p>
            </div>

            <div class="actions">
              <el-button :disabled="item.status === 'resolved'" type="success" plain @click="openResolve(item)">填写结论</el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="handoverDialog" title="确认完成交接" width="500px">
      <el-form label-position="top">
        <el-form-item label="交接方式">
          <el-input v-model="handoverForm.methodText" disabled />
        </el-form-item>

        <el-form-item label="交接备注">
          <el-input v-model="handoverForm.remark" type="textarea" :rows="3" placeholder="例如：本人到服务台领取，工作人员核验证件和物品细节后交接。" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handoverDialog = false">取消</el-button>
        <el-button type="success" @click="confirmHandover">确认完成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferDialog" title="登记滞留物品移交" width="500px">
      <el-form label-position="top">
        <el-form-item label="移交对象">
          <el-input v-model="transferForm.target" placeholder="如：学院办公室 / 保卫处 / 公安等有关部门" />
        </el-form-item>

        <el-form-item label="移交备注">
          <el-input v-model="transferForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="transferDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer">确认移交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveDialog" title="填写争议处理结论" width="500px">
      <el-input v-model="resolveText" type="textarea" :rows="4" placeholder="例如：要求退回物品并重新入库 / 维持认领结果 / 移交相关部门处理" />

      <template #footer>
        <el-button @click="resolveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmResolve">保存结论</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ops-page {
  display: grid;
  gap: 18px;
}

.ops-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.ops-tile {
  padding: 18px;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  align-items: center;
}

.ops-tile span {
  color: var(--muted);
  font-weight: 800;
}

.ops-tile b {
  font-size: 26px;
  line-height: 1;
}

.admin-tabs {
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.ops-list {
  display: grid;
  gap: 14px;
}

.ops-list.after {
  margin-top: 18px;
}

.ops-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  background: rgba(255, 255, 255, .9);
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ops-row p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.7;
}

.ops-row small {
  color: #8b95a7;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.announce-box {
  padding: 24px;
}

.announce-box h2 {
  margin: 0 0 8px;
}

.announce-box p {
  color: var(--muted);
  line-height: 1.75;
}

.notice-form {
  margin-top: 16px;
}

.result,
.privacy-note {
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(0, 184, 148, .08);
  color: #047857 !important;
}

.privacy-note {
  margin-top: 10px;
  background: rgba(79, 124, 255, .08);
  color: #315fff !important;
}

@media (max-width: 920px) {
  .ops-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .ops-row {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .ops-summary {
    grid-template-columns: 1fr;
  }
}
</style>