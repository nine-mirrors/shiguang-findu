<template>
  <div class="claim-apply-page container" v-if="item">
    <section class="claim-hero fade-up">
      <div>
        <span class="kicker">认领与纠错</span>
        <h1>{{ item.type === 'found' ? '提交认领申请' : '提交线索申请' }}</h1>
        <p>先由工作人员核验物品细节，再选择线下领取或邮寄。若领取后发现不是本人遗失物，可走“领错归还”流程重新入库。</p>
      </div>
      <div class="claim-item-card">
        <img v-if="item.image" :src="item.image" alt="物品照片" />
        <div><b>{{ item.name }}</b><span>{{ item.location }} · {{ item.happenTime }}</span><small>{{ item.storageCode || '待入库' }}</small></div>
      </div>
    </section>

    <section class="claim-grid">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="claim-form glass-card">
        <div class="form-section-title"><LineIcon name="user-check" tone="blue" /><div><h2>核验信息</h2><p>请填写只有真正失主更可能知道的细节，减少冒领和误领。</p></div></div>
        <el-form-item label="申请类型" prop="claimType">
          <el-radio-group v-model="form.claimType">
            <el-radio-button label="claim">我要认领</el-radio-button>
            <el-radio-button label="wrong_return">领错归还</el-radio-button>
            <el-radio-button label="tip">我有线索</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="证明细节" prop="proofText">
          <el-input v-model="form.proofText" type="textarea" :rows="5" maxlength="240" show-word-limit placeholder="例如：物品特殊划痕、贴纸、校园卡姓名、U盘文件夹名称、购买记录、丢失时间和座位等。" />
        </el-form-item>
        <el-form-item label="证明照片，可选">
          <PhotoUploader v-model="form.proofImage" title="上传证明照片" desc="可上传购买记录、同款照片、物品细节或领取后发现错误的照片" />
        </el-form-item>

        <div class="form-section-title"><LineIcon name="route" tone="green" /><div><h2>领取方式</h2><p>平台先核验，再交接；邮寄仅在工作人员确认后进入下一步。</p></div></div>
        <el-form-item label="领取方式" prop="method">
          <el-radio-group v-model="form.method">
            <el-radio-button label="offline">线下领取</el-radio-button>
            <el-radio-button label="mail">邮寄到付/协商邮寄</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.method === 'mail'" label="收件地址" prop="deliveryAddress">
          <el-input v-model="form.deliveryAddress" placeholder="仅管理员审核通过后用于邮寄，不公开展示" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="仅用于工作人员核验，不在前台公开" />
        </el-form-item>

        <el-checkbox v-model="form.agree">我已阅读并同意《用户须知与平台规则》，确认所填信息真实有效。</el-checkbox>
        <div class="form-actions">
          <el-button @click="$router.back()">返回</el-button>
          <el-button type="primary" :disabled="!form.agree" @click="submit">提交申请</el-button>
        </div>
      </el-form>

      <aside class="side-stack">
        <div class="glass-card policy-card"><LineIcon name="shield" tone="purple" /><h3>防冒领机制</h3><p>隐藏敏感信息、要求细节证明、工作人员复核，必要时线下核验学生证或有效证件。</p></div>
        <div class="glass-card policy-card"><LineIcon name="truck" tone="orange" /><h3>远距离领取</h3><p>可选择邮寄，但不会直接公开地址；管理员确认属于本人后再沟通邮寄方式和费用承担。</p></div>
        <div class="glass-card policy-card"><LineIcon name="rotate" tone="green" /><h3>领错归还</h3><p>领取后发现错误，可提交领错归还申请，物品将重新进入保管与认领流程。</p></div>
      </aside>
    </section>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createClaim, fetchItemDetail } from '@/api/lostFound'
import { useUserStore } from '@/stores/user'
import PhotoUploader from '@/components/PhotoUploader.vue'
import LineIcon from '@/components/LineIcon.vue'
const route = useRoute(); const router = useRouter(); const userStore = useUserStore(); const item = ref(null); const formRef = ref()
const form = reactive({ itemId: route.params.id, claimType:'claim', proofText:'', proofImage:'', method:'offline', deliveryAddress:'', phone:'', agree:false })
const rules = { proofText:[{ required:true, message:'请填写证明细节', trigger:'blur' },{ min:12, message:'证明细节至少 12 个字', trigger:'blur' }], method:[{required:true,message:'请选择领取方式',trigger:'change'}], deliveryAddress:[{ validator:(_,v,cb)=> form.method==='mail' && !v ? cb(new Error('选择邮寄时请填写收件地址')) : cb(), trigger:'blur' }], phone:[{ required:true, message:'请填写联系电话', trigger:'blur' }] }
onMounted(async()=>{ item.value = await fetchItemDetail(route.params.id) })
async function submit(){
  await formRef.value.validate()
  await createClaim({ ...form }, userStore.user)
  ElMessage.success('申请已提交，等待工作人员核验')
  router.push('/my-posts?tab=claims')
}
</script>
<style scoped>
.claim-apply-page{padding-top:42px}.claim-hero{display:grid;grid-template-columns:1fr 380px;gap:24px;align-items:stretch;margin-bottom:26px}.claim-hero h1{font-size:clamp(38px,6vw,64px);line-height:.98;letter-spacing:-.065em;margin:18px 0}.claim-hero p{color:var(--muted);line-height:1.85;max-width:680px}.claim-item-card{padding:16px;border-radius:30px;background:rgba(255,255,255,.82);box-shadow:var(--shadow);display:flex;gap:14px;align-items:center}.claim-item-card img{width:118px;height:92px;object-fit:cover;border-radius:22px}.claim-item-card b{display:block;font-size:19px}.claim-item-card span,.claim-item-card small{display:block;color:var(--muted);margin-top:6px}.claim-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px}.claim-form{padding:28px}.form-section-title{display:flex;align-items:center;gap:14px;margin:8px 0 18px}.form-section-title h2{margin:0}.form-section-title p{margin:4px 0 0;color:var(--muted)}.form-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:22px}.side-stack{display:grid;gap:16px;align-content:start}.policy-card{padding:22px}.policy-card h3{margin:16px 0 8px}.policy-card p{margin:0;color:var(--muted);line-height:1.75}@media(max-width:900px){.claim-hero,.claim-grid{grid-template-columns:1fr}}
</style>
