<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/format'
import LineIcon from '@/components/LineIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppLoading from '@/components/AppLoading.vue'
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
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi
} from '@/api/category'

const props = defineProps({
  tab: {
    type: String,
    default: 'handover'
  }
})

const pageLoading = ref(false)
const active = ref(props.tab)
const handovers = ref([])
const storageRows = ref([])
const announcements = ref([])
const disputes = ref([])
const categories = ref([])
const loading = ref(false)

const categoryDialog = ref(false)
const categoryTarget = ref(null)
const categoryForm = reactive({
  name: '',
  sort: 0
})

const notice = reactive({
  title: '',
  content: ''
})

const transferDialog = ref(false)
const transferTarget = ref(null)
const transferForm = reactive({
  handoverTarget: '学院办公室',
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
const getClaimProofText = claim => claim.proofText || claim.proof_text || '暂无证明摘要'
const getClaimantName = claim => claim.claimantName || claim.claimant_name || claim.user?.name || claim.user?.username || '申请人'
const getDeliveryAddress = claim => claim.deliveryAddress || claim.delivery_address || ''

const getStorageItem = row => row.item || row.lost_found_item || row.lostFoundItem || null
const getStorageCode = row => row.storageCode || row.storage_code || '未入库'
const getStorageLocation = row => row.storageLocation || row.storage_location || '未填写保管地点'
const getExpireAt = row => row.expireAt || row.expire_at || '时间待补充'
const getDisposalStatus = row => row.disposalStatus || row.disposal_status || 'normal'

const getAnnouncementCreatedAt = item => formatDateTime(item.createdAt || item.created_at || '')

const getDisputeItem = dispute => dispute.item || dispute.lost_found_item || dispute.lostFoundItem || null
const getDisputeClaimantName = dispute => dispute.claimantName || dispute.claimant_name || dispute.user?.name || dispute.user?.username || '申请人'
const getDisputeCreatedAt = dispute => formatDateTime(dispute.createdAt || dispute.created_at || '')

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

const loadCategories = async () => {
  try {
    const res = await getCategoriesApi()
    const list = normalizeList(res)
    categories.value = list.map(item => {
      if (typeof item === 'string') return { id: item, name: item, sort: 0 }
      return { id: item.id, name: item.name, sort: item.sort ?? 0 }
    })
  } catch {
    categories.value = []
  }
}

const load = async () => {
  loading.value = true
  pageLoading.value = true

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
  } catch {
    ElMessage.error('加载运营数据失败')
  } finally {
    loading.value = false
    pageLoading.value = false
  }
}

const openCategoryDialog = (category = null) => {
  categoryTarget.value = category
  categoryForm.name = category?.name || ''
  categoryForm.sort = category?.sort ?? 0
  categoryDialog.value = true
}

const saveCategory = async () => {
  if (!categoryForm.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }

  try {
    if (categoryTarget.value) {
      await updateCategoryApi(categoryTarget.value.id, categoryForm)
      ElMessage.success('分类已更新')
    } else {
      await createCategoryApi(categoryForm)
      ElMessage.success('分类已创建')
    }
    categoryDialog.value = false
    await loadCategories()
  } catch {
    ElMessage.error('操作失败')
  }
}

const removeCategory = async (category) => {
  try {
    await deleteCategoryApi(category.id)
    ElMessage.success('分类已删除')
    await loadCategories()
  } catch {
    ElMessage.error('删除失败，该分类可能已被使用')
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

  ElMessage.success('交接记录已保存')
  handoverDialog.value = false
  await load()
}

const openTransfer = row => {
  transferTarget.value = row
  transferForm.handoverTarget = '学院办公室'
  transferForm.remark = ''
  transferDialog.value = true
}

const confirmTransfer = async () => {
  if (!transferTarget.value) return
  if (!transferForm.handoverTarget.trim()) return ElMessage.warning('请填写移交对象')

  await transferOverdueItemApi(transferTarget.value.id, {
    handoverTarget: transferForm.handoverTarget,
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

  ElMessage.success('公告已发布')
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

onMounted(() => {
  load()
  loadCategories()
})
</script>

<template>
  <AppLoading :visible="pageLoading" text="加载运营数据..." />

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

              <small>申请人：{{ getClaimantName(claim) }} · 手机：{{ claim.phone || '未填写' }}</small>

              <div class="identity-note">
                线下交接前需核验学生证、校园卡或其他校园身份凭证；邮寄交接前需确认注册邮箱、认领联系电话、校园身份信息和物品归属证明。
              </div>

              <div v-if="getDeliveryAddress(claim)" class="privacy-note">邮寄地址仅用于交接处理，确认归属后由管理员核验使用。</div>
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

              <small>{{ row.remark || '暂无备注' }}</small>
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

          <p>公告用于发布平台规则、安全提醒和服务通知。公告发布后，用户可在通知中心查看相关内容。</p>

          <el-form :model="notice" label-position="top" class="notice-form">
            <el-form-item label="公告标题">
              <el-input v-model="notice.title" placeholder="例如：图书馆三楼失物高发提醒" />
            </el-form-item>

            <el-form-item label="公告内容">
              <el-input v-model="notice.content" type="textarea" :rows="4" placeholder="请输入公告内容" />
            </el-form-item>

            <el-button type="primary" @click="submitNotice">发布公告</el-button>
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
          <EmptyState v-if="!loading && !disputes.length" title="暂无争议记录" desc="认领过程发生争议或领错归还时，会进入这里处理。" />

          <div v-for="item in disputes" :key="item.id" class="ops-row glass-card">
            <LineIcon name="alert" :tone="item.status === 'resolved' ? 'green' : 'red'" />

            <div>
              <div class="title">
                <b>{{ getDisputeItem(item)?.name || '关联物品' }}</b>
                <el-tag :type="item.status === 'resolved' ? 'success' : 'warning'">{{ item.status === 'resolved' ? '已结案' : '处理中' }}</el-tag>
              </div>

              <p>{{ item.reason || '暂无争议说明' }}</p>

              <small>申请人：{{ getDisputeClaimantName(item) }} · {{ getDisputeCreatedAt(item) }}</small>

              <p v-if="item.result" class="result">处理结论：{{ item.result }}</p>
            </div>

            <div class="actions">
              <el-button :disabled="item.status === 'resolved'" type="success" plain @click="openResolve(item)">填写结论</el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="分类管理" name="categories">
        <section class="ops-list">
          <div class="category-toolbar">
            <el-button type="primary" @click="openCategoryDialog()">新增分类</el-button>
          </div>

          <EmptyState v-if="!categories.length" title="暂无分类" desc="添加物品分类后，用户发布时可选择对应分类。" />

          <div v-for="item in categories" :key="item.id" class="ops-row glass-card">
            <LineIcon name="package" tone="blue" />

            <div>
              <div class="title">
                <b>{{ item.name }}</b>
                <span>排序：{{ item.sort }}</span>
              </div>
            </div>

            <div class="actions">
              <el-button type="primary" plain @click="openCategoryDialog(item)">编辑</el-button>
              <el-button type="danger" plain @click="removeCategory(item)">删除</el-button>
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
          <el-input
            v-model="handoverForm.remark"
            type="textarea"
            :rows="3"
            placeholder="例如：认领人出示学生证或校园身份凭证，管理员核验物品细节后完成交接。"
          />
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
          <el-input v-model="transferForm.handoverTarget" placeholder="如：学院办公室 / 保卫处 / 有关部门" />
        </el-form-item>

        <el-form-item label="移交备注">
          <el-input v-model="transferForm.remark" type="textarea" :rows="3" placeholder="请填写移交原因、交接地点或补充说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="transferDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer">确认移交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveDialog" title="填写争议处理结论" width="500px">
      <el-input v-model="resolveText" type="textarea" :rows="4" placeholder="例如：要求补充证明材料 / 维持原审核结果 / 重新核验物品归属" />

      <template #footer>
        <el-button @click="resolveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmResolve">保存结论</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialog" :title="categoryTarget ? '编辑分类' : '新增分类'" width="400px">
      <el-form label-position="top">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="例如：校园卡" />
        </el-form-item>

        <el-form-item label="排序值">
          <el-input-number v-model="categoryForm.sort" :min="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="categoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
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
.privacy-note,
.identity-note {
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: 14px;
  line-height: 1.7;
}

.result {
  background: rgba(0, 184, 148, .08);
  color: #047857 !important;
}

.privacy-note {
  background: rgba(79, 124, 255, .08);
  color: #315fff !important;
}

.identity-note {
  background: rgba(255, 159, 67, .10);
  color: #92400e;
  font-size: 13px;
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