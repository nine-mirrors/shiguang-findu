<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  fallbackSrc: {
    type: String,
    default: ''
  },
  fallbackText: {
    type: String,
    default: ''
  },
  round: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['error', 'load'])

const imgError = ref(false)
const imgLoading = ref(true)

const handleError = (e) => {
  imgError.value = true
  imgLoading.value = false
  emit('error', e)
}

const handleLoad = (e) => {
  imgLoading.value = false
  emit('load', e)
}
</script>

<template>
  <div class="image-container" :class="{ round }">
    <div v-if="imgLoading" class="image-loading">
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
    </div>

    <img
      v-else-if="!imgError && src"
      :src="src"
      :alt="alt"
      @error="handleError"
      @load="handleLoad"
      class="image-content"
    />

    <div v-else class="image-fallback">
      <span v-if="fallbackText" class="fallback-text">{{ fallbackText }}</span>
      <span v-else class="fallback-icon">📷</span>
    </div>
  </div>
</template>

<style scoped>
.image-container {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.image-container.round {
  border-radius: 50%;
}

.image-loading {
  display: flex;
  align-items: center;
  gap: 6px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }
.loading-dot:nth-child(3) { animation-delay: 0s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.image-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #94a3b8;
  font-size: 24px;
}

.fallback-text {
  font-size: 14px;
  font-weight: 600;
}
</style>
