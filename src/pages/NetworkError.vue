<script setup>
import { ref } from 'vue'
import LineIcon from '@/components/LineIcon.vue'

const reloading = ref(false)

const reload = () => {
  if (reloading.value) return

  reloading.value = true
  window.setTimeout(() => window.location.reload(), 180)
}
</script>

<template>
  <div class="network-error container">
    <section class="error-card glass-card" role="alert" aria-labelledby="network-error-title">
      <div class="error-illustration" aria-hidden="true">
        <LineIcon name="alert" tone="orange" />
      </div>

      <h1 id="network-error-title">网络连接失败</h1>

      <p>无法连接到服务器，请检查网络状态后重试，或联系管理员。</p>

      <div class="actions">
        <el-button
          type="primary"
          size="large"
          :loading="reloading"
          :disabled="reloading"
          @click="reload"
        >
          重新加载
        </el-button>

        <el-button size="large" @click="$router.push('/home')">
          返回首页
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.network-error {
  padding-top: 90px;
  padding-bottom: 40px;
  min-height: calc(100vh - 100px);
  display: grid;
  place-items: center;
}

.error-card {
  width: min(520px, 100%);
  text-align: center;
  padding: 48px;
}

.error-illustration {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  border-radius: 32px;
  background: linear-gradient(135deg, rgba(255, 176, 32, .14), rgba(79, 124, 255, .10));
}

:deep(.error-illustration .line-icon) {
  width: 64px;
  height: 64px;
  border-radius: 24px;
}

h1 {
  margin: 0 0 12px;
  color: var(--ink);
  font-size: clamp(26px, 4vw, 34px);
  line-height: 1.2;
  letter-spacing: -.02em;
}

p {
  margin: 0 0 24px;
  color: var(--muted);
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.actions .el-button {
  min-width: 132px;
  min-height: 44px;
  border-radius: 999px;
  font-weight: 900;
}

@media (max-width: 620px) {
  .network-error {
    padding-top: 48px;
    min-height: auto;
  }

  .error-card {
    padding: 34px 22px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions .el-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
