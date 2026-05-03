<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SellerSidebar from '@/components/seller/Sidebar.vue'
import SellerHeader from '@/components/seller/Header.vue'

const route = useRoute()

const isLoginPage = computed(() => route.path === '/seller/login')
</script>

<template>
  <div class="seller-layout" :class="{ 'login-mode': isLoginPage }">
    <!-- 登录页不显示侧边栏和顶栏 -->
    <template v-if="!isLoginPage">
      <SellerSidebar />
      <div class="seller-main">
        <SellerHeader />
        <div class="seller-content">
          <RouterView />
        </div>
      </div>
    </template>

    <!-- 登录页单独渲染 -->
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<style scoped>
.seller-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background: #f5f7fa;
}

.seller-layout.login-mode {
  background: transparent;
}

.seller-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 220px;
}

.seller-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>