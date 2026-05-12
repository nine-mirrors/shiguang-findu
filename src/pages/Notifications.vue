<template>
  <div class="notify-page container">
    <section class="page-title fade-up">
      <span class="kicker">通知中心</span>
      <h1>系统消息、匹配推送、审核提醒集中处理。</h1>
      <p>第一优先级功能：站内通知 + 邮箱推送闭环。邮箱发送由 Laravel 后端完成，前端负责展示和状态读取。</p>
    </section>
    <section class="notify-layout">
      <div class="notify-list glass-card">
        <div v-for="n in list" :key="n.id" class="notify-item" :class="{ unread: !n.read }" @click="read(n)">
          <LineIcon :name="iconOf(n.type)" :tone="toneOf(n.type)" />
          <div>
            <div class="notify-head"><b>{{ n.title }}</b><el-tag v-if="!n.read" type="danger" round>未读</el-tag></div>
            <p>{{ n.content }}</p>
            <small>{{ n.createdAt }}</small>
          </div>
        </div>
      </div>
      <aside class="glass-card mail-card">
        <LineIcon name="file" tone="blue" />
        <h2>邮箱推送策略</h2>
        <p>注册验证码、发布审核结果、认领状态变化、新匹配信息、滞留提醒会进入邮件队列。邮件只做提醒，敏感信息需回平台查看。</p>
        <ul>
          <li>不在邮件中展示完整手机号、地址、证件号。</li>
          <li>Laravel 后端建议使用 Notification + Queue。</li>
          <li>站内消息与邮箱消息保持同一业务事件源。</li>
        </ul>
      </aside>
    </section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { fetchNotifications, markNotificationRead } from '@/api/lostFound'
import { useUserStore } from '@/stores/user'
import LineIcon from '@/components/LineIcon.vue'
const userStore = useUserStore(); const list = ref([])
function iconOf(type){ return type === 'match' ? 'spark' : type === 'audit' ? 'shield' : type === 'claim' ? 'user-check' : 'file' }
function toneOf(type){ return type === 'match' ? 'purple' : type === 'audit' ? 'orange' : type === 'claim' ? 'green' : 'blue' }
async function load(){ list.value = await fetchNotifications(userStore.user?.id) }
async function read(n){ if(!n.read){ await markNotificationRead(n.id); await load() } }
onMounted(load)
</script>
<style scoped>
.notify-page{padding-top:42px}.page-title h1{max-width:880px;font-size:clamp(36px,5vw,58px);line-height:1.02;letter-spacing:-.06em;margin:18px 0 12px}.page-title p{color:var(--muted);line-height:1.8}.notify-layout{display:grid;grid-template-columns:1fr 330px;gap:22px;margin-top:24px}.notify-list{padding:18px}.notify-item{display:grid;grid-template-columns:56px 1fr;gap:14px;padding:18px;border-radius:24px;cursor:pointer;transition:.25s ease}.notify-item:hover{background:rgba(79,124,255,.06);transform:translateY(-2px)}.notify-item.unread{background:linear-gradient(135deg,rgba(79,124,255,.08),rgba(0,184,148,.05))}.notify-head{display:flex;align-items:center;gap:10px}.notify-item p{margin:8px 0;color:var(--muted);line-height:1.7}.notify-item small{color:#94a3b8}.mail-card{padding:24px;align-self:start}.mail-card h2{margin:18px 0 10px}.mail-card p,.mail-card li{color:var(--muted);line-height:1.75}.mail-card ul{padding-left:20px}@media(max-width:880px){.notify-layout{grid-template-columns:1fr}}
</style>
