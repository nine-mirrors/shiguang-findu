<template>
  <div class="ops-page fade-up">
    <section class="ops-summary">
      <div class="ops-tile glass-card"><LineIcon name="user-check" tone="green" /><span>待交接认领</span><b>{{ handovers.length }}</b></div>
      <div class="ops-tile glass-card"><LineIcon name="package" tone="orange" /><span>保管记录</span><b>{{ storageRows.length }}</b></div>
      <div class="ops-tile glass-card"><LineIcon name="megaphone" tone="blue" /><span>平台公告</span><b>{{ announcements.length }}</b></div>
      <div class="ops-tile glass-card"><LineIcon name="alert" tone="red" /><span>争议处理</span><b>{{ disputes.filter(d => d.status !== 'resolved').length }}</b></div>
    </section>

    <el-tabs v-model="active" class="admin-tabs">
      <el-tab-pane label="交接处理" name="handover">
        <section class="ops-list">
          <EmptyState v-if="!handovers.length" title="暂无待交接申请" desc="认领审核通过后，会进入这里进行线下或邮寄交接。" />
          <div v-for="claim in handovers" :key="claim.id" class="ops-row glass-card handover-row">
            <LineIcon :name="claim.method === 'mail' ? 'truck' : 'user-check'" :tone="claim.method === 'mail' ? 'orange' : 'green'" />
            <div>
              <div class="title"><b>{{ claim.item?.name || '关联物品已删除' }}</b><el-tag type="success">待交接</el-tag><el-tag>{{ claim.method === 'mail' ? '邮寄领取' : '线下领取' }}</el-tag></div>
              <p>{{ claim.proofText }}</p>
              <small>申请人：{{ claim.claimantName }} · 手机：{{ claim.phone }} · 匹配度 {{ claim.score }}%</small>
              <div v-if="claim.deliveryAddress" class="privacy-note">邮寄地址已加密保存，确认归属后由工作人员处理。</div>
            </div>
            <div class="actions">
              <el-button type="success" @click="finishHandover(claim, 'offline')">完成线下交接</el-button>
              <el-button type="primary" plain @click="finishHandover(claim, 'delivery')">登记邮寄交接</el-button>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="滞留物品" name="storage">
        <section class="ops-list">
          <div v-for="row in storageRows" :key="row.id" class="ops-row glass-card">
            <LineIcon name="package" :tone="row.disposalStatus === 'near_expired' ? 'orange' : row.disposalStatus === 'transferred' ? 'green' : 'blue'" />
            <div><div class="title"><b>{{ row.item?.name || '物品已删除' }}</b><el-tag>{{ statusText(row.disposalStatus) }}</el-tag></div><p>{{ row.storageCode }} · {{ row.storageLocation }} · 到期 {{ row.expireAt }}</p><small>{{ row.remark }}</small></div>
            <div class="actions"><el-button :disabled="row.disposalStatus==='transferred'" type="primary" plain @click="openTransfer(row)">登记移交</el-button></div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="公告发布" name="announcements">
        <div class="announce-box glass-card">
          <h2>发布平台公告</h2>
          <p>公告会同步进入用户通知中心，用于安全提醒、政策更新和热点区域提示。</p>
          <el-form :model="notice" label-position="top" class="notice-form">
            <el-form-item label="公告标题"><el-input v-model="notice.title" placeholder="例如：图书馆三楼失物高发提醒" /></el-form-item>
            <el-form-item label="公告内容"><el-input v-model="notice.content" type="textarea" :rows="4" placeholder="请输入公告内容" /></el-form-item>
            <el-button type="primary" @click="submitNotice">发布公告并通知用户</el-button>
          </el-form>
        </div>
        <section class="ops-list after">
          <div v-for="a in announcements" :key="a.id" class="ops-row glass-card"><LineIcon name="megaphone" tone="blue" /><div><div class="title"><b>{{ a.title }}</b><el-tag>{{ a.status === 'published' ? '已发布' : '草稿' }}</el-tag></div><p>{{ a.content }}</p><small>{{ a.createdAt }}</small></div></div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="争议处理" name="disputes">
        <section class="ops-list">
          <div v-for="d in disputes" :key="d.id" class="ops-row glass-card">
            <LineIcon name="alert" :tone="d.status === 'resolved' ? 'green' : 'red'" />
            <div><div class="title"><b>{{ d.item?.name || '关联物品' }}</b><el-tag :type="d.status === 'resolved' ? 'success' : 'warning'">{{ d.status === 'resolved' ? '已结案' : '处理中' }}</el-tag></div><p>{{ d.reason }}</p><small>申请人：{{ d.claimantName }} · {{ d.createdAt }}</small><p v-if="d.result" class="result">处理结论：{{ d.result }}</p></div>
            <div class="actions"><el-button :disabled="d.status==='resolved'" type="success" plain @click="openResolve(d)">填写结论</el-button></div>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="handoverDialog" title="确认完成交接" width="500px">
      <el-form label-position="top"><el-form-item label="交接方式"><el-input v-model="handoverForm.methodText" disabled /></el-form-item><el-form-item label="交接备注"><el-input v-model="handoverForm.remark" type="textarea" :rows="3" placeholder="例如：本人到服务台领取，工作人员核验证件和物品细节后交接。" /></el-form-item></el-form>
      <template #footer><el-button @click="handoverDialog=false">取消</el-button><el-button type="success" @click="confirmHandover">确认完成</el-button></template>
    </el-dialog>
    <el-dialog v-model="transferDialog" title="登记滞留物品移交" width="500px">
      <el-form label-position="top"><el-form-item label="移交对象"><el-input v-model="transferForm.target" placeholder="如：学院办公室 / 保卫处 / 公安等有关部门" /></el-form-item><el-form-item label="移交备注"><el-input v-model="transferForm.remark" type="textarea" :rows="3" /></el-form-item></el-form>
      <template #footer><el-button @click="transferDialog=false">取消</el-button><el-button type="primary" @click="confirmTransfer">确认移交</el-button></template>
    </el-dialog>
    <el-dialog v-model="resolveDialog" title="填写争议处理结论" width="500px">
      <el-input v-model="resolveText" type="textarea" :rows="4" placeholder="例如：要求退回物品并重新入库 / 维持认领结果 / 移交相关部门处理" />
      <template #footer><el-button @click="resolveDialog=false">取消</el-button><el-button type="primary" @click="confirmResolve">保存结论</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LineIcon from '@/components/LineIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { completeHandover, createAnnouncement, fetchAdminHandoverClaims, fetchAnnouncements, fetchDisputes, fetchOverdueItems, resolveDispute, transferOverdueItem } from '@/api/lostFound'
