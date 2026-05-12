<template><span>{{ display }}</span></template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
const props = defineProps({ value: { type: Number, default: 0 }, suffix: { type: String, default: '' } })
const current = ref(0)
let timer = 0
function animate() {
  cancelAnimationFrame(timer)
  const from = current.value
  const to = Number(props.value) || 0
  const start = performance.now()
  const duration = 850
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - p, 3)
    current.value = Math.round(from + (to - from) * eased)
    if (p < 1) timer = requestAnimationFrame(tick)
  }
  timer = requestAnimationFrame(tick)
}
onMounted(animate)
watch(() => props.value, animate)
const display = computed(() => `${current.value}${props.suffix}`)
</script>
