<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const itemType = computed(() => props.item.type || 'lost')

const itemCategory = computed(() => {
  if (typeof props.item.category === 'string') {
    return props.item.category
  }

  if (props.item.category?.name) {
    return props.item.category.name
  }

  return props.item.category_name || '其他'
})

const itemImage = computed(() => {
  if (props.item.image) {
    return props.item.image
  }

  if (props.item.image_url) {
    return props.item.image_url
  }

  if (Array.isArray(props.item.images) && props.item.images.length) {
    const firstImage = props.item.images[0]

    return typeof firstImage === 'string' ? firstImage : firstImage.image_url || firstImage.url || ''
  }

  return ''
})

const itemTime = computed(() => {
  return props.item.happenTime || props.item.happen_time || props.item.created_at || '时间待补充'
})

const isValuable = computed(() => {
  return Boolean(props.item.isValuable || props.item.is_valuable)
})

const storageText = computed(() => {
  return props.item.storageCode || props.item.storage_code || (itemType.value === 'found' ? '待入库' : '待匹配')
})

const categoryClass = computed(() => {
  return `icon-${String(itemCategory.value).replace(/\s/g, '')}`
})

const statusText = computed(() => {
  const status = props.item.status

  if (['done', 'completed'].includes(status)) {
    return itemType.value === 'lost' ? '已找回' : '已认领'
  }

  if (status === 'claiming') {
    return '认领中'
  }

  if (status === 'closed') {
    return '已关闭'
  }

  return itemType.value === 'lost' ? '寻找中' : '待认领'
})

const statusClass = computed(() => {
  return ['done', 'completed'].includes(props.item.status) ? 'status-dot status-done' : 'status-dot status-open'
})

function goDetail() {
  router.push(`/items/${props.item.id}`)
}
</script>

<template>
  <article class="item-card" @click="goDetail">
    <div class="visual" :class="itemType">
      <img v-if="itemImage" :src="itemImage" alt="物品照片" />
      <div v-else class="fallback-icon" :class="categoryClass">
        <span></span>
      </div>

      <div class="badge-row">
        <el-tag class="soft-tag" :class="itemType === 'lost' ? 'type-lost' : 'type-found'">{{ itemType === 'lost' ? '失物' : '招领' }}</el-tag>
        <el-tag v-if="isValuable" class="soft-tag valuable-tag">贵重</el-tag>
        <el-tag v-if="item.match" class="soft-tag match-tag">匹配 {{ item.match.score }}%</el-tag>
      </div>
    </div>

    <div class="body">
      <div class="title-row">
        <h3>{{ item.name }}</h3>
        <span class="status">
          <i :class="statusClass"></i>
          {{ statusText }}
        </span>
      </div>

      <p>{{ item.description }}</p>

      <div v-if="item.match" class="match-reason">{{ item.match.reasons?.join(' · ') }}</div>

      <div class="meta">
        <span class="pin-icon"></span>
        <span>{{ item.location }}</span>
        <span class="clock-icon"></span>
        <span>{{ itemTime }}</span>
      </div>

      <div class="card-footer">
        <small>{{ storageText }}</small>
        <small>{{ itemImage ? '有照片可比对' : '暂无照片' }}</small>
      </div>
    </div>
  </article>
</template>

<style scoped>
.item-card {
  cursor: pointer;
  overflow: hidden;
  border-radius: 30px;
  background: rgba(255, 255, 255, .86);
  border: 1px solid rgba(255, 255, 255, .82);
  box-shadow: 0 18px 44px rgba(31, 45, 92, .11);
  transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 28px 70px rgba(31, 45, 92, .16);
  border-color: rgba(79, 124, 255, .22);
}

.visual {
  position: relative;
  height: 166px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 28% 20%, rgba(255, 255, 255, .82), transparent 30%), linear-gradient(135deg, rgba(79, 124, 255, .24), rgba(108, 99, 255, .16));
}

.visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  transition: .35s ease;
}

.item-card:hover .visual img {
  transform: scale(1.05);
}

.visual.found {
  background: radial-gradient(circle at 28% 20%, rgba(255, 255, 255, .82), transparent 30%), linear-gradient(135deg, rgba(0, 184, 148, .20), rgba(79, 124, 255, .12));
}

.visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, .04), rgba(0, 0, 0, .20));
  opacity: .56;
  pointer-events: none;
}

