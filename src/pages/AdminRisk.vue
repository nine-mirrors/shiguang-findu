<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/format'
import LineIcon from '@/components/LineIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  addAdminBlacklistApi,
  auditAdminVerificationApi,
  deleteAdminBlacklistApi,
  getAdminBlacklistsApi,
  getAdminUsersApi,
  getAdminVerificationsApi,
  releaseAdminBlacklistApi
} from '@/api/admin'

const props = defineProps({
  tab: {
    type: String,
    default: 'verify'
  }
})
const blacklistTab = ref('create')
const active = ref(props.tab || 'verify')

const blacklists = ref([])
const verifications = ref([])

const loading = ref(false)
const verifyLoading = ref(false)
const submitLoading = ref(false)
const actionLoading = ref(new Set())

const verifyStatus = ref('pending')
const verifyLevel = ref('all')
const verifyKeyword = ref('')

const rejectDialog = ref(false)
const rejectReason = ref('')
const currentRejectVerification = ref(null)

const releaseDialog = ref(false)
const releaseReason = ref('')
const currentReleaseBlacklist = ref(null)

const userSearchLoading = ref(false)
const userSearchOptions = ref([])

// 黑名单分页
const blacklistCurrentPage = ref(1)
const blacklistPageSize = ref(5)

const paginatedBlacklists = computed(() => {
  const start = (blacklistCurrentPage.value - 1) * blacklistPageSize.value
  return blacklists.value.slice(start, start + blacklistPageSize.value)
})

const form = reactive({
  userId: '',
  reason: '',
  limitType: 'all',
  startedAt: '',
  expiresAt: '',
  isPermanent: true
})

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

const getUser = item => item.user || item.member || null
const getUsername = item => getUser(item)?.username || getUser(item)?.name || item.username || `用户 #${item.user_id || item.userId || '-'}`
const getEmail = item => getUser(item)?.email || item.email || '邮箱未返回'
const getUserId = item => item.user_id || item.userId || getUser(item)?.id || '-'
const getReason = item => item.reason || '未填写原因'
const getStatus = item => item.status || 'active'
const getLimitType = item => item.limit_type || item.limitType || 'all'
const getCreatedAt = item => formatDateTime(item.created_at || item.createdAt || '')
const getStartedAt = item => formatDateTime(item.started_at || item.startedAt || item.created_at || item.createdAt || '')
const getExpiresAt = item => item.expires_at || item.expiresAt || ''
const getReleasedAt = item => formatDateTime(item.released_at || item.releasedAt || '')
const getReleaseReason = item => item.release_reason || item.releaseReason || ''
const getReleasedBy = item => item.released_by || item.releasedBy || ''

const getVerifyUser = item => item.user || null
const getVerifyUserEmail = item => getVerifyUser(item)?.email || '邮箱未返回'
const getVerifyUserName = item => getVerifyUser(item)?.username || getVerifyUser(item)?.name || `用户 #${item.user_id || '-'}`
const getVerifyStatus = item => item.status || 'pending'
const getVerifyLevel = item => item.level || 'basic'
const getVerifyReason = item => item.reject_reason || item.rejectReason || ''
const getVerifyCreatedAt = item => formatDateTime(item.created_at || item.createdAt || '')
const getFaceStatus = item => item.face_verify_status || item.faceVerifyStatus || 'not_required'

const isExpired = item => {
  const expiresAt = getExpiresAt(item)

  if (!expiresAt) return false

  // 支持多种日期格式：YYYY-MM-DD HH:mm:ss 或 ISO 格式
  let expiresTime

  if (expiresAt.includes(' ')) {
    // YYYY-MM-DD HH:mm:ss 格式
    expiresTime = new Date(expiresAt.replace(' ', 'T')).getTime()
  } else {
    // 尝试直接解析
    expiresTime = new Date(expiresAt).getTime()
  }

  return !isNaN(expiresTime) && expiresTime < Date.now()
}

const disabledPastDate = date => {
  return date.getTime() < Date.now() - 86400000
}

const getDisplayStatus = item => {
  // 优先使用后端的 effective_status 字段
  const effectiveStatus = item.effective_status || item.effectiveStatus
  if (effectiveStatus) {
    if (effectiveStatus === 'inactive') return 'inactive'
    if (effectiveStatus === 'expired' || effectiveStatus === 'pending') return 'expired'
    if (effectiveStatus === 'active') return 'active'
  }

  // 兼容旧逻辑（后端未返回 effective_status 时）
  if (getStatus(item) === 'inactive') return 'inactive'
  if (isExpired(item)) return 'expired'

  return 'active'
}

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

