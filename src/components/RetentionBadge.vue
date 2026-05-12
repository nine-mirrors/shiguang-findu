<template>
  <div class="retention" :class="state">
    <div class="retention-main">
      <span class="storage-icon"></span>
      <div>
        <b>{{ title }}</b>
        <p>{{ desc }}</p>
      </div>
    </div>
    <el-tag class="soft-tag">{{ item.storageCode || '未入库' }}</el-tag>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ item: { type:Object, required:true } })
const daysLeft = computed(() => {
  const days = Number(props.item.retentionDays || 30)
  const created = new Date((props.item.createdAt || '').replace(/-/g, '/')).getTime()
  if (!Number.isFinite(created)) return days
  return Math.ceil((created + days * 86400000 - Date.now()) / 86400000)
})
const state = computed(() => daysLeft.value < 0 ? 'overdue' : daysLeft.value <= 7 ? 'warning' : 'normal')
const title = computed(() => daysLeft.value < 0 ? `已滞留 ${Math.abs(daysLeft.value)} 天` : `保管期剩余 ${daysLeft.value} 天`)
const desc = computed(() => {
  if (props.item.status === 'done') return '物品已完成交接，系统保留记录用于追溯。'
  if (daysLeft.value < 0) return '建议管理员转入滞留处理：联系失主、移交失物柜、捐赠或按校规处理。'
  if (daysLeft.value <= 7) return '即将到期，建议管理员优先提醒或转入集中保管。'
  return '保管期内保持公开展示，认领需通过细节核验。'
})
</script>
<style scoped>
.retention { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:16px; border-radius:22px; border:1px solid rgba(17,24,39,.08); background:rgba(79,124,255,.06); }
.retention.warning { background:rgba(255,176,32,.11); }
.retention.overdue { background:rgba(255,92,122,.10); }
.retention-main { display:flex; gap:12px; align-items:center; }
.storage-icon { width:42px; height:42px; border-radius:16px; background:white; position:relative; box-shadow:0 10px 22px rgba(31,45,92,.08); }
.storage-icon::before { content:''; position:absolute; left:10px; right:10px; top:13px; height:16px; border:3px solid var(--primary); border-top-width:5px; border-radius:4px; }
b { display:block; margin-bottom:4px; } p { margin:0; color:var(--muted); line-height:1.55; }
@media(max-width:700px){.retention{align-items:flex-start;flex-direction:column}}
</style>
