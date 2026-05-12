<template>
  <div class="profile-page container">
    <section class="profile-card glass-card fade-up">
      <div class="avatar-big">{{ userStore.avatarText }}</div>
      <div><span class="kicker">个人中心</span><h1>{{ userStore.displayName }}</h1><p>{{ userStore.user?.email }}</p></div>
      <div class="profile-actions"><el-button @click="$router.push('/my-posts')">我的发布</el-button><el-button type="primary" @click="$router.push('/publish')">发布信息</el-button></div>
    </section>
    <section class="profile-grid">
      <div class="glass-card panel"><h2>账号信息</h2><p>角色：{{ userStore.user?.role === 'admin' ? '管理员' : '学生用户' }}</p><p>登录方式：邮箱 + 密码</p><p>用户名用途：页面昵称、头像首字母、发布人展示。</p></div>
      <div class="glass-card panel"><h2>体验说明</h2><p>当前版本为前端 mock 演示版。接 Laravel 后端时，保留登录返回 token 和 user 信息即可。</p></div>
    </section>
  </div>
</template>
<script setup>
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
</script>
<style scoped>
.profile-page{padding-top:42px}.profile-card{padding:34px;display:flex;align-items:center;gap:24px}.avatar-big{width:96px;height:96px;display:grid;place-items:center;border-radius:32px;background:linear-gradient(135deg,var(--primary),var(--success));color:#fff;font-size:42px;font-weight:1000;box-shadow:0 20px 45px rgba(79,124,255,.22)}h1{margin:14px 0 6px;font-size:42px;letter-spacing:-.05em}.profile-card p{color:var(--muted);margin:0}.profile-actions{margin-left:auto;display:flex;gap:10px}.profile-grid{margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:20px}.panel{padding:26px}.panel p{color:var(--muted);line-height:1.8}@media(max-width:760px){.profile-card{align-items:flex-start;flex-direction:column}.profile-actions{margin-left:0}.profile-grid{grid-template-columns:1fr}}
</style>