const blacklistStatusText = status => {
  switch (status) {
    case 'inactive':
      return '已解除'
    case 'expired':
      return '已过期'
    default:
      return '限制中'
  }
}

const blacklistStatusType = status => {
  switch (status) {
    case 'inactive':
      return 'info'
    case 'expired':
      return 'warning'
    default:
      return 'danger'
  }
}

const verifyStatusText = status => {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已驳回'
    default:
      return '待审核'
  }
}

const verifyStatusType = status => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'warning'
  }
}

const verifyLevelText = level => {
  switch (level) {
    case 'full':
      return '完整认证'
    default:
      return '基础认证'
  }
}

const faceStatusText = status => {
  switch (status) {
    case 'passed':
      return '已通过'
    case 'failed':
      return '未通过'
    case 'pending':
      return '待核验'
    default:
      return '无需人脸核验'
  }
}

const verifyCounts = computed(() => {
  return {
    total: verifications.value.length,
    pending: verifications.value.filter(item => getVerifyStatus(item) === 'pending').length,
    approved: verifications.value.filter(item => getVerifyStatus(item) === 'approved').length,
    rejected: verifications.value.filter(item => getVerifyStatus(item) === 'rejected').length
  }
})

const blacklistCounts = computed(() => {
  return {
    total: blacklists.value.length,
    active: blacklists.value.filter(item => getDisplayStatus(item) === 'active').length,
    expired: blacklists.value.filter(item => getDisplayStatus(item) === 'expired').length,
    inactive: blacklists.value.filter(item => getDisplayStatus(item) === 'inactive').length
  }
})

const filteredVerifications = computed(() => {
  const keyword = verifyKeyword.value.trim().toLowerCase()

  return verifications.value.filter(item => {
    const matchStatus = verifyStatus.value === 'all' || getVerifyStatus(item) === verifyStatus.value
    const matchLevel = verifyLevel.value === 'all' || getVerifyLevel(item) === verifyLevel.value

    if (!matchStatus || !matchLevel) return false
    if (!keyword) return true

    return `${item.real_name || ''}${item.student_no || ''}${item.phone || ''}${getVerifyUserEmail(item)}`.toLowerCase().includes(keyword)
  })
})

const verifyEmptyText = computed(() => {
  if (verifyStatus.value === 'pending') return '当前没有待审核的实名认证申请'
  if (verifyStatus.value === 'approved') return '当前没有已通过的实名认证申请'
  if (verifyStatus.value === 'rejected') return '当前没有已驳回的实名认证申请'

  return '当前没有实名认证申请'
})

const loadVerifications = async () => {
  verifyLoading.value = true

  try {
    const res = await getAdminVerificationsApi({
      status: verifyStatus.value === 'all' ? undefined : verifyStatus.value,
      level: verifyLevel.value === 'all' ? undefined : verifyLevel.value,
      keyword: verifyKeyword.value.trim() || undefined
    })

    verifications.value = normalizeList(res)
  } finally {
    verifyLoading.value = false
  }
}

const loadBlacklists = async () => {
  loading.value = true

  try {
    const res = await getAdminBlacklistsApi()
    blacklists.value = normalizeList(res)
  } finally {
    loading.value = false
  }
}

const load = async () => {
  await Promise.all([
    loadVerifications(),
    loadBlacklists()
  ])
}

const approveVerification = async item => {
  try {
    await runAction('verification', item.id, async () => {
      await auditAdminVerificationApi(item.id, {
        status: 'approved',
        rejectReason: ''
      })

      ElMessage.success('实名认证已通过')
      await loadVerifications()
    })
  } catch {
    ElMessage.error('操作失败，请稍后重试')
  }
}

const openRejectVerification = item => {
  currentRejectVerification.value = item
  rejectReason.value = ''
  rejectDialog.value = true
}

const confirmRejectVerification = async () => {
  if (!currentRejectVerification.value) return

  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  const completed = await runAction('verification', currentRejectVerification.value.id, async () => {
    await auditAdminVerificationApi(currentRejectVerification.value.id, {
      status: 'rejected',
      rejectReason: rejectReason.value.trim()
    })

    ElMessage.success('实名认证已驳回')
  })

  if (!completed) return

  rejectDialog.value = false
  currentRejectVerification.value = null
  rejectReason.value = ''
  await loadVerifications()
}

