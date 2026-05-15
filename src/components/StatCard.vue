<script setup>
import AnimatedNumber from './AnimatedNumber.vue'
import LineIcon from './LineIcon.vue'

defineProps({
  label: {
    type: String,
    default: ''
  },
  value: {
    type: [Number, String],
    default: 0
  },
  suffix: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'check'
  },
  tone: {
    type: String,
    default: 'blue'
  },
  delay: {
    type: Number,
    default: 0
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<template>
  <div
    class="stat-card fade-up"
    :class="{ 'stat-card-clickable': clickable }"
    :style="{ animationDelay: `${delay}ms` }"
    @click="$emit('click')"
  >
    <LineIcon :name="icon" :tone="tone" />

    <div>
      <div class="stat-value">
        <AnimatedNumber :value="value" :suffix="suffix" />
      </div>

      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 26px;
  background: rgba(255, 255, 255, .80);
  border: 1px solid rgba(255, 255, 255, .78);
  box-shadow: 0 16px 40px rgba(31, 45, 92, .09);
  transition: transform .28s ease, box-shadow .28s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(31, 45, 92, .14);
}

.stat-card-clickable {
  cursor: pointer;
}

.stat-card-clickable:hover {
  border-color: #3b82f6;
}

.stat-value {
  font-size: 29px;
  font-weight: 950;
  letter-spacing: -.04em;
}

.stat-label {
  margin-top: 3px;
  color: var(--muted);
  font-size: 14px;
}
</style>