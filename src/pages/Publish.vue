<template>
  <div class="publish-page container">
    <section class="page-head fade-up">
      <span class="kicker">分步骤发布 · 照片比对</span>
      <h1>发布时就把“能不能认出来”考虑清楚。</h1>
      <p>在原需求表单字段基础上增强照片上传、实时预览、认领核验提示和保管策略，减少后续沟通成本。</p>
    </section>
    <section class="publish-grid">
      <div class="form-panel glass-card fade-up">
        <el-steps :active="activeStep" finish-status="success" simple><el-step title="类型" /><el-step title="照片" /><el-step title="信息" /><el-step title="联系" /></el-steps>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="publish-form">
          <el-form-item label="信息类型" prop="type"><el-radio-group v-model="form.type"><el-radio-button label="lost">我丢了东西</el-radio-button><el-radio-button label="found">我捡到东西</el-radio-button></el-radio-group></el-form-item>
          <el-form-item label="物品照片（强烈建议上传）"><PhotoUploader v-model="form.image" /></el-form-item>
          <el-form-item label="物品名称" prop="name"><el-input v-model.trim="form.name" maxlength="30" show-word-limit placeholder="例如：黑色无线耳机" /></el-form-item>
          <div class="two-col"><el-form-item label="物品分类" prop="category"><el-select v-model="form.category" placeholder="请选择"><el-option v-for="c in categories" :key="c" :label="c" :value="c" /></el-select></el-form-item><el-form-item label="地点" prop="location"><el-select v-model="form.location" filterable allow-create placeholder="请选择或输入"><el-option v-for="l in locations" :key="l" :label="l" :value="l" /></el-select></el-form-item></div>
          <el-form-item :label="form.type === 'lost' ? '丢失时间' : '拾取时间'" prop="happenTime"><el-date-picker v-model="form.happenTime" type="datetime" value-format="YYYY-MM-DD HH:mm" placeholder="选择时间" style="width:100%" /></el-form-item>
          <el-form-item label="详细描述" prop="description"><el-input v-model.trim="form.description" type="textarea" :rows="5" maxlength="260" show-word-limit placeholder="颜色、品牌、特殊标记、可能遗失位置等。不要公开身份证、完整学号等敏感信息。" /></el-form-item>
          <el-form-item v-if="form.type === 'found'" label="认领核验提示（可选，不公开展示）"><el-input v-model.trim="form.claimHint" maxlength="80" show-word-limit placeholder="例如：请说明挂件样式、卡套颜色、U盘内文件夹名称" /></el-form-item>
          <div class="two-col"><el-form-item label="联系方式" prop="contact"><el-input v-model.trim="form.contact" placeholder="手机号 / QQ / 微信 / 邮箱 / 服务台" /></el-form-item><el-form-item label="保管天数" prop="retentionDays"><el-input-number v-model="form.retentionDays" :min="7" :max="90" style="width:100%" /></el-form-item></div>
          <div class="two-col">
            <el-form-item label="可见范围" prop="visibility"><el-select v-model="form.visibility" placeholder="请选择"><el-option label="公开展示" value="public" /><el-option label="仅匹配用户可见" value="matched" /><el-option label="仅管理员可见" value="admin_only" /></el-select></el-form-item>
            <el-form-item label="风险标记"><el-checkbox v-model="form.isValuable">贵重物品，认领时加强核验</el-checkbox></el-form-item>
          </div>
          <div class="submit-line"><el-button @click="reset">重置</el-button><el-button type="primary" :loading="loading" @click="submit">提交审核</el-button></div>
        </el-form>
      </div>
      <aside class="preview-panel fade-up">
        <div class="preview-header"><b>实时预览</b><span>用户大厅卡片效果</span></div>
        <ItemCard :item="previewItem" />
        <RetentionBadge v-if="previewItem.type === 'found'" :item="previewItem" class="preview-retention" />
        <div class="assist-box"><b>智能填写建议</b><p>{{ assistText }}</p></div>
      </aside>
    </section>
  </div>
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { categories, locations, createItem } from '@/api/lostFound'
import { useUserStore } from '@/stores/user'
import ItemCard from '@/components/ItemCard.vue'
import PhotoUploader from '@/components/PhotoUploader.vue'
import RetentionBadge from '@/components/RetentionBadge.vue'
const router = useRouter(); const userStore = useUserStore(); const formRef = ref(); const loading = ref(false)
const form = reactive({ type:'lost', name:'', category:'电子产品', location:'图书馆', happenTime:'', description:'', contact:'', image:'', claimHint:'', retentionDays:30, visibility:'public', isValuable:false })
const rules = { type:[{required:true,message:'请选择信息类型',trigger:'change'}], name:[{required:true,message:'请输入物品名称',trigger:'blur'},{max:30,message:'名称不能超过30字',trigger:'blur'}], category:[{required:true,message:'请选择分类',trigger:'change'}], location:[{required:true,message:'请输入地点',trigger:'blur'}], happenTime:[{required:true,message:'请选择时间',trigger:'change'}], description:[{required:true,message:'请输入描述',trigger:'blur'},{min:10,message:'描述不少于10个字',trigger:'blur'}], contact:[{required:true,message:'请输入联系方式',trigger:'blur'}], retentionDays:[{required:true,message:'请设置保管天数',trigger:'change'}] }
const activeStep = computed(() => form.type ? (form.image ? (form.name && form.category && form.location && form.happenTime ? 3 : 2) : 1) : 0)
const previewItem = computed(() => ({ id:'preview', type:form.type, name:form.name || '待填写物品名称', category:form.category || '其他', location:form.location || '待填写地点', happenTime:form.happenTime || '待选择时间', description:form.description || '这里会实时展示你填写的物品特征描述。', status:'open', auditStatus:'pending', image:form.image, storageCode: form.type === 'found' ? '待审核入库' : '待匹配', retentionDays: form.retentionDays, visibility: form.visibility, isValuable: form.isValuable, createdAt: new Date().toISOString().slice(0,16).replace('T',' ') }))
const assistText = computed(() => {
  if (!form.image) return '建议上传清晰照片。真实平台中照片能显著降低误认成本，也方便后续做图片匹配。'
  if (form.description.length < 10) return '建议补充颜色、品牌、特殊标记、遗失/拾取的具体位置，至少 10 个字。'
  if (form.type === 'found' && !form.claimHint) return '招领信息建议填写不公开的核验提示，避免被冒领。'
  return '信息完整度较高。提交后进入待审核，管理员通过后展示在失物大厅。'
})
function reset(){ Object.assign(form, { type:'lost', name:'', category:'电子产品', location:'图书馆', happenTime:'', description:'', contact:'', image:'', claimHint:'', retentionDays:30, visibility:'public', isValuable:false }) }
async function submit(){ await formRef.value.validate(); loading.value = true; try { await createItem(form, userStore.user); ElMessage.success('提交成功，已进入待审核状态'); router.push('/my-posts') } catch(e){ ElMessage.error(e.message || '提交失败') } finally { loading.value = false } }
</script>
<style scoped>
.publish-page { padding-top: 42px; }.page-head { max-width: 900px; margin-bottom: 24px; }.page-head h1 { margin: 18px 0 12px; font-size: clamp(36px,5vw,56px); line-height:1.04; letter-spacing:-.06em; }.page-head p { color:var(--muted); line-height:1.8; }
.publish-grid { display:grid; grid-template-columns: minmax(0,1fr) 390px; gap:24px; align-items:start; }.form-panel { padding:24px; }.publish-form { margin-top:24px; }.two-col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }.submit-line { display:flex; justify-content:flex-end; gap:10px; }
.preview-panel { position: sticky; top: 96px; padding:20px; border-radius:30px; background:rgba(255,255,255,.70); box-shadow:var(--shadow); }.preview-header { display:flex; justify-content:space-between; margin-bottom:14px; color:var(--muted); }.preview-header b { color:var(--ink); }.preview-retention { margin-top:14px; }.assist-box { margin-top:16px; padding:18px; border-radius:22px; background:rgba(79,124,255,.08); color:var(--muted); line-height:1.7; }.assist-box b { display:block; color:var(--primary-strong); margin-bottom:6px; }.assist-box p{margin:0;}
@media(max-width:920px){.publish-grid{grid-template-columns:1fr}.preview-panel{position:static}.two-col{grid-template-columns:1fr}}
</style>
