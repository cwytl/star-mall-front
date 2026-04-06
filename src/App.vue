<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'

const route = useRoute()

const hideHeaderRoutes = ['/login', '/register']
const showHeader = computed(() => !hideHeaderRoutes.includes(route.path))
</script>

<template>
  <div class="app-shell">
    <SiteHeader v-if="showHeader" />
    <div class="main-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #fdf2f8, transparent 25%),
    radial-gradient(circle at 80% 0%, #eef2ff, transparent 30%),
    #f7f9fc;
}

.main-content {
  width: 100%;
  min-height: 100vh;
}
</style>

<style>
/* 全局样式重置 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
}

/* 页面切换淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
