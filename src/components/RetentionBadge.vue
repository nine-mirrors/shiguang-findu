<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const storageCode = computed(() => {
  return props.item.storageCode || props.item.storage_code || '未入库'
})

const retentionDays = computed(() => {
  return Number(props.item.retentionDays || props.item.retention_days || 30)
})

const createdAt = computed(() => {
  return props.item.createdAt || props.item.created_at || ''
})

const expireAt = computed(() => {
  return props.item.expireAt || props.item.expire_at || ''
})

const status = computed(() => {
  return props.item.status || 'open'
})

const isCompleted = computed(() => {
  return ['done', 'completed'].includes(status.value)
})

const parseTime = value => {
  if (!value) return NaN

  return new Date(String(value).replace(/-/g, '/')).getTime()
}

const daysLeft = computed(() => {
  const expireTime = parseTime(expireAt.value)

  if (Number.isFinite(expireTime)) {
    return Math.ceil((expireTime - Date.now()) / 86400000)
  }

  const createdTime = parseTime(createdAt.value)

  if (!Number.isFinite(createdTime)) return retentionDays.value

  return Math.ceil((createdTime + retentionDays.value * 86400000 - Date.now()) / 86400000)
})

const state = computed(() => {
  if (isCompleted.value) return 'done'
  if (daysLeft.value < 0) return 'overdue'
  if (daysLeft.value <= 7) return 'warning'

  return 'normal'
})

const title = computed(() => {
  if (isCompleted.value) return '交接已完成'
  if (daysLeft.value < 0) return `已滞留 ${Math.abs(daysLeft.value)} 天`

  return `保管期剩余 ${daysLeft.value} 天`
})

const desc = computed(() => {
  switch (state.value) {
    case 'done':
      return '物品已完成交接，系统保留记录用于追溯。'
    case 'overdue':
      return '建议管理员转入滞留处理：联系失主、移交失物柜、捐赠或按校规处理。'
    case 'warning':
      return '即将到期，建议管理员优先提醒或转入集中保管。'
    default:
      return '保管期内保持公开展示，认领需通过细节核验。'
  }
})
</script>

<template>
  <div class="retention" :class="state">
    <div class="retention-main">
      <span class="storage-icon"></span>

      <div>
        <b>{{ title }}</b>
        <p>{{ desc }}</p>
      </div>
    </div>

    <el-tag class="soft-tag">{{ storageCode }}</el-tag>
  </div>
</template>

<style scoped>
.retention {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(17, 24, 39, .08);
  background: rgba(79, 124, 255, .06);
}

.retention.warning {
  background: rgba(255, 176, 32, .11);
}

.retention.overdue {
  background: rgba(255, 92, 122, .10);
}

.retention.done {
  background: rgba(0, 184, 148, .10);
}

.retention-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.storage-icon {
  width: 42px;
  height: 42px;
  position: relative;
  border-radius: 16px;
  background: white;
  box-shadow: 0 10px 22px rgba(31, 45, 92, .08);
}

.storage-icon::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: 13px;
  height: 16px;
  border: 3px solid var(--primary);
  border-top-width: 5px;
  border-radius: 4px;
}

b {
  display: block;
  margin-bottom: 4px;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}

@media (max-width: 700px) {
  .retention {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>