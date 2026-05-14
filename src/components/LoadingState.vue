<script setup>
const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div :class="['loading-state', { fullscreen: props.fullscreen }]">
    <div class="loader">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
    <p v-if="props.text" class="loading-text">{{ props.text }}</p>
  </div>
</template>

<style scoped>
.loading-state {
  display: grid;
  place-items: center;
  padding: 60px 20px;
}

.fullscreen {
  min-height: 50vh;
}

.loader {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f7cff, #00b894);
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  margin-top: 16px;
  color: #4b5563;
  font-size: 14px;
}
</style>