const resetForm = () => {
  form.userId = ''
  form.reason = ''
  form.limitType = 'all'
  form.startedAt = ''
  form.expiresAt = ''
  form.isPermanent = true
  userSearchOptions.value = []
}

const searchUsers = async query => {
  if (!query || query.trim().length < 1) {
    userSearchOptions.value = []
    return
  }

  userSearchLoading.value = true

  try {
    const res = await getAdminUsersApi({
      keyword: query.trim(),
      page: 1,
      page_size: 20
    })
    const payload = res?.data || res
    const list = payload?.list || payload?.data || payload?.items || payload || []
    userSearchOptions.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败，请稍后重试')
    userSearchOptions.value = []
  } finally {
    userSearchLoading.value = false
  }
}

const submitBlacklist = async () => {
  if (submitLoading.value) return

  console.log('submitBlacklist - form.userId:', form.userId, 'type:', typeof form.userId)

  if (!form.userId) return ElMessage.warning('请填写用户 ID')
  if (!form.reason.trim()) return ElMessage.warning('请填写加入黑名单原因')
  if (!form.isPermanent && !form.expiresAt) return ElMessage.warning('请选择限制到期时间')

  submitLoading.value = true

  try {
    console.log('提交黑名单 - userId:', form.userId)
    await addAdminBlacklistApi({
      userId: form.userId,
      reason: form.reason,
      limitType: form.limitType,
      startedAt: form.startedAt,
      expiresAt: form.isPermanent ? null : form.expiresAt
    })

    ElMessage.success('已加入黑名单')
    resetForm()
    await loadBlacklists()
  } finally {
    submitLoading.value = false
  }
}

const openReleaseBlacklist = item => {
  currentReleaseBlacklist.value = item
  releaseReason.value = ''
  releaseDialog.value = true
}

const confirmReleaseBlacklist = async () => {
  if (!currentReleaseBlacklist.value) return

  if (!releaseReason.value.trim()) {
    ElMessage.warning('请填写解除原因')
    return
  }

  const completed = await runAction('blacklist', currentReleaseBlacklist.value.id, async () => {
    await releaseAdminBlacklistApi(currentReleaseBlacklist.value.id, {
      releaseReason: releaseReason.value.trim()
    })

    ElMessage.success('黑名单限制已解除')
  })

  if (!completed) return

  releaseDialog.value = false
  currentReleaseBlacklist.value = null
  releaseReason.value = ''
  await loadBlacklists()
}

