<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const orderSn = ref('')

// 查看订单详情
const goToOrderDetail = () => {
  router.push(`/order/detail/${orderSn.value}`)
}

// 返回首页
const goHome = () => {
  router.push('/home')
}

// 继续购物
const continueShopping = () => {
  router.push('/home')
}

onMounted(() => {
  orderSn.value = route.query.orderSn || ''
})
</script>

<template>
  <div class="success-page">
    <div class="success-container">
      <!-- 成功图标 -->
      <div class="success-icon">
        <el-icon :size="80" color="#52c41a"><CircleCheckFilled /></el-icon>
      </div>

      <!-- 成功标题 -->
      <h1 class="success-title">支付成功</h1>

      <!-- 成功描述 -->
      <p class="success-desc">您的订单已支付成功，商家将尽快为您发货</p>

      

      <!-- 温馨提示 -->
      <div class="tips-card">
        <h3>温馨提示</h3>
        <ul>
          <li>您可以在"我的订单"中查看订单状态</li>
          <li>如需退款，请在订单详情页申请</li>
          <li>如有疑问，请联系客服</li>
        </ul>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" color="#ff6a00" @click="goToOrderDetail">
          查看订单
        </el-button>
        <el-button size="large" @click="continueShopping">
          继续购物
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.success-page {
  min-height: calc(100vh + 20px);
  background: #f5f5f5;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin-top: -60px;
}

.success-container {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
}

/* 成功图标 */
.success-icon {
  margin-bottom: 24px;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 成功标题 */
.success-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

/* 成功描述 */
.success-desc {
  font-size: 15px;
  color: #666;
  margin: 0 0 24px;
  line-height: 1.6;
}

/* 订单信息 */
.order-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: inline-block;
}

.order-info .label {
  font-size: 14px;
  color: #999;
}

.order-info .value {
  font-size: 14px;
  color: #333;
  font-family: monospace;
}

/* 温馨提示卡片 */
.tips-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
  margin-bottom: 32px;
}

.tips-card h3 {
  font-size: 14px;
  color: #333;
  margin: 0 0 12px;
}

.tips-card ul {
  margin: 0;
  padding-left: 18px;
}

.tips-card li {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
}

.action-buttons .el-button {
  flex: 1;
  height: 48px;
  font-size: 16px;
}

.action-buttons .el-button--primary {
  color: #fff;
}
</style>