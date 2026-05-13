<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LineIcon from '@/components/LineIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { addAdminBlacklistApi, getAdminBlacklistsApi } from '@/api/admin'

const props = defineProps({
  tab: {
    type: String,
    default: 'blacklist'
  }
})

const active = ref(props.tab)
const blacklists = ref([])
const loading = ref(false)
const submitLoading = ref(false)

const form = reactive({
  userId: '',
  reason: '',
  limitType: 'all'
})

const normalizeList = res => {
  const payload = res?.data || res
  const list = payload?.list || payload?.data || payload?.items || payload || []

  return Array.isArray(list) ? list : []
}

const getUser = item => item.user || item.member || null
const getUsername = item => getUser(item)?.username || item.username || `用户 #${item.user_id || item.userId || '-'}`
const getEmail = item => getUser(item)?.email || item.email || '邮箱未返回'
const getUserId = item => item.user_id || item.userId || getUser(item)?.id || '-'
const getReason = item => item.reason || '未填写原因'
const getStatus = item => item.status || 'active'
const getLimitType = item => item.limit_type || item.limitType || 'all'
const getCreatedAt = item => item.created_at || item.createdAt || '时间待补充'

const limitText = type => {
  switch (type) {
    case 'publish':
      return '限制发布'
    case 'claim':
      return '限制认领'
    case 'all':
      return '限制全部'
    default:
      return '限制全部'
  }
}

const statusText = status => {
  switch (status) {
    case 'inactive':
      return '已解除'
    default:
      return '限制中'
  }
}

const statusType = status => {
  switch (status) {
    case 'inactive':
      return 'info'
    default:
      return 'danger'
  }
}

const load = async () => {
  loading.value = true

  try {
    const res = await getAdminBlacklistsApi()
    blacklists.value = normalizeList(res)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.userId = ''
  form.reason = ''
  form.limitType = 'all'
}

const submitBlacklist = async () => {
  if (!form.userId) return ElMessage.warning('请填写用户 ID')
  if (!form.reason.trim()) return ElMessage.warning('请填写加入黑名单原因')

  submitLoading.value = true

  try {
    await addAdminBlacklistApi({
      userId: form.userId,
      reason: form.reason,
      limitType: form.limitType
    })

    ElMessage.success('已加入黑名单')
    resetForm()
    await load()
  } finally {
    submitLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="risk-page fade-up">
    <el-tabs v-model="active" class="admin-tabs">
      <el-tab-pane label="实名认证审核" name="verify">
        <section class="reserve-card glass-card">
          <LineIcon name="user-check" tone="orange" />

          <div>
            <h2>实名认证审核暂作为第二优先级预留能力</h2>

            <p>当前阶段优先保证失物发布、认领审核、交接处理、通知与黑名单等主流程联调。实名认证审核列表暂不纳入当前联调范围，后续进入第二优先级阶段后再补齐。</p>

            <div class="reserve-flow">
              <div>
                <b>当前已保留的能力</b>
                <span>用户可提交基础认证或完整认证申请</span>
                <span>用户可查看自己的认证状态</span>
                <span>管理员审核动作可在后续列表补齐后接入</span>
              </div>

              <div>
                <b>当前暂不联调</b>
                <span>管理员认证申请列表</span>
                <span>认证材料集中查看</span>
                <span>批量筛选认证状态</span>
              </div>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="黑名单管理" name="blacklist">
        <section class="blacklist-layout">
          <div class="blacklist-form glass-card">
            <h2>添加黑名单</h2>

            <p>用于限制恶意发布、频繁认领失败、虚假信息等异常用户。当前版本按用户 ID 添加，避免额外引入用户管理接口。</p>

            <el-form :model="form" label-position="top">
              <el-form-item label="用户 ID">
                <el-input v-model.trim="form.userId" placeholder="请输入需要限制的用户 ID" />
              </el-form-item>

              <el-form-item label="限制类型">
                <el-radio-group v-model="form.limitType">
                  <el-radio-button label="publish">限制发布</el-radio-button>
                  <el-radio-button label="claim">限制认领</el-radio-button>
                  <el-radio-button label="all">限制全部</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="限制原因">
                <el-input v-model.trim="form.reason" type="textarea" :rows="4" placeholder="例如：多次认领失败、疑似冒领、发布虚假信息等" />
              </el-form-item>

              <el-button type="danger" :loading="submitLoading" @click="submitBlacklist">加入黑名单</el-button>
            </el-form>
          </div>

          <section class="risk-list">
            <EmptyState v-if="!loading && !blacklists.length" title="暂无黑名单记录" desc="添加黑名单后，会在这里集中展示限制记录。" />

            <div v-for="item in blacklists" :key="item.id" class="risk-row glass-card">
              <LineIcon name="users" :tone="getStatus(item) === 'inactive' ? 'blue' : 'red'" />

              <div>
                <div class="title">
                  <b>{{ getUsername(item) }}</b>
                  <el-tag>{{ getEmail(item) }}</el-tag>
                  <el-tag :type="statusType(getStatus(item))">{{ statusText(getStatus(item)) }}</el-tag>
                  <el-tag type="warning">{{ limitText(getLimitType(item)) }}</el-tag>
                </div>

                <p>用户 #{{ getUserId(item) }} · {{ getCreatedAt(item) }}</p>

                <small>{{ getReason(item) }}</small>
              </div>
            </div>
          </section>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.admin-tabs {
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.reserve-card {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 16px;
  padding: 24px;
  background: #fff;
}

.reserve-card h2 {
  margin: 0 0 10px;
}

.reserve-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.reserve-flow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 18px;
}

.reserve-flow div {
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
}

.reserve-flow b {
  display: block;
  margin-bottom: 8px;
}

.reserve-flow span {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 13px;
}

.blacklist-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 18px;
}

.blacklist-form {
  align-self: start;
  padding: 24px;
  background: #fff;
}

.blacklist-form h2 {
  margin: 0 0 8px;
}

.blacklist-form p {
  margin: 0 0 18px;
  color: var(--muted);
  line-height: 1.75;
}

.risk-list {
  display: grid;
  gap: 14px;
}

.risk-row {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 16px;
  align-items: center;
  padding: 18px;
  background: #fff;
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.risk-row p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.7;
}

.risk-row small {
  color: #8b95a7;
}

@media (max-width: 920px) {
  .blacklist-layout,
  .reserve-flow {
    grid-template-columns: 1fr;
  }

  .risk-row,
  .reserve-card {
    grid-template-columns: 1fr;
  }
}
</style>