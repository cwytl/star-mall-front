<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElTabs, ElTabPane, ElEmpty } from 'element-plus'
import { getMyCoupons } from '@/api/coupon'

const router = useRouter()

// 优惠券列表
const couponList = ref([])
const loading = ref(false)
const activeTab = ref('all')

// 获取我的优惠券列表
const fetchMyCoupons = async (status) => {
  loading.value = true
  try {
    const res = await getMyCoupons(status)
    if (res.code === 200) {
      couponList.value = res.data || []
    }
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 切换 Tab
const handleTabChange = (tabName) => {
  const statusMap = {
    all: undefined,
    unused: 0,
    used: 2,
    expired: 3
  }
  fetchMyCoupons(statusMap[tabName])
}

// 去使用 - 跳转到首页
const handleGoUse = () => {
  router.push('/home')
}

// 获取卡片样式类
const getCardClass = (coupon) => {
  return {
    'coupon-red': coupon.couponType === 2,
    'coupon-yellow': coupon.couponType === 1,
    'disabled': coupon.status === 2 || coupon.status === 3
  }
}

// 获取按钮配置
const getButtonConfig = (coupon) => {
  // status: 0=未使用, 1=已锁定, 2=已使用, 3=已过期
  switch (coupon.status) {
    case 0:
      return { text: '去使用', class: 'btn-use', disabled: false }
    case 1:
      return { text: '已锁定', class: 'btn-locked', disabled: true }
    case 2:
      return { text: '已使用', class: 'btn-used', disabled: true }
    case 3:
      return { text: '已过期', class: 'btn-expired', disabled: true }
    default:
      return { text: '去使用', class: 'btn-use', disabled: false }
  }
}

// 点击按钮
const handleButtonClick = (coupon) => {
  if (coupon.status === 0) {
    handleGoUse()
  }
}

onMounted(() => {
  fetchMyCoupons()
})
</script>

<template>
  <div class="user-coupon-page">
    <div class="container">
      <!-- 页面标题 -->
      <header class="page-header">
        <h1 class="header-title">我的卡券包</h1>
        <p class="header-subtitle">管理您的优惠券</p>
      </header>

      <!-- Tab 切换 -->
      <section class="coupon-tabs">
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="all"></el-tab-pane>
          <el-tab-pane label="未使用" name="unused"></el-tab-pane>
          <el-tab-pane label="已使用" name="used"></el-tab-pane>
          <el-tab-pane label="已过期" name="expired"></el-tab-pane>
        </el-tabs>
      </section>

      <!-- 优惠券列表 -->
      <section class="coupon-list" v-loading="loading">
        <div v-if="couponList.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无优惠券"></el-empty>
        </div>

        <div class="coupon-grid">
          <div
            v-for="coupon in couponList"
            :key="coupon.id"
            class="coupon-card"
            :class="getCardClass(coupon)"
          >
            <!-- 左侧金额区域 -->
            <div class="coupon-left">
              <div class="coupon-amount">
                <span class="currency">¥</span>
                <span class="value">{{ coupon.reduceAmount }}</span>
              </div>
              <div class="coupon-threshold">
                {{ coupon.thresholdDesc }}
              </div>
            </div>

            <!-- 锯齿边缘装饰 -->
            <div class="coupon-edge">
              <div class="circle" v-for="i in 6" :key="i"></div>
            </div>

            <!-- 右侧信息区域 -->
            <div class="coupon-right">
              <div class="coupon-info">
                <h3 class="coupon-title">{{ coupon.title }}</h3>
                <p class="coupon-subtitle">{{ coupon.subTitle }}</p>
                <p class="coupon-validity">{{ coupon.expireDesc }}</p>
              </div>
              <div class="coupon-action">
                <button
                  :class="['action-btn', getButtonConfig(coupon).class]"
                  :disabled="getButtonConfig(coupon).disabled"
                  @click="handleButtonClick(coupon)"
                >
                  {{ getButtonConfig(coupon).text }}
                </button>
              </div>
            </div>

            <!-- 装饰圆 -->
            <div class="decor-circle decor-top"></div>
            <div class="decor-circle decor-bottom"></div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.user-coupon-page {
  background: #f7f9fc;
  min-height: 100vh;
  padding: 50px 0 60px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.header-title {
  font-size: 24px !important;
  font-weight: 800 !important;
  color: #1f2937 !important;
  margin: 0 0 8px;
}

.header-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Tab 样式 */
.coupon-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #ff6a00;
  font-weight: 700;
}

.custom-tabs :deep(.el-tabs__active-bar) {
  background-color: #ff6a00;
}

/* 优惠券列表 */
.coupon-list {
  min-height: 200px;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .coupon-grid {
    grid-template-columns: 1fr;
  }
}

/* 优惠券卡片 */
.coupon-card {
  position: relative;
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.coupon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.coupon-card.disabled {
  opacity: 0.7;
}

/* 红包色调 */
.coupon-card.coupon-red .coupon-left {
  background: #ff7617;
}

.coupon-card.coupon-red .action-btn.btn-use {
  color: #f59e0b;
  border-color: #f59e0b;
}

.coupon-card.coupon-red .action-btn.btn-use:hover {
  background: #fffbeb;
}

/* 满减券色调 */
.coupon-card.coupon-yellow .coupon-left {
  background: #ff7617;
}

.coupon-card.coupon-yellow .action-btn.btn-use {
  color: #f59e0b;
  border-color: #f59e0b;
}

.coupon-card.coupon-yellow .action-btn.btn-use:hover {
  background: #fffbeb;
}

/* 左侧金额区域 */
.coupon-left {
  width: 120px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
  flex-shrink: 0;
  background: #ff7617;
}

.coupon-amount {
  display: flex;
  align-items: baseline;
  line-height: 1;
}

.coupon-amount .currency {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.coupon-amount .value {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
}

.coupon-threshold {
  font-size: 13px;
  margin-top: 8px;
  color: #4a4b4e;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 12px;
}

/* 锯齿边缘 */
.coupon-edge {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 0;
}

.coupon-edge .circle {
  width: 12px;
  height: 12px;
  background: #f7f9fc;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 右侧信息区域 */
.coupon-right {
  flex: 1;
  padding: 16px 16px 16px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.coupon-info {
  flex: 1;
}

.coupon-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon-validity {
  font-size: 13px;
  color: #ff6a00;
  font-weight: 600;
  margin: 0;
  background: #fff7ed;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
}

/* 操作按钮 */
.coupon-action {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.action-btn.btn-use {
  background: transparent;
  border: 1.5px solid #f59e0b;
  color: #f59e0b;
}

.action-btn.btn-use:hover {
  background: #fffbeb;
}

.action-btn.btn-locked,
.action-btn.btn-used,
.action-btn.btn-expired {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: default;
  pointer-events: none;
}

/* 装饰圆 */
.decor-circle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #f7f9fc;
  border-radius: 50%;
  left: 112px;
}

.decor-top {
  top: -8px;
}

.decor-bottom {
  bottom: -8px;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
  background: #fff;
  border-radius: 12px;
}

@media (max-width: 480px) {
  .coupon-left {
    width: 100px;
    min-height: 100px;
  }

  .coupon-amount .value {
    font-size: 28px;
  }

  .decor-circle {
    left: 92px;
  }
}
</style>