const deleteBlacklist = async item => {
  try {
    await runAction('blacklist', item.id, async () => {
      await ElMessageBox.confirm(
        `确认删除「${getUsername(item)}」的黑名单记录吗？该操作仅用于误添加、测试误加或重复添加。`,
        '删除黑名单记录',
        {
          type: 'warning',
          confirmButtonText: '确认删除',
          cancelButtonText: '取消'
        }
      )

      await deleteAdminBlacklistApi(item.id)
      ElMessage.success('黑名单记录已删除')
      await loadBlacklists()
    })
  } catch (error) {
    if (!isDialogCancel(error)) {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

watch(
  () => props.tab,
  value => {
    active.value = value || 'verify'
  }
)

watch(
  () => [verifyStatus.value, verifyLevel.value],
  () => {
    loadVerifications()
  }
)

onMounted(load)
</script>

<template>
  <div class="risk-page fade-up">
    <el-tabs v-model="active" class="admin-tabs">
      <el-tab-pane label="实名认证审核" name="verify">
        <section class="verify-overview">
          <button type="button" :class="{ active: verifyStatus === 'all' }" @click="verifyStatus = 'all'">
            <b>{{ verifyCounts.total }}</b>
            <span>全部申请</span>
          </button>

          <button type="button" :class="{ active: verifyStatus === 'pending' }" @click="verifyStatus = 'pending'">
            <b>{{ verifyCounts.pending }}</b>
            <span>待审核</span>
          </button>

          <button type="button" :class="{ active: verifyStatus === 'approved' }" @click="verifyStatus = 'approved'">
            <b>{{ verifyCounts.approved }}</b>
            <span>已通过</span>
          </button>

          <button type="button" :class="{ active: verifyStatus === 'rejected' }" @click="verifyStatus = 'rejected'">
            <b>{{ verifyCounts.rejected }}</b>
            <span>已驳回</span>
          </button>
        </section>

        <div class="verify-toolbar">
          <div class="filter-pills">
            <button type="button" :class="{ active: verifyStatus === 'all' }" @click="verifyStatus = 'all'">全部</button>
            <button type="button" :class="{ active: verifyStatus === 'pending' }" @click="verifyStatus = 'pending'">待审核</button>
            <button type="button" :class="{ active: verifyStatus === 'approved' }" @click="verifyStatus = 'approved'">已通过</button>
            <button type="button" :class="{ active: verifyStatus === 'rejected' }" @click="verifyStatus = 'rejected'">已驳回</button>
          </div>

          <el-select v-model="verifyLevel" placeholder="认证等级" style="width: 140px">
            <el-option label="全部等级" value="all" />
            <el-option label="基础认证" value="basic" />
            <el-option label="完整认证" value="full" />
          </el-select>

          <el-input v-model="verifyKeyword" placeholder="搜索姓名 / 学号 / 手机号 / 邮箱" clearable @keyup.enter="loadVerifications" />

          <el-button :loading="verifyLoading" @click="loadVerifications">搜索 / 刷新</el-button>
        </div>

        <section v-if="verifyLoading" class="loading-list">
          <el-skeleton v-for="item in 3" :key="item" animated>
            <template #template>
              <div class="skeleton-row">
                <el-skeleton-item variant="h3" style="width: 36%" />
                <el-skeleton-item variant="text" style="width: 82%" />
                <el-skeleton-item variant="text" style="width: 52%" />
              </div>
            </template>
          </el-skeleton>
        </section>

        <section v-else class="verify-list">
          <EmptyState v-if="!filteredVerifications.length" title="暂无实名认证申请" :desc="verifyEmptyText" />

          <div v-for="item in filteredVerifications" :key="item.id" class="verify-row glass-card">
            <LineIcon name="user-check" :tone="getVerifyStatus(item) === 'approved' ? 'green' : getVerifyStatus(item) === 'rejected' ? 'red' : 'orange'" />

            <div class="verify-main">
              <div class="title">
                <b>{{ item.real_name || '未填写姓名' }}</b>
                <el-tag>{{ verifyLevelText(getVerifyLevel(item)) }}</el-tag>
                <el-tag :type="verifyStatusType(getVerifyStatus(item))">{{ verifyStatusText(getVerifyStatus(item)) }}</el-tag>
                <el-tag>{{ faceStatusText(getFaceStatus(item)) }}</el-tag>
              </div>

              <p>
                学号 / 工号：{{ item.student_no || '未填写' }}
                · 手机号：{{ item.phone || '未填写' }}
                · 证件后四位：{{ item.id_card_last4 || '未填写' }}
              </p>

              <small>
                提交用户：{{ getVerifyUserName(item) }}
                · 邮箱：{{ getVerifyUserEmail(item) }}
                · 提交时间：{{ getVerifyCreatedAt(item) }}
              </small>

              <div class="identity-note">
                审核时请核对姓名、学号、手机号与校园身份信息。完整认证可作为贵重物品认领和邮寄处理的重要辅助依据。
              </div>

              <div v-if="getVerifyReason(item)" class="reason-line">
                驳回原因：{{ getVerifyReason(item) }}
              </div>
            </div>

            <div class="actions">
              <el-button
                class="solid-action success-action"
                :loading="isActionLoading('verification', item.id)"
                :disabled="getVerifyStatus(item) === 'approved' || isActionLoading('verification', item.id)"
                @click="approveVerification(item)"
              >
                通过
              </el-button>

              <el-button
                class="soft-action danger-action"
                :loading="isActionLoading('verification', item.id)"
                :disabled="getVerifyStatus(item) === 'rejected' || isActionLoading('verification', item.id)"
                @click="openRejectVerification(item)"
              >
                驳回
              </el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="黑名单管理" name="blacklist">
  <section class="blacklist-overview">
    <div class="overview-card">
      <b>{{ blacklistCounts.total }}</b>
      <span>全部记录</span>
    </div>

    <div class="overview-card danger">
      <b>{{ blacklistCounts.active }}</b>
      <span>限制中</span>
    </div>

    <div class="overview-card warning">
      <b>{{ blacklistCounts.expired }}</b>
      <span>已过期</span>
    </div>

    <div class="overview-card muted">
      <b>{{ blacklistCounts.inactive }}</b>
      <span>已解除</span>
    </div>
  </section>

  <!-- 二级 tab：黑名单管理 -->
  <el-tabs
    v-model="blacklistTab"
    class="blacklist-inner-tabs"
  >
    <!-- 添加黑名单 -->
    <el-tab-pane
      label="添加黑名单"
      name="create"
    >
      <div class="blacklist-form glass-card">
        <div class="blacklist-form-head">
          <LineIcon name="alert" tone="red" />

          <div>
            <span class="form-kicker">风险管控</span>
            <h2>添加黑名单</h2>

            <p>
              用于限制恶意发布、频繁认领失败、虚假信息等异常用户。
              正常恢复权限请使用“解除限制”，误添加记录才使用“删除记录”。
            </p>
          </div>
        </div>

        <el-form
          class="blacklist-create-form"
          :model="form"
          label-position="top"
        >
          <el-form-item class="full-field" label="选择用户">
            <el-select
              v-model="form.userId"
              class="blacklist-user-select"
              filterable
              remote
              placeholder="输入用户名、学号或邮箱搜索"
              :remote-method="searchUsers"
              :loading="userSearchLoading"
              popper-class="user-search-dropdown"
            >
              <el-option
                v-for="u in userSearchOptions"
                :key="u.id"
                :label="u.username"
                :value="u.id"
              >
                <div class="user-search-option">
                  <el-avatar
                    :src="u.avatar"
                    :size="28"
                    style="
                      background: linear-gradient(135deg, #4f7cff, #00b894);
                      color: #fff;
                      font-size: 12px;
                      font-weight: 700;
                      flex-shrink: 0;
                    "
                  >
                    {{ u.username ? u.username.charAt(0) : 'U' }}
                  </el-avatar>

                  <div class="user-search-info">
                    <div class="user-search-name">
                      {{ u.username }}
                    </div>

                    <div class="user-search-meta">
                      ID: {{ u.id }} · {{ u.email }}
                    </div>
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 限制类型（改成真正 tab 风格） -->
          <el-form-item class="full-field" label="限制类型">
            <div class="limit-type-tabs">
              <button
                type="button"
                :class="{ active: form.limitType === 'publish' }"
                @click="form.limitType = 'publish'"
              >
                限制发布
              </button>

              <button
                type="button"
                :class="{ active: form.limitType === 'claim' }"
                @click="form.limitType = 'claim'"
              >
                限制认领
              </button>

              <button
                type="button"
                :class="{ active: form.limitType === 'all' }"
                @click="form.limitType = 'all'"
              >
                限制全部
              </button>
            </div>
          </el-form-item>

          <el-form-item class="full-field" label="风控时间">
            <div class="risk-time-box">
              <div class="risk-time-grid">
                <el-date-picker
                  v-model="form.startedAt"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="限制开始时间，默认当前"
                  :disabled-date="disabledPastDate"
                />

                <el-date-picker
                  v-if="!form.isPermanent"
                  v-model="form.expiresAt"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择限制到期时间"
                  :disabled-date="disabledPastDate"
                />

                <div v-else class="permanent-time">
                  长期限制
                </div>
              </div>

              <el-checkbox v-model="form.isPermanent" class="permanent-check">
                长期限制
              </el-checkbox>
            </div>
          </el-form-item>

          <el-form-item class="full-field reason-field" label="限制原因">
            <el-input
              v-model.trim="form.reason"
              type="textarea"
              :rows="4"
              placeholder="例如：多次认领失败、疑似冒领、发布虚假信息等"
            />
          </el-form-item>

          <div class="blacklist-submit-row">
            <el-button
              class="solid-action danger-solid-action blacklist-submit"
              :loading="submitLoading"
              @click="submitBlacklist"
            >
              加入黑名单
            </el-button>
          </div>
        </el-form>
      </div>
    </el-tab-pane>

    <!-- 风控用户管理 -->
    <el-tab-pane
      label="风控用户管理"
      name="manage"
    >
      <section class="risk-list">
        <EmptyState
          v-if="!loading && !blacklists.length"
          title="暂无黑名单记录"
          desc="添加黑名单后，会在这里集中展示限制记录。"
        />

        <div
          v-for="item in paginatedBlacklists"
          :key="item.id"
          class="risk-row glass-card"
        >
          <LineIcon
            name="users"
            :tone="
              getDisplayStatus(item) === 'active'
                ? 'red'
                : getDisplayStatus(item) === 'expired'
                ? 'orange'
                : 'blue'
            "
          />

          <div class="risk-main">
            <div class="title">
              <b>{{ getUsername(item) }}</b>

              <el-tag>
                {{ getEmail(item) }}
              </el-tag>

              <el-tag
                :type="blacklistStatusType(getDisplayStatus(item))"
              >
                {{ blacklistStatusText(getDisplayStatus(item)) }}
              </el-tag>

              <el-tag type="warning">
                {{ limitText(getLimitType(item)) }}
              </el-tag>
            </div>

            <p>
              用户 #{{ getUserId(item) }}
              · 创建时间：{{ getCreatedAt(item) || '时间未返回' }}
            </p>

            <div class="risk-time-line">
              <span>
                开始：{{ getStartedAt(item) || '默认当前时间' }}
              </span>

              <span>
                到期：
                {{
                  getExpiresAt(item)
                    ? formatDateTime(getExpiresAt(item))
                    : '长期限制'
                }}
              </span>
            </div>

            <small>
              限制原因：{{ getReason(item) }}
            </small>

            <div
              v-if="getDisplayStatus(item) === 'inactive'"
              class="release-line"
            >
              <span>
                解除时间：{{ getReleasedAt(item) || '时间未返回' }}
              </span>

              <span v-if="getReleasedBy(item)">
                解除人：#{{ getReleasedBy(item) }}
              </span>

              <span v-if="getReleaseReason(item)">
                解除原因：{{ getReleaseReason(item) }}
              </span>
            </div>
          </div>

          <div class="actions">
            <el-button
              v-if="getDisplayStatus(item) === 'active'"
              class="soft-action primary-action"
              :loading="isActionLoading('blacklist', item.id)"
              :disabled="isActionLoading('blacklist', item.id)"
              @click="openReleaseBlacklist(item)"
            >
              解除限制
            </el-button>

            <el-button
              class="soft-action danger-action"
              :loading="isActionLoading('blacklist', item.id)"
              :disabled="isActionLoading('blacklist', item.id)"
              @click="deleteBlacklist(item)"
            >
              删除记录
            </el-button>
          </div>
        </div>

        <!-- 黑名单分页 -->
        <div v-if="blacklists.length > blacklistPageSize" class="pagination-bar">
          <el-pagination
            v-model:current-page="blacklistCurrentPage"
            :page-size="blacklistPageSize"
            :total="blacklists.length"
            layout="prev, pager, next, jumper"
            background
          />
        </div>
      </section>
    </el-tab-pane>
  </el-tabs>
</el-tab-pane>
    </el-tabs>

    <el-dialog v-model="rejectDialog" title="填写实名认证驳回原因" width="480px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="例如：姓名与学号不一致、手机号无法确认、认证信息不完整等"
      />

      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button
          type="danger"
          :loading="!!currentRejectVerification && isActionLoading('verification', currentRejectVerification.id)"
          @click="confirmRejectVerification"
        >
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="releaseDialog" title="填写解除限制原因" width="480px">
      <el-input
        v-model="releaseReason"
        type="textarea"
        :rows="4"
        placeholder="例如：经核查用户已完成说明，解除限制"
      />

      <template #footer>
        <el-button @click="releaseDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="!!currentReleaseBlacklist && isActionLoading('blacklist', currentReleaseBlacklist.id)"
          @click="confirmReleaseBlacklist"
        >
          确认解除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-tabs {
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, .82);
  box-shadow: var(--shadow);
}

.verify-overview,
.blacklist-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
  padding: 6px;
}

.verify-overview button,
.overview-card {
  padding: 16px 18px;
  border: 1px solid rgba(79, 124, 255, .08);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .09), rgba(0, 184, 148, .05));
  text-align: left;
  transition: .22s ease;
}

