<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPublishingCoupon, receiveCoupon } from '@/api/coupon'

const router = useRouter()

// 优惠券数据类型定义 (PropTypes)
/**
 * @typedef {Object} CouponItem
 * @property {number} id - 优惠券ID
 * @property {string} title - 主标题
 * @property {string} subTitle - 副标题
 * @property {number} couponType - 类型：1=满减券，2=红包
 * @property {number} thresholdAmount - 门槛金额
 * @property {number} reduceAmount - 减免金额
 * @property {string} thresholdDesc - 门槛描述
 * @property {string} validityDesc - 有效期描述
 * @property {number} receiveStatus - 状态：0=未领取，1=已领取，2=已抢光
 */

// 优惠券列表
const couponList = ref([])
const loading = ref(false)

// 领取中的ID集合
const receivingIds = ref(new Set())

// 获取优惠券列表
const fetchCoupons = async () => {
  loading.value = true
  try {
    const res = await getPublishingCoupon()
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

// 领取优惠券
const handleReceive = async (coupon) => {
  if (receivingIds.value.has(coupon.id)) return

  receivingIds.value.add(coupon.id)

  try {
    const res = await receiveCoupon(coupon.id)
    if (res.code === 200) {
      ElMessage.success('领取成功！')
      // 更新状态为已领取（去使用）
      coupon.receiveStatus = 2
    } else {
      ElMessage.error(res.msg || '领取失败')
    }
  } catch (error) {
    console.error('领取优惠券失败:', error)
    ElMessage.error('领取失败，请稍后重试')
  } finally {
    receivingIds.value.delete(coupon.id)
  }
}

// 去使用 - 跳转到首页
const handleGoUse = () => {
  router.push('/home')
}

// 判断是否为短期有效期（1天内）
const isShortValidity = (validityDesc) => {
  return validityDesc === '领取后1天内有效'
}

// 获取按钮配置
const getButtonConfig = (coupon) => {
  switch (coupon.receiveStatus) {
    case 0:
      return { text: '立即领取', class: 'btn-receive', disabled: false }
    case 1:
      return { text: '已抢光', class: 'btn-soldout', disabled: true }
    case 2:
      return { text: '去使用', class: 'btn-use', disabled: false }
    default:
      return { text: '立即领取', class: 'btn-receive', disabled: false }
  }
}

// 获取卡片样式类
const getCardClass = (coupon) => {
  return {
    'coupon-red': coupon.couponType === 2, // 红包
    'coupon-yellow': coupon.couponType === 1, // 满减券
    'disabled': coupon.receiveStatus === 1
  }
}

// 点击按钮
const handleButtonClick = (coupon) => {
  if (coupon.receiveStatus === 0) {
    handleReceive(coupon)
  } else if (coupon.receiveStatus === 2) {
    handleGoUse()
  }
}

onMounted(() => {
  fetchCoupons()
})
</script>

<template>
  <div class="coupon-center-page">
    <div class="container">
      <!-- 页面标题 -->
      <header class="page-header">
        <h1 class="header-title">领券中心</h1>
        <p class="header-subtitle">精选好券，省钱购物</p>
      </header>

      <!-- 促销 Banner -->
      <section class="promo-banner">
        <div class="banner-content">
          <div class="banner-left">
            <span class="banner-icon">🎁</span>
            <div class="banner-text">
              <h2>限时福利</h2>
              <p>优惠券每日更新，先到先得</p>
            </div>
          </div>
          <div class="banner-right">
            <span class="banner-tag">火热进行中</span>
          </div>
        </div>
      </section>

      <!-- 优惠券列表 -->
      <section class="coupon-list" v-loading="loading">
        <div v-if="couponList.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无可领取的优惠券"></el-empty>
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
                <p
                  class="coupon-validity"
                  :class="{ 'short-validity': isShortValidity(coupon.validityDesc) }"
                >
                  {{ coupon.validityDesc }}
                </p>
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

            <!-- 顶部装饰圆 -->
            <div class="decor-circle decor-top"></div>
            <!-- 底部装饰圆 -->
            <div class="decor-circle decor-bottom"></div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.coupon-center-page {
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

/* 促销 Banner */
.promo-banner {
  background: linear-gradient(135deg, #ff6a00 0%, #ff8533 100%);
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(255, 106, 0, 0.3);
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-icon {
  font-size: 40px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.banner-text h2 {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
}

.banner-text p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0;
}

.banner-tag {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(10px);
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

/* 优惠券卡片 - 锯齿边缘设计 */
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
  /* 卡片保持原色，仅按钮置灰 */
}

/* 红包色调 - 偏红 */
.coupon-card.coupon-red .coupon-left {
  background: #ff7617;
}

.coupon-card.coupon-red .action-btn.btn-receive {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.coupon-card.coupon-red .action-btn.btn-receive:hover {
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.coupon-card.coupon-red .action-btn.btn-use {
  color: #f59e0b;
  border-color: #f59e0b;
}

.coupon-card.coupon-red .action-btn.btn-use:hover {
  background: #fef2f2;
}

/* 满减券色调 - 偏黄 */
.coupon-card.coupon-yellow .coupon-left {
  background: #ff7617;
}

.coupon-card.coupon-yellow .action-btn.btn-receive {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.coupon-card.coupon-yellow .action-btn.btn-receive:hover {
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.coupon-card.coupon-yellow .action-btn.btn-use {
  color: #f59e0b;
  border-color: #f59e0b;
}

.coupon-card.coupon-yellow .action-btn.btn-use:hover {
  background: #fffbeb;
}

/* 已抢光状态 - 左侧保持原色，仅按钮置灰 */
.coupon-card.disabled .action-btn.btn-receive {
  background: #e5e7eb;
  color: #9ca3af;
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
  font-size: 12px;
  margin-top: 8px;
  color: #4a4b4e;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 3px 10px;
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
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.coupon-validity.short-validity {
  color: #ef4444;
  font-weight: 700;
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
  color: #fff;
}

.action-btn.btn-receive {
  color: #fff;
}

.action-btn.btn-use {
  background: transparent;
  border: 1.5px solid;
}

.action-btn.btn-soldout {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: default;
  pointer-events: none;
}

/* 装饰圆 - 用于卡片左右分隔 */
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
  .banner-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .banner-left {
    flex-direction: column;
    gap: 12px;
  }

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