const active = ref('handover')
const handovers = ref([]); const storageRows = ref([]); const announcements = ref([]); const disputes = ref([])
const notice = reactive({ title:'', content:'' })
const transferDialog = ref(false); const transferTarget = ref(null); const transferForm = reactive({ target:'学院办公室', remark:'' })
const resolveDialog = ref(false); const resolveTarget = ref(null); const resolveText = ref('')
const handoverDialog = ref(false); const handoverTarget = ref(null); const handoverForm = reactive({ method:'offline', methodText:'线下交接', remark:'' })
function statusText(s){ return s === 'transferred' ? '已移交' : s === 'near_expired' ? '临近到期' : s === 'overdue' ? '已滞留' : '正常保管' }
async function load(){ handovers.value = await fetchAdminHandoverClaims(); storageRows.value = await fetchOverdueItems(); announcements.value = await fetchAnnouncements(); disputes.value = await fetchDisputes() }
function finishHandover(row, method){ handoverTarget.value = row; handoverForm.method = method; handoverForm.methodText = method === 'delivery' ? '邮寄交接' : '线下交接'; handoverForm.remark=''; handoverDialog.value = true }
async function confirmHandover(){ if(!handoverTarget.value) return; await completeHandover(handoverTarget.value.id, { method: handoverForm.method, remark: handoverForm.remark }); ElMessage.success('已完成交接，物品状态已同步更新'); handoverDialog.value=false; await load() }
function openTransfer(row){ transferTarget.value=row; transferForm.target='学院办公室'; transferForm.remark=''; transferDialog.value=true }
async function confirmTransfer(){ if(!transferForm.target.trim()){ ElMessage.warning('请填写移交对象'); return } await transferOverdueItem(transferTarget.value.id, transferForm.target, transferForm.remark); ElMessage.success('已登记移交'); transferDialog.value=false; load() }
async function submitNotice(){ if(!notice.title.trim() || !notice.content.trim()){ ElMessage.warning('请填写公告标题和内容'); return } await createAnnouncement({ ...notice, status:'published' }); ElMessage.success('公告已发布，并生成站内通知'); notice.title=''; notice.content=''; load() }
function openResolve(row){ resolveTarget.value=row; resolveText.value=row.result || ''; resolveDialog.value=true }
async function confirmResolve(){ if(!resolveText.value.trim()){ ElMessage.warning('请填写处理结论'); return } await resolveDispute(resolveTarget.value.id, resolveText.value); ElMessage.success('争议已结案'); resolveDialog.value=false; load() }
onMounted(load)
</script>
<style scoped>
.ops-page{display:grid;gap:18px}.ops-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.ops-tile{padding:18px;display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center}.ops-tile span{color:var(--muted);font-weight:800}.ops-tile b{font-size:26px;line-height:1}.admin-tabs{padding:18px;border-radius:28px;background:rgba(255,255,255,.82);box-shadow:var(--shadow)}.ops-list{display:grid;gap:14px}.ops-list.after{margin-top:18px}.ops-row{display:grid;grid-template-columns:56px 1fr auto;gap:16px;align-items:center;padding:18px;background:rgba(255,255,255,.9)}.title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ops-row p{margin:8px 0;color:var(--muted);line-height:1.7}.ops-row small{color:#8b95a7}.actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.announce-box{padding:24px}.announce-box h2{margin:0 0 8px}.announce-box p{color:var(--muted);line-height:1.75}.notice-form{margin-top:16px}.result,.privacy-note{padding:9px 12px;border-radius:14px;background:rgba(0,184,148,.08);color:#047857!important}.privacy-note{margin-top:10px;background:rgba(79,124,255,.08);color:#315fff!important}@media(max-width:920px){.ops-summary{grid-template-columns:repeat(2,1fr)}.ops-row{grid-template-columns:1fr}.actions{justify-content:flex-start}}@media(max-width:560px){.ops-summary{grid-template-columns:1fr}}
</style>