.verify-overview button {
  cursor: pointer;
}

.verify-overview button:hover,
.verify-overview button.active {
  transform: translateY(-2px);
  border-color: rgba(79, 124, 255, .36);
  box-shadow: 0 14px 32px rgba(31, 45, 92, .10);
}

.overview-card.danger {
  background: linear-gradient(135deg, rgba(244, 63, 94, .10), rgba(255, 255, 255, .72));
}

.overview-card.warning {
  background: linear-gradient(135deg, rgba(255, 159, 67, .13), rgba(255, 255, 255, .72));
}

.overview-card.muted {
  background: linear-gradient(135deg, rgba(148, 163, 184, .13), rgba(255, 255, 255, .72));
}

.verify-overview b,
.overview-card b {
  display: block;
  font-size: 25px;
}

.verify-overview span,
.overview-card span {
  color: var(--muted);
  font-weight: 800;
}

.verify-toolbar {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px minmax(260px, 360px) auto;
  gap: 12px;
  align-items: center;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pills button {
  min-width: 76px;
  padding: 9px 16px;
  border: 1px solid rgba(79, 124, 255, .14);
  border-radius: 999px;
  background: rgba(255, 255, 255, .78);
  color: #64748b;
  font-weight: 900;
  cursor: pointer;
  transition: .22s ease;
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

.verify-list,
.loading-list {
  display: grid;
  gap: 14px;
}

.verify-row {
  padding: 18px;
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 16px;
  align-items: center;
  background: rgba(255, 255, 255, .92);
}

.verify-main,
.risk-main {
  min-width: 0;
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

.verify-main p,
.risk-row p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.7;
}

.verify-main small,
.risk-row small {
  color: #8b95a7;
}

.identity-note,
.reason-line {
  margin-top: 9px;
  padding: 9px 12px;
  border-radius: 14px;
  line-height: 1.65;
  font-size: 13px;
}

.identity-note {
  background: rgba(255, 159, 67, .10);
  color: #92400e;
}

.reason-line {
  background: rgba(244, 63, 94, .08);
  color: #be123c;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.actions :deep(.el-button),
.blacklist-form :deep(.el-button) {
  min-height: 38px;
  padding: 9px 18px;
  border-radius: 999px;
  font-weight: 900;
  border: none;
}

.solid-action {
  color: #fff !important;
  box-shadow: 0 12px 28px rgba(31, 45, 92, .14);
}

.soft-action {
  border: 1px solid transparent !important;
  background: rgba(255, 255, 255, .82) !important;
  box-shadow: 0 10px 24px rgba(31, 45, 92, .08);
}

.primary-action {
  color: #315fff !important;
  border-color: rgba(79, 124, 255, .22) !important;
  background: linear-gradient(135deg, rgba(79, 124, 255, .13), rgba(255, 255, 255, .88)) !important;
}

.success-action {
  color: #047857 !important;
  border-color: rgba(0, 184, 148, .24) !important;
  background: linear-gradient(135deg, rgba(0, 184, 148, .16), rgba(255, 255, 255, .88)) !important;
}

.danger-action {
  color: #dc2626 !important;
  border-color: rgba(244, 63, 94, .24) !important;
  background: linear-gradient(135deg, rgba(244, 63, 94, .14), rgba(255, 255, 255, .90)) !important;
}

.solid-action.success-action {
  color: #fff !important;
  background: linear-gradient(135deg, #16a34a, #00b894) !important;
}

.danger-solid-action {
  color: #fff !important;
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
}

.soft-action:hover,
.solid-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(31, 45, 92, .14);
}

.soft-action:disabled,
.solid-action:disabled {
  color: #94a3b8 !important;
  background: rgba(241, 245, 249, .9) !important;
  box-shadow: none;
  cursor: not-allowed;
}

.skeleton-row {
  padding: 20px;
  display: grid;
  gap: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 14px 34px rgba(31, 45, 92, .08);
}

.blacklist-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
}

.blacklist-inner-tabs {
  margin-top: 4px;
}

.blacklist-inner-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.blacklist-inner-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: rgba(17, 24, 39, .08);
}

.blacklist-inner-tabs :deep(.el-tabs__item) {
  height: 42px;
  padding: 0 18px;
  color: #64748b;
  font-weight: 900;
}

.blacklist-inner-tabs :deep(.el-tabs__item.is-active) {
  color: #dc2626;
}

.blacklist-inner-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ef4444, #ff9f43);
}

