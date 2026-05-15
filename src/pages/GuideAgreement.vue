<script setup>
import LineIcon from '@/components/LineIcon.vue'

const cards = [
  {
    title: '防冒领',
    icon: 'shield',
    tone: 'purple',
    desc: '通过细节证明、身份核验和管理员审核降低冒领风险。'
  },
  {
    title: '隐私保护',
    icon: 'lock',
    tone: 'blue',
    desc: '联系方式、地址、证明材料默认不在公开页面展示。'
  },
  {
    title: '身份核验',
    icon: 'user-check',
    tone: 'orange',
    desc: '线下领取需凭学生证或校园身份凭证，邮寄也需先核验身份。'
  },
  {
    title: '滞留处理',
    icon: 'package',
    tone: 'green',
    desc: '超过保管期的物品会进入移交或集中处理流程。'
  }
]

const flow = [
  {
    title: '发布信息',
    desc: '失主发布失物，拾得人发布招领，并尽量上传清晰物品照片。'
  },
  {
    title: '审核展示',
    desc: '管理员审核信息真实性、完整性和隐私风险后，再公开展示。'
  },
  {
    title: '提交认领',
    desc: '用户填写物品特征、证明说明、联系电话和领取方式。'
  },
  {
    title: '身份核验',
    desc: '线下凭学生证、校园卡或校园身份凭证核验；邮寄需先核验身份和归属证明。'
  },
  {
    title: '领取 / 邮寄',
    desc: '确认归属后，根据实际情况安排线下领取或由管理员处理邮寄。'
  },
  {
    title: '完成或归还',
    desc: '确认无误后完成；如发现领错，应及时联系管理员并交回处理。'
  }
]
</script>

<template>
  <div class="guide-page container">
    <section class="guide-hero fade-up">
      <span class="kicker">用户须知 · 平台规则</span>

      <h1>让每一次失物认领都有流程、有证据、有去向。</h1>

      <p>
        本页面用于说明拾光 FindU 的使用流程、隐私保护、认领核验、领错归还、滞留物品处理和用户协议重点条款。
        请在发布、认领或上传证明材料前认真阅读。
      </p>
    </section>

    <section class="guide-grid">
      <article v-for="card in cards" :key="card.title" class="glass-card guide-card">
        <LineIcon :name="card.icon" :tone="card.tone" />

        <h2>{{ card.title }}</h2>

        <p>{{ card.desc }}</p>
      </article>
    </section>

    <section class="glass-card flow-card">
      <h2>失物招领完整流程</h2>

      <div class="flow-line">
        <div v-for="(step, index) in flow" :key="step.title" class="flow-step">
          <b>{{ index + 1 }}</b>

          <h3>{{ step.title }}</h3>

          <p>{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <section class="rule-layout">
      <article class="glass-card rule-card">
        <h2>隐私保护规则</h2>

        <ul>
          <li>公开页面不展示完整手机号、详细住址、证件号、完整学号等敏感信息。</li>
          <li>认领申请中的证明照片、收件地址、联系电话仅用于管理员核验和交接处理。</li>
          <li>公开物品照片应避免展示校园卡完整姓名、证件号、银行卡号、U 盘隐私文件等内容。</li>
          <li>平台仅在失物招领、认领核验和状态通知场景下使用相关信息。</li>
        </ul>
      </article>

      <article class="glass-card rule-card">
        <h2>认领、邮寄与领错归还规则</h2>

        <ul>
          <li>认领人应提供物品特征、丢失时间、地点、购买记录或其他能够证明归属的信息。</li>
          <li>线下领取物品时，认领人需出示学生证、校园卡或其他校园身份凭证进行核验。</li>
          <li>选择邮寄处理时，管理员会先核验注册邮箱、认领联系电话、校园身份信息和物品归属证明，确认无误后再处理邮寄。</li>
          <li>若领取后发现不是本人遗失物，应及时联系管理员并交回处理，不得私自占有或转交他人。</li>
        </ul>
      </article>
    </section>

    <section class="glass-card legal-card">
      <h2>滞留物品处理依据与校内流程</h2>

      <p>
        平台遵循“及时返还权利人、妥善保管、无法确认权利人时按校内流程处理”的原则。
        贵重物品、证件、银行卡、疑似危险物品等，应优先交由管理员或相关部门进一步处理。
      </p>

      <div class="legal-list">
        <div>
          <b>保管期内</b>
          <span>已审核信息可公开展示，用户可提交认领申请、线索说明或归还说明。</span>
        </div>

        <div>
          <b>临近到期</b>
          <span>管理员可复核物品状态，并根据实际情况调整处理方式。</span>
        </div>

        <div>
          <b>长期无人认领</b>
          <span>可移交学院办公室、服务台、保卫处或其他相关部门处理。</span>
        </div>

        <div>
          <b>禁止私自占有</b>
          <span>拾得人、管理员和平台用户不得私自占有、转卖或恶意处理遗失物。</span>
        </div>
      </div>
    </section>

    <section class="glass-card agreement-card">
      <h2>用户协议重点</h2>

      <p>用户发布信息、提交认领或上传证明材料，即表示理解并同意以下规则：</p>

      <ol>
        <li>不得发布虚假、侮辱、诈骗、广告或侵犯他人隐私的信息。</li>
        <li>不得冒领、诱导他人交付物品或利用平台牟利。</li>
        <li>认领失败、材料不足或存在争议时，应配合管理员补充证明或进行身份核验。</li>
        <li>平台可对明显违规、重复、过期或存在风险的信息进行隐藏、驳回或删除。</li>
        <li>用户应对自己发布的信息、提交的证明材料和填写的联系方式真实性负责。</li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.guide-page {
  padding-top: 42px;
}

.guide-hero {
  max-width: 900px;
}

.guide-hero h1 {
  margin: 18px 0;
  font-size: clamp(38px, 6vw, 68px);
  line-height: .98;
  letter-spacing: -.065em;
}

.guide-hero p {
  color: var(--muted);
  line-height: 1.85;
  font-size: 17px;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 30px 0;
}

.guide-card {
  padding: 22px;
}

.guide-card h2 {
  margin: 16px 0 8px;
}

.guide-card p,
.rule-card li,
.legal-card p,
.agreement-card li,
.agreement-card p {
  color: var(--muted);
  line-height: 1.85;
}

.flow-card,
.legal-card,
.agreement-card {
  padding: 28px;
  margin-top: 22px;
}

.flow-line {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.flow-step {
  position: relative;
  padding: 18px;
  border-radius: 22px;
  background: rgba(79, 124, 255, .06);
}

.flow-step b {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: #fff;
}

.flow-step h3 {
  margin: 14px 0 8px;
}

.flow-step p {
  color: var(--muted);
  line-height: 1.7;
}

.rule-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-top: 22px;
}

.rule-card {
  padding: 28px;
}

.legal-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.legal-list div {
  padding: 18px;
  border-radius: 22px;
  background: rgba(0, 184, 148, .07);
}

.legal-list b {
  display: block;
  margin-bottom: 8px;
}

.legal-list span {
  color: var(--muted);
  line-height: 1.7;
}

@media (max-width: 960px) {
  .guide-grid,
  .flow-line,
  .legal-list {
    grid-template-columns: repeat(2, 1fr);
  }

  .rule-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .guide-grid,
  .flow-line,
  .legal-list {
    grid-template-columns: 1fr;
  }
}
</style>