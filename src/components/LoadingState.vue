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
    <div class="loader-wrapper">
      <div class="loader">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
      </div>
      <div class="center-dot"></div>
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

.loader-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
}

.loader {
  position: absolute;
  inset: 0;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #4f7cff;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.ring:nth-child(2) {
  animation-delay: -0.4s;
  border-top-color: #00b894;
}

.ring:nth-child(3) {
  animation-delay: -0.8s;
  border-top-color: #6c63ff;
}

.center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f7cff, #00b894);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 24px;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
}
</style>