.blacklist-form {
  position: relative;
  align-self: start;
  max-width: 920px;
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
  border-color: rgba(244, 63, 94, .12);
  background: linear-gradient(180deg, rgba(255, 255, 255, .96), rgba(248, 250, 252, .92));
  box-shadow: 0 22px 60px rgba(31, 45, 92, .12);
}

.blacklist-form-head {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 26px 28px 22px;
  border-bottom: 1px solid rgba(244, 63, 94, .10);
  background:
    linear-gradient(135deg, rgba(244, 63, 94, .10), rgba(255, 159, 67, .08) 48%, rgba(255, 255, 255, .70));
}

.blacklist-form-head :deep(.line-icon) {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: rgba(255, 255, 255, .82);
}

.blacklist-form h2 {
  margin: 8px 0 8px;
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: 0;
}

.blacklist-form p {
  max-width: 680px;
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.form-kicker {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 999px;
  color: #be123c;
  background: rgba(244, 63, 94, .10);
  font-size: 12px;
  font-weight: 900;
}

.blacklist-create-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
  padding: 24px 28px 28px;
}

.blacklist-create-form .full-field,
.blacklist-submit-row {
  grid-column: 1 / -1;
}

.blacklist-create-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.blacklist-create-form :deep(.el-form-item__label) {
  margin-bottom: 9px;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.2;
}

