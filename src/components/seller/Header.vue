<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, User } from '@element-plus/icons-vue'
import { fetchSellerInfo, sellerInfo } from '@/store/seller'

const router = useRouter()

// Mock 商家信息（兜底）
const mockSellerInfo = {
  name: 'Star旗舰店',
  username: 'seller001'
}

const displayInfo = ref(mockSellerInfo)

onMounted(async () => {
  await fetchSellerInfo()
  if (sellerInfo.value) {
    displayInfo.value = sellerInfo.value
  }
})
</script>

<template>
  <header class="seller-header">
    <div class="header-left">
      <h1 class="page-title">商家后台</h1>
    </div>

    <div class="header-right">
      <el-badge :value="0" :hidden="true" class="notification-badge">
        <el-button :icon="Bell" circle />
      </el-badge>

      <div class="user-info">
        <el-icon><User /></el-icon>
        <span class="username">{{ displayInfo.name || displayInfo.username || '商家' }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.seller-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.username {
  color: #1e293b;
  font-weight: 500;
}
</style>