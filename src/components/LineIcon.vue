<script setup>
defineProps({
  name: {
    type: String,
    default: 'check'
  },
  tone: {
    type: String,
    default: 'blue'
  }
})
</script>

<template>
  <span class="line-icon" :class="[`tone-${tone}`]" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="name === 'pin'">
        <path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </template>

      <template v-else-if="name === 'shield'">
        <path d="M12 3 19 6v5c0 4.4-2.8 8.3-7 10-4.2-1.7-7-5.6-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </template>

      <template v-else-if="name === 'camera'">
        <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.2-2h5l1.2 2h1.8A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
        <circle cx="12" cy="12.5" r="3.2" />
      </template>

      <template v-else-if="name === 'package'">
        <path d="m3.5 7 8.5-4 8.5 4-8.5 4-8.5-4Z" />
        <path d="M3.5 7v10l8.5 4 8.5-4V7" />
        <path d="M12 11v10" />
      </template>

      <template v-else-if="name === 'route'">
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h4" />
      </template>

      <template v-else-if="name === 'file'">
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5" />
        <path d="M8 13h8M8 17h5" />
      </template>

      <template v-else-if="name === 'user-check'">
        <path d="M15 19a6 6 0 0 0-12 0" />
        <circle cx="9" cy="8" r="4" />
        <path d="m16 11 2 2 4-4" />
      </template>

      <template v-else-if="name === 'truck'">
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h3l4 4v2h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </template>

      <template v-else-if="name === 'rotate'">
        <path d="M20 12a8 8 0 1 1-2.3-5.7" />
        <path d="M20 4v6h-6" />
      </template>

      <template v-else-if="name === 'lock'">
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </template>

      <template v-else-if="name === 'chart'">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-6" />
      </template>

      <template v-else-if="name === 'alert'">
        <path d="M12 3 22 20H2L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </template>

      <template v-else-if="name === 'megaphone'">
        <path d="M4 13h3l10 5V6L7 11H4a2 2 0 0 0 0 2Z" />
        <path d="M7 13l1.2 5H11" />
        <path d="M19 9a4 4 0 0 1 0 6" />
      </template>

      <template v-else-if="name === 'users'">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.5 15.5A5 5 0 0 1 21 20" />
      </template>

      <template v-else-if="name === 'signature'">
        <path d="M4 19c4-1 5-5 6-9 .5-2 3-2 3 0 0 3-3 7-1 7 1.5 0 2.5-2 4-2s2 2 4 1" />
        <path d="M4 22h16" />
      </template>

      <template v-else-if="name === 'spark'">
        <path d="M12 2v6M12 16v6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" />
      </template>

      <template v-else-if="name === 'check'">
        <circle cx="12" cy="12" r="8" />
        <path d="m9 12 2 2 4-4" />
      </template>

      <template v-else>
        <circle cx="12" cy="12" r="8" />
        <path d="m9 12 2 2 4-4" />
      </template>
    </svg>
  </span>
</template>

<style scoped>
.line-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, .72);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .75), 0 14px 36px rgba(31, 45, 92, .08);
  color: var(--primary);
}

.line-icon svg {
  width: 25px;
  height: 25px;
}

.tone-blue {
  color: var(--primary);
}

.tone-green {
  color: var(--success);
}

.tone-purple {
  color: var(--secondary);
}

.tone-orange {
  color: var(--warning);
}

.tone-red {
  color: var(--danger);
}

.tone-ink {
  color: #334155;
}
</style>