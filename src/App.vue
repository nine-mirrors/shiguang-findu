<template>
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </transition>
    </router-view>
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.35s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-up-enter-active {
  transition: all 0.5s ease-out;
}

.fade-up-leave-active {
  transition: all 0.3s ease-in;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-move {
  transition: transform 0.4s ease;
}
</style>
