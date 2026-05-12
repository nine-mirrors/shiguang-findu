<template>
  <div class="verify-page container">
    <section class="page-title fade-up"><span class="kicker">分级实名认证</span><h1>基础服务轻量使用，贵重物品认领提高核验等级。</h1><p>按风险分级，不让普通浏览变复杂，也保证贵重物品认领安全。</p></section>
    <section class="verify-grid">
      <div class="level-card glass-card"><LineIcon name="user-check" tone="green"/><h2>基础认证</h2><p>登录后即可发布和浏览。适用于一般失物招领、收藏、站内通知。</p><el-tag type="success">当前：{{ current.level || 'basic' }}</el-tag></div>
      <div class="level-card glass-card strong"><LineIcon name="shield" tone="purple"/><h2>完整认证</h2><p>贵重物品认领、邮寄领取、争议处理建议启用完整认证，可扩展人脸核验和证件比对。</p><el-tag type="warning">第二优先级</el-tag></div>
      <el-form class="verify-form glass-card" label-position="top" :model="form">
        <h2>提交认证申请</h2>
        <el-form-item label="认证等级"><el-radio-group v-model="form.level"><el-radio-button label="basic">基础认证</el-radio-button><el-radio-button label="full">完整认证</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="真实姓名"><el-input v-model="form.realName" placeholder="仅管理员可见" /></el-form-item>
        <el-form-item label="学号 / 工号"><el-input v-model="form.studentNo" placeholder="前端展示时会脱敏" /></el-form-item>
        <el-form-item v-if="form.level === 'full'" label="证件/人脸核验说明"><el-input type="textarea" :rows="3" model-value="演示版不采集真实证件；上线后由后端接入实名认证服务，敏感数据加密存储。" disabled /></el-form-item>
        <el-button type="primary" @click="submit">提交认证</el-button>
      </el-form>
    </section>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchVerification, submitVerification } from '@/api/lostFound'
import { useUserStore } from '@/stores/user'
import LineIcon from '@/components/LineIcon.vue'
const userStore=useUserStore(); const current=ref({}); const form=reactive({level:'full',realName:'',studentNo:''})
onMounted(async()=>{ current.value=await fetchVerification(userStore.user?.id) })
async function submit(){ if(!form.realName || !form.studentNo){ ElMessage.warning('请填写姓名和学号'); return } await submitVerification(form,userStore.user); ElMessage.success('认证申请已提交') }
</script>
<style scoped>.verify-page{padding-top:42px}.page-title h1{max-width:960px;font-size:clamp(36px,5vw,58px);line-height:1.02;letter-spacing:-.06em;margin:18px 0 12px}.page-title p{color:var(--muted)}.verify-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:26px}.level-card,.verify-form{padding:26px}.level-card h2{margin:18px 0 10px}.level-card p{color:var(--muted);line-height:1.75}.level-card.strong{background:linear-gradient(135deg,rgba(255,255,255,.86),rgba(108,99,255,.08))}.verify-form{grid-column:1/-1}@media(max-width:760px){.verify-grid{grid-template-columns:1fr}}</style>
