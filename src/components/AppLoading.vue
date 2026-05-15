<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<template>
  <transition name="fade">
    <div v-if="visible" class="app-loading-overlay">
      <div class="app-loading-box">
        <div class="spinner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <p class="loading-text">{{ text }}</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.app-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
}

.app-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.spinner {
  width: 40px;
  height: 40px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.spinner svg {
  width: 100%;
  height: 100%;
}

.loading-text {
  margin: 0;
  font-size: 14px;
  color: #475569;
  letter-spacing: 0.5px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