.blacklist-create-form :deep(.el-input__wrapper),
.blacklist-create-form :deep(.el-select__wrapper),
.blacklist-create-form :deep(.el-textarea__inner) {
  border-radius: 16px !important;
  background: rgba(255, 255, 255, .92) !important;
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, .24) inset,
    0 10px 24px rgba(31, 45, 92, .04) !important;
}

.blacklist-create-form :deep(.el-input__wrapper),
.blacklist-create-form :deep(.el-select__wrapper) {
  min-height: 44px;
}

.blacklist-create-form :deep(.el-input__wrapper.is-focus),
.blacklist-create-form :deep(.el-select__wrapper.is-focused),
.blacklist-create-form :deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px rgba(244, 63, 94, .34) inset,
    0 12px 28px rgba(244, 63, 94, .08) !important;
}

.blacklist-create-form :deep(.el-textarea__inner) {
  min-height: 118px !important;
  padding: 14px 16px;
  resize: none;
}

.blacklist-user-select {
  width: 100%;
}

.limit-type-tabs {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.limit-type-tabs button {
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 16px;
  color: #475569;
  background: rgba(255, 255, 255, .84);
  box-shadow: 0 10px 22px rgba(31, 45, 92, .04);
  cursor: pointer;
  font-weight: 900;
  transition: .22s ease;
}

.limit-type-tabs button:hover {
  color: #dc2626;
  border-color: rgba(244, 63, 94, .25);
  transform: translateY(-1px);
}

.limit-type-tabs button.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #ef4444, #f97316);
  box-shadow: 0 14px 28px rgba(239, 68, 68, .20);
}

