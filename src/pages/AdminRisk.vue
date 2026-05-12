<template>
  <div class="risk-page fade-up">
    <el-tabs v-model="active" class="admin-tabs">
      <el-tab-pane label="实名认证审核" name="verify">
        <section class="risk-list">
          <div v-for="v in verifications" :key="v.id" class="risk-row glass-card">
            <LineIcon name="user-check" :tone="v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'red' : 'orange'" />
            <div><div class="title"><b>{{ v.realName || '未填写姓名' }}</b><el-tag>{{ v.level === 'full' ? '完整认证' : '基础认证' }}</el-tag><el-tag :type="statusType(v.status)">{{ verifyText(v.status) }}</el-tag></div><p>学号：{{ v.studentNo || '未填写' }} · 用户 #{{ v.userId }} · {{ v.createdAt }}</p><small>证件、人脸等敏感材料正式版仅管理员与工作人员可见。</small></div>
            <div class="actions"><el-button type="success" plain :disabled="v.status==='approved'" @click="audit(v,'approved')">通过</el-button><el-button type="danger" plain :disabled="v.status==='rejected'" @click="audit(v,'rejected')">驳回</el-button></div>
          </div>
        </section>
      </el-tab-pane>
      <el-tab-pane label="黑名单与异常用户" name="blacklist">
        <section class="risk-list">
          <div v-for="u in users" :key="u.id" class="risk-row glass-card">
            <LineIcon name="users" :tone="u.blacklist ? 'red' : u.claimFailed > 0 ? 'orange' : 'blue'" />
            <div><div class="title"><b>{{ u.username }}</b><el-tag>{{ u.email }}</el-tag><el-tag v-if="u.blacklist" type="danger">已限制</el-tag></div><p>发布 {{ u.publishTotal }} 条 · 认领 {{ u.claimTotal }} 次 · 失败 {{ u.claimFailed }} 次</p><small>{{ u.blacklist?.reason || '暂无明显异常，可继续观察。' }}</small></div>
            <div class="actions"><el-button type="danger" plain :disabled="Boolean(u.blacklist)" @click="blackUser(u)">加入黑名单</el-button></div>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import LineIcon from '@/components/LineIcon.vue'
import { auditVerification, fetchAdminUsers, fetchAdminVerifications, publishRiskAction } from '@/api/lostFound'
const active = ref('verify'); const verifications = ref([]); const users = ref([])
function verifyText(s){ return s === 'approved' ? '已通过' : s === 'rejected' ? '已驳回' : '待审核' }
function statusType(s){ return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning' }
async function load(){ verifications.value = await fetchAdminVerifications(); users.value = await fetchAdminUsers() }
async function audit(v,status){ await auditVerification(v.id,status,status==='rejected'?'认证材料不完整或信息不一致':''); ElMessage.success(status==='approved'?'认证已通过':'认证已驳回'); load() }
async function blackUser(u){
  const { value } = await ElMessageBox.prompt('请输入限制原因', '加入黑名单', { inputValue: '多次认领失败或存在异常操作', confirmButtonText: '确认', cancelButtonText: '取消' }).catch(()=>({}))
  if (!value) return
  await publishRiskAction({ action:'blacklist', userId:u.id, username:u.username, reason:value })
  ElMessage.success('已加入黑名单')
  load()
}
onMounted(load)
</script>
<style scoped>
.admin-tabs{padding:18px;border-radius:28px;background:rgba(255,255,255,.82);box-shadow:var(--shadow)}.risk-list{display:grid;gap:14px}.risk-row{display:grid;grid-template-columns:52px 1fr auto;gap:16px;align-items:center;padding:18px;background:#fff}.title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.risk-row p{margin:8px 0;color:var(--muted);line-height:1.7}.risk-row small{color:#8b95a7}.actions{display:flex;gap:8px}@media(max-width:820px){.risk-row{grid-template-columns:1fr}.actions{justify-content:flex-start}}
</style>
