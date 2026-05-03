<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardStats } from '@/api/seller'

// Mock 数据（用于测试）
const mockStats = {
  totalSales: 125680,
  totalOrders: 386,
  totalProducts: 52,
  todaySales: 8520,
  pendingOrders: 12
}

const stats = ref(mockStats)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getDashboardStats()
    if (res?.code === 200) {
      stats.value = res.data || mockStats
    }
  } catch (error) {
    // 使用 mock 数据
    stats.value = mockStats
    console.log('使用 Mock 数据')
  } finally {
    loading.value = false
  }
})

const statCards = [
  { key: 'totalSales', title: '总销售额', unit: '元', color: '#ff6a00' },
  { key: 'totalOrders', title: '总订单数', unit: '笔', color: '#3b82f6' },
  { key: 'totalProducts', title: '商品数量', unit: '件', color: '#10b981' },
  { key: 'todaySales', title: '今日销售额', unit: '元', color: '#8b5cf6' },
  { key: 'pendingOrders', title: '待处理订单', unit: '笔', color: '#f59e0b' }
]
</script>

<template>
  <div class="seller-dashboard">
    <h1 class="page-title">数据概览</h1>

    <el-skeleton :loading="loading" animated :rows="5">
      <template #default>
        <div class="stats-grid">
          <div
            v-for="card in statCards"
            :key="card.key"
            class="stat-card"
            :style="{ borderColor: card.color }"
          >
            <div class="stat-value" :style="{ color: card.color }">
              {{ stats[card.key] || 0 }}
            </div>
            <div class="stat-title">{{ card.title }}</div>
            <div class="stat-unit">{{ card.unit }}</div>
          </div>
        </div>

        <div class="welcome-section">
          <h2>欢迎使用商家后台</h2>
          <p>在这里管理您的商品、订单和店铺信息</p>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.seller-dashboard {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-title {
  font-size: 14px;
  color: #64748b;
}

.stat-unit {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.welcome-section {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
}

.welcome-section h2 {
  color: #1e293b;
  font-size: 20px;
  margin: 0 0 12px;
}

.welcome-section p {
  color: #64748b;
  margin: 0;
}
</style>