.risk-time-box {
  display: grid;
  gap: 12px;
  width: 100%;
}

.risk-time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.risk-time-box :deep(.el-date-editor.el-input) {
  width: 100%;
}

.permanent-time {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border: 1px dashed rgba(244, 63, 94, .28);
  border-radius: 16px;
  color: #be123c;
  background: rgba(244, 63, 94, .07);
  font-size: 13px;
  font-weight: 900;
}

.permanent-check {
  justify-self: start;
}

.blacklist-submit-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.blacklist-submit {
  min-width: 160px;
  min-height: 44px !important;
}

.risk-list {
  display: grid;
  gap: 14px;
}

.risk-row {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  background: #fff;
}

.risk-time-line {
  margin: 8px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.risk-time-line span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(79, 124, 255, .07);
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.release-line {
  margin-top: 10px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  border-radius: 14px;
  background: rgba(0, 184, 148, .08);
  color: #047857;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.el-dialog__footer .el-button) {
  min-width: 92px;
  height: 38px;
  border-radius: 999px;
  font-weight: 900;
}

:deep(.el-dialog__footer .el-button--primary) {
  border: none;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 10px 24px rgba(79, 124, 255, .18);
}

@media (max-width: 1080px) {
  .verify-toolbar {
    grid-template-columns: 1fr;
  }

  .blacklist-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 920px) {
  .blacklist-overview,
  .verify-overview {
    grid-template-columns: 1fr;
  }

  .risk-row,
  .verify-row {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .blacklist-form {
    border-radius: 22px;
  }

  .blacklist-form-head {
    grid-template-columns: 1fr;
    padding: 22px 20px 18px;
  }

  .blacklist-form h2 {
    font-size: 22px;
  }

  .blacklist-create-form {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 20px;
  }

  .limit-type-tabs,
  .risk-time-grid {
    grid-template-columns: 1fr;
  }

  .blacklist-submit-row {
    justify-content: stretch;
  }

  .blacklist-submit {
    width: 100%;
  }
}

/* 用户搜索下拉选项 - 使用全局选择器，因为下拉框被teleport到body */
.user-search-dropdown {
  min-width: 480px !important;
}

.user-search-dropdown .el-select-dropdown__list {
  padding: 8px 0;
  max-height: 520px !important;
}

.user-search-dropdown .el-select-dropdown__item {
  height: auto !important;
  padding: 10px 16px !important;
  line-height: 1.5 !important;
}

.user-search-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 4px;
}

.user-search-info {
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.user-search-name {
  font-weight: 700;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 6px;
}

.user-search-meta {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
}
</style>
