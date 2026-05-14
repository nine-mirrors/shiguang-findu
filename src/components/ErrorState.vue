<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '加载失败'
  },
  desc: {
    type: String,
    default: '请检查网络连接后重试。'
  },
  buttonText: {
    type: String,
    default: '重试'
  }
})

const emit = defineEmits(['retry'])

const handleRetry = () => emit('retry')
</script>

<template>
  <div class="error-state">
    <div class="error-illustration">⚠️</div>
    <h3>{{ props.title }}</h3>
    <p>{{ props.desc }}</p>
    <el-button v-if="props.buttonText" type="primary" @click="handleRetry">{{ props.buttonText }}</el-button>
  </div>
</template>

<style scoped>
.error-state {
  display: grid;
  place-items: center;
  padding: 60px 20px;
  text-align: center;
}

.error-illustration {
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(255, 107, 107, .12), rgba(255, 77, 79, .12));
  font-size: 42px;
}

h3 {
  margin: 0;
  font-size: 22px;
}

p {
  margin: 8px 0 18px;
  color: var(--muted);
}
</style>
