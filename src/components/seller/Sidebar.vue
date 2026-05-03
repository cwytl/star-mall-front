<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
  GoodsFilled,
  List,
  Setting,
  Expand,
  Fold
} from '@element-plus/icons-vue'
import { sellerLogout } from '@/store/seller'

const route = useRoute()
const router = useRouter()

const isCollapsed = ref(false)

const menuItems = [
  { path: '/seller/dashboard', title: '数据概览', icon: HomeFilled },
  { path: '/seller/products', title: '商品管理', icon: GoodsFilled },
  { path: '/seller/orders', title: '订单管理', icon: List },
  { path: '/seller/shop', title: '店铺设置', icon: Setting }
]

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleLogout = async () => {
  await sellerLogout()
  router.push('/seller/login')
}
</script>

<template>
  <aside class="seller-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <span class="logo" v-show="!isCollapsed">商家后台</span>
      <span class="logo-mini" v-show="isCollapsed">商</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      :collapse-transition="false"
      class="sidebar-menu"
      background-color="#1e293b"
      text-color="#cbd5e1"
      active-text-color="#ff6a00"
      router
    >
      <el-menu-item
        v-for="item in menuItems"
        :key="item.path"
        :index="item.path"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.title }}</span>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer">
      <el-button
        type="text"
        class="collapse-btn"
        @click="toggleCollapse"
      >
        <el-icon>
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </el-button>
      <el-button
        type="text"
        class="logout-btn"
        @click="handleLogout"
        v-show="!isCollapsed"
      >
        退出登录
      </el-button>
    </div>
  </aside>
</template>

<style scoped>
.seller-sidebar {
  width: 220px;
  height: 100vh;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.2s ease;
}

.seller-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #334155;
}

.logo {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.logo-mini {
  color: #ff6a00;
  font-size: 20px;
  font-weight: 700;
}

.sidebar-menu {
  flex: 1;
  border: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapse-btn,
.logout-btn {
  color: #94a3b8;
}

.collapse-btn:hover,
.logout-btn:hover {
  color: #ff6a00;
}
</style>