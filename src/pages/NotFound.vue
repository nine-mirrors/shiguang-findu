<template><div class="notfound container"><EmptyState title="页面不存在" desc="路径可能已经失效，返回首页继续使用。" button-text="返回首页" @action="$router.push('/home')" /></div></template>
<script setup>import EmptyState from '@/components/EmptyState.vue'</script>
<style scoped>.notfound{padding-top:90px}</style>