.badge-row {
  position: absolute;
  z-index: 2;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.match-tag {
  color: #7c3aed;
  background: rgba(124, 58, 237, .10);
}

.valuable-tag {
  color: #b42318;
  background: rgba(244, 63, 94, .12);
}

.card-tags .el-tag {
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
}

@media (max-width: 620px) {
  .item-card {
    flex-direction: column;
    min-height: auto;
  }

  .card-image {
    width: 100%;
    height: 160px;
    flex-shrink: 0;
  }

  .card-body {
    padding: 12px;
  }

  .card-title {
    font-size: 16px;
    line-height: 1.4;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-desc {
    font-size: 13px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .card-meta {
    font-size: 12px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .card-tags {
    margin-top: 8px;
  }

  .card-actions {
    padding: 10px 12px;
  }
}

.fallback-icon {
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  position: relative;
  border-radius: 30px;
  background: rgba(255, 255, 255, .72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8);
  animation: floatSlow 5.4s ease-in-out infinite;
}

.fallback-icon span,
.fallback-icon::before,
.fallback-icon::after {
  content: '';
  position: absolute;
  display: block;
}

.icon-电子产品 span {
  width: 45px;
  height: 30px;
  top: 22px;
  border: 4px solid var(--primary);
  border-radius: 999px 999px 18px 18px;
  border-bottom-color: transparent;
}

.icon-电子产品::before {
  width: 17px;
  height: 26px;
  left: 17px;
  top: 35px;
  border: 4px solid var(--primary);
  border-radius: 10px;
}

.icon-电子产品::after {
  width: 17px;
  height: 26px;
  right: 17px;
  top: 35px;
  border: 4px solid var(--primary);
  border-radius: 10px;
}

.icon-校园卡 span {
  width: 48px;
  height: 34px;
  border: 4px solid var(--primary);
  border-radius: 10px;
}

.icon-校园卡::before {
  width: 14px;
  height: 14px;
  left: 23px;
  top: 28px;
  border-radius: 50%;
  background: var(--primary);
}

.icon-校园卡::after {
  width: 22px;
  height: 4px;
  right: 20px;
  bottom: 28px;
  border-radius: 999px;
  background: var(--primary);
}

.icon-钥匙 span {
  width: 22px;
  height: 22px;
  left: 20px;
  top: 26px;
  border: 5px solid var(--warning);
  border-radius: 50%;
}

.icon-钥匙::before {
  width: 34px;
  height: 5px;
  left: 39px;
  top: 38px;
  border-radius: 999px;
  background: var(--warning);
}

.icon-钥匙::after {
  width: 5px;
  height: 14px;
  right: 18px;
  top: 38px;
  background: var(--warning);
  box-shadow: -10px 0 0 var(--warning);
}

.icon-书本文具 span {
  width: 44px;
  height: 52px;
  border: 4px solid var(--primary);
  border-radius: 8px;
  transform: skewY(-3deg);
}

.icon-书本文具::before {
  width: 4px;
  height: 44px;
  left: 43px;
  top: 22px;
  background: var(--primary);
}

.icon-生活用品 span {
  width: 42px;
  height: 42px;
  border: 4px solid var(--success);
  border-radius: 8px 8px 22px 22px;
}

.icon-贵重物品 span {
  width: 42px;
  height: 48px;
  border: 4px solid var(--danger);
  border-radius: 22px 22px 16px 16px;
}

.icon-贵重物品::before {
  width: 18px;
  height: 10px;
  left: 33px;
  top: 34px;
  border-left: 4px solid var(--danger);
  border-bottom: 4px solid var(--danger);
  transform: rotate(-45deg);
}

.icon-其他 span {
  width: 48px;
  height: 40px;
  border: 4px solid var(--secondary);
  border-radius: 12px;
}

.body {
  padding: 18px;
}

.title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.title-row h3 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -.02em;
}

.body p {
  margin: 10px 0 12px;
  color: var(--muted);
  line-height: 1.7;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 47px;
}

.status {
  white-space: nowrap;
  font-size: 13px;
  color: var(--muted);
  padding-top: 3px;
}

.match-reason {
  margin-bottom: 10px;
  padding: 9px 11px;
  border-radius: 14px;
  color: #5b21b6;
  background: rgba(124, 58, 237, .08);
  font-size: 13px;
}

.meta {
  display: grid;
  grid-template-columns: 16px auto 16px auto;
  align-items: center;
  gap: 7px;
  color: #6b7280;
  font-size: 13px;
}

.pin-icon,
.clock-icon {
  width: 14px;
  height: 14px;
  position: relative;
  display: inline-block;
}

.pin-icon::before {
  content: '';
  position: absolute;
  inset: 1px 3px 4px;
  border: 3px solid var(--primary);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.clock-icon {
  border: 2px solid var(--success);
  border-radius: 50%;
}

.clock-icon::before {
  content: '';
  position: absolute;
  width: 2px;
  height: 5px;
  left: 5px;
  top: 2px;
  background: var(--success);
}

.clock-icon::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 2px;
  left: 5px;
  top: 6px;
  background: var(--success);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  padding-top: 13px;
  border-top: 1px solid rgba(17, 24, 39, .08);
  color: #8b95a7;
}

.card-footer small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>