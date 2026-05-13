<script setup>
import LineIcon from '@/components/LineIcon.vue'

const cards = [
  {
    title: '防冒领',
    icon: 'shield',
    tone: 'purple',
    desc: '通过细节证明、照片比对和人工审核降低冒领风险。'
  },
  {
    title: '隐私保护',
    icon: 'lock',
    tone: 'blue',
    desc: '联系方式、地址、证明材料默认不在前台公开。'
  },
  {
    title: '远程领取',
    icon: 'truck',
    tone: 'orange',
    desc: '确认归属后可选择线下领取或邮寄处理。'
  },
  {
    title: '滞留处理',
    icon: 'package',
    tone: 'green',
    desc: '超过保管期的物品进入移交或集中处理流程。'
  }
]

const flow = [
  {
    title: '发布信息',
    desc: '失主发布失物，拾得人发布招领，建议上传清晰照片。'
  },
  {
    title: '审核展示',
    desc: '管理员审核信息真实性和隐私风险后展示到大厅。'
  },
  {
    title: '提交认领',
    desc: '用户填写物品特征、证明材料和领取方式。'
  },
  {
    title: '人工核验',
    desc: '工作人员确认物品归属，必要时要求线下核验。'
  },
  {
    title: '领取 / 邮寄',
    desc: '近距离线下领取，远距离可沟通邮寄。'
  },
  {
    title: '完成或归还',
    desc: '确认无误后完成；领错则重新归还入库。'
  }
]
</script>

<template>
  <div class="guide-page container">
    <section class="guide-hero fade-up">
      <span class="kicker">用户须知 · 平台规则</span>

      <h1>让每一次失物认领都有流程、有证据、有去向。</h1>

      <p>本页面用于说明拾光 FindU 的使用流程、隐私保护、认领核验、领错归还、滞留物品处理和用户协议重点条款。</p>
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
          <li>前台不公开完整手机号、详细住址、身份证号、完整学号等敏感信息。</li>
          <li>认领申请中的证明照片、收件地址、联系电话仅管理员和必要工作人员可见。</li>
          <li>公开物品照片应避免展示校园卡完整姓名、证件号、银行卡号、U 盘隐私文件等内容。</li>
          <li>平台仅为失物招领流程使用联系信息，不用于其他目的。</li>
        </ul>
      </article>

      <article class="glass-card rule-card">
        <h2>认领与领错归还规则</h2>

        <ul>
          <li>认领人应提供物品特征、丢失时间、地点、购买记录或其他证明。</li>
          <li>工作人员根据证明信息决定线下核验、拒绝或要求补充材料。</li>
          <li>选择邮寄时，需先确认物品归属，再沟通邮寄方式和费用承担。</li>
          <li>若领取后发现不是本人遗失物，应通过“领错归还”重新交回平台或服务台。</li>
        </ul>
      </article>
    </section>

    <section class="glass-card legal-card">
      <h2>滞留物品处理依据与校内流程</h2>

      <p>本系统遵循“及时返还权利人、妥善保管、无法确认权利人时移交有关部门”的原则。实际运营中，贵重物品、证件、银行卡、疑似危险物品等应优先移交校内保卫处或公安等有关部门。</p>

      <div class="legal-list">
        <div>
          <b>保管期内</b>
          <span>公开展示已审核信息，支持认领核验、线下领取或邮寄申请。</span>
        </div>

        <div>
          <b>临近到期</b>
          <span>管理员提醒发布人或服务台复核，必要时延长保管或集中处理。</span>
        </div>

        <div>
          <b>长期无人认领</b>
          <span>移交学院办公室、服务台、保卫处或公安等有关部门，形成处理记录。</span>
        </div>

        <div>
          <b>禁止私自占有</b>
          <span>拾得人、工作人员、平台用户不得私自占有、转卖或恶意处理遗失物。</span>
        </div>
      </div>
    </section>

    <section class="glass-card agreement-card">
      <h2>用户协议重点</h2>

      <p>用户发布信息、提交认领或上传证明材料，即表示理解并同意以下规则：</p>

      <ol>
        <li>不得发布虚假、侮辱、诈骗、广告或侵犯他人隐私的信息。</li>
        <li>不得冒领、诱导他人交付物品或利用平台牟利。</li>
        <li>认领失败、材料不足或存在争议时，应配合工作人员补充证明或线下核验。</li>
        <li>平台可对明显违规、重复、过期或存在风险的信息进行隐藏、驳回或删除。</li>
        <li>本系统为校园场景网页设计作品，真实上线时应由学校进一步确认运营规则和责任边界。</li>
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