<script setup>
const reload = () => {
  window.location.reload()
}
</script>

<template>
  <div class="network-error container">
    <div class="error-card">
      <div class="error-illustration">🌐</div>
      <h1>网络连接失败</h1>
      <p>无法连接到服务器，请检查网络状态或联系管理员。</p>
      <div class="actions">
        <el-button type="primary" @click="reload">
          刷新页面
        </el-button>
        <el-button @click="$router.push('/home')">
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-error {
  padding-top: 90px;
  min-height: calc(100vh - 100px);
  display: grid;
  place-items: center;
}

.error-card {
  text-align: center;
  padding: 48px;
  border-radius: 32px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 24px 80px rgba(31, 45, 92, .12);
  max-width: 480px;
}

.error-illustration {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  border-radius: 32px;
  background: linear-gradient(135deg, rgba(79, 124, 255, .12), rgba(0, 184, 148, .12));
  font-size: 48px;
}

h1 {
  margin: 0 0 12px;
  font-size: 28px;
}

p {
  margin: 0 0 24px;
  color: var(--muted);
  line-height: 1.8;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
