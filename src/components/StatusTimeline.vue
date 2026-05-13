<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({})
  }
})

const itemType = computed(() => props.item?.type || 'lost')

const auditStatus = computed(() => {
  return props.item?.auditStatus || props.item?.audit_status || 'pending'
})

const itemStatus = computed(() => {
  return props.item?.status || 'open'
})

const isCompleted = computed(() => {
  return ['done', 'completed'].includes(itemStatus.value)
})

const steps = computed(() => {
  const auditTitle = auditStatus.value === 'approved'
    ? '审核已通过'
    : auditStatus.value === 'rejected'
      ? '审核未通过'
      : '等待管理员审核'

  const auditDesc = auditStatus.value === 'rejected'
    ? props.item?.rejectReason || props.item?.reject_reason || '请根据驳回原因修改后重新提交'
    : '平台过滤重复、无效和敏感信息'

  return [
    {
      title: '信息已提交',
      desc: '发布人已补充物品关键特征'
    },
    {
      title: auditTitle,
      desc: auditDesc
    },
    {
      title: itemType.value === 'lost' ? '协寻进行中' : '等待失主认领',
      desc: '用户可通过搜索、分类筛选和匹配推荐找到它'
    },
    {
      title: itemType.value === 'lost' ? '物品已找回' : '物品已认领',
      desc: '发布人或管理员确认后关闭信息'
    }
  ]
})

const activeIndex = computed(() => {
  if (isCompleted.value) return 3
  if (auditStatus.value === 'approved') return 2
  if (auditStatus.value === 'rejected') return 1

  return 0
})
</script>

<template>
  <div class="timeline-box">
    <div v-for="(step, index) in steps" :key="step.title" class="step" :class="{ active: index <= activeIndex }">
      <div class="node">{{ index + 1 }}</div>

      <div>
        <h4>{{ step.title }}</h4>
        <p>{{ step.desc }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-box {
  display: grid;
  gap: 0;
}

.step {
  position: relative;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 14px;
  padding-bottom: 22px;
  color: #9ca3af;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 20px;
  top: 40px;
  bottom: 0;
  width: 2px;
  background: rgba(17, 24, 39, .10);
}

.node {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  z-index: 1;
  border-radius: 999px;
  background: #eef2f7;
  color: #8a94a6;
  font-weight: 900;
}

.step.active {
  color: var(--ink);
}

.step.active .node {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  box-shadow: 0 10px 24px rgba(79, 124, 255, .28);
}

.step.active:not(:last-child)::after {
  background: linear-gradient(180deg, var(--primary), rgba(79, 124, 255, .10));
}

h4 {
  margin: 1px 0 5px;
}

p {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}
</style>