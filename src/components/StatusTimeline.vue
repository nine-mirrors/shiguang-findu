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
<script setup>
import { computed } from 'vue'
const props = defineProps({ item: Object })
const steps = computed(() => [
  { title: '信息已提交', desc: '发布人已补充物品关键特征' },
  { title: props.item?.auditStatus === 'approved' ? '审核已通过' : '等待管理员审核', desc: '平台过滤重复和无效信息' },
  { title: props.item?.type === 'lost' ? '协寻进行中' : '等待失主认领', desc: '用户可通过搜索、匹配推荐找到它' },
  { title: props.item?.type === 'lost' ? '物品已找回' : '物品已认领', desc: '发布人确认后关闭信息' }
])
const activeIndex = computed(() => {
  if (props.item?.status === 'done') return 3
  if (props.item?.auditStatus === 'approved') return 2
  if (props.item?.auditStatus === 'pending') return 0
  return 1
})
</script>
<style scoped>
.timeline-box { display: grid; gap: 0; }
.step { position: relative; display: grid; grid-template-columns: 42px 1fr; gap: 14px; padding-bottom: 22px; color: #9ca3af; }
.step:not(:last-child)::after { content: ''; position: absolute; left: 20px; top: 40px; bottom: 0; width: 2px; background: rgba(17,24,39,.10); }
.node { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 999px; background: #eef2f7; color: #8a94a6; font-weight: 900; z-index: 1; }
.step.active { color: var(--ink); }
.step.active .node { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; box-shadow: 0 10px 24px rgba(79,124,255,.28); }
.step.active:not(:last-child)::after { background: linear-gradient(180deg, var(--primary), rgba(79,124,255,.10)); }
h4 { margin: 1px 0 5px; }
p { margin: 0; color: var(--muted); line-height: 1.55; }
</style>
