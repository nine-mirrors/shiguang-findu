<template>
  <div class="claim-panel glass-card">
    <div class="claim-head">
      <div><h2>{{ item.type === 'found' ? '认领比对' : '线索提交' }}</h2><p>用照片和细节描述减少误认、冒领，让交接更可信。</p></div>
      <el-tag class="soft-tag">Beta</el-tag>
    </div>
    <div class="compare-grid">
      <div class="compare-side">
        <span>平台照片</span>
        <div class="compare-photo" :class="{ empty: !item.image }">
          <img v-if="item.image" :src="item.image" alt="平台物品照片" />
          <b v-else>暂无公开照片</b>
        </div>
      </div>
      <div class="compare-side">
        <span>{{ item.type === 'found' ? '我的证明照片' : '我提供的线索照片' }}</span>
        <PhotoUploader v-model="proofImage" title="上传比对照片" desc="例如备用照片、购买记录、同款细节或现场线索" />
      </div>
    </div>
    <el-input v-model="proofText" type="textarea" :rows="4" maxlength="180" show-word-limit placeholder="请填写只有真正失主更可能知道的细节：颜色、划痕、贴纸、挂件、文件夹名称、校园卡姓名等。" />
    <div class="score-box" v-if="proofText || proofImage">
      <div><b>可信度预估</b><p>{{ scoreText }}</p></div>
      <strong>{{ score }}%</strong>
    </div>
    <div class="claim-actions">
      <el-button @click="reset">清空</el-button>
      <el-button type="primary" @click="goClaim">进入正式认领流程</el-button>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PhotoUploader from './PhotoUploader.vue'
const props = defineProps({ item: { type:Object, required:true } })
const router = useRouter()
const proofImage = ref('')
const proofText = ref('')
const score = computed(() => {
  let v = 28
  if (proofImage.value) v += 28
  if (proofText.value.length >= 20) v += 24
  const text = `${props.item.name} ${props.item.description}`.toLowerCase()
  const hits = proofText.value.toLowerCase().split(/[\s,，。；;、/]+/).filter(w => w.length >= 2 && text.includes(w)).length
  v += Math.min(20, hits * 7)
  return Math.min(96, v)
})
const scoreText = computed(() => score.value >= 80 ? '证明信息较充分，建议进入线下核验。' : score.value >= 60 ? '信息有参考价值，建议补充更具体的物品细节。' : '信息偏少，真实上线时应要求补充细节或人工复核。')
function reset(){ proofImage.value = ''; proofText.value = '' }
function goClaim(){ router.push(`/items/${props.item.id}/claim`) }
</script>
<style scoped>
.claim-panel { padding:28px; }
.claim-head { display:flex; justify-content:space-between; gap:14px; align-items:flex-start; margin-bottom:18px; }
h2 { margin:0 0 8px; } p { margin:0; color:var(--muted); line-height:1.7; }
.compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
.compare-side > span { display:block; color:var(--muted); font-size:13px; margin-bottom:8px; }
.compare-photo { min-height:190px; border-radius:24px; overflow:hidden; background:#eef2f7; display:grid; place-items:center; color:var(--muted); }
.compare-photo img { width:100%; height:100%; min-height:190px; max-height:260px; object-fit:cover; display:block; }
.score-box { margin-top:14px; padding:16px; border-radius:22px; background:linear-gradient(135deg, rgba(79,124,255,.10), rgba(0,184,148,.08)); display:flex; justify-content:space-between; gap:16px; align-items:center; }
.score-box strong { font-size:30px; color:var(--primary-strong); }
.claim-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
@media(max-width:760px){.compare-grid{grid-template-columns:1fr}}
</style>
