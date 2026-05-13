<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  value: {
    type: [Number, String],
    default: 0
  },
  suffix: {
    type: String,
    default: ''
  }
})

const current = ref(0)
let timer = 0

const isNumericValue = computed(() => {
  return props.value !== '' && Number.isFinite(Number(props.value))
})

const display = computed(() => {
  if (!isNumericValue.value) return `${props.value}${props.suffix}`

  return `${current.value}${props.suffix}`
})

const stopAnimate = () => {
  if (timer) cancelAnimationFrame(timer)
}

const animate = () => {
  stopAnimate()

  if (!isNumericValue.value) return

  const from = current.value
  const to = Number(props.value)
  const start = performance.now()
  const duration = 850

  const tick = now => {
    const progress = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)

    current.value = Math.round(from + (to - from) * eased)

    if (progress < 1) timer = requestAnimationFrame(tick)
  }

  timer = requestAnimationFrame(tick)
}

onMounted(animate)

watch(() => props.value, animate)

onBeforeUnmount(stopAnimate)
</script>

<template>
  <span>{{ display }}</span>
</template>