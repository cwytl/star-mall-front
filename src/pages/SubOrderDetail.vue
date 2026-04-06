<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSubOrderDetail } from '@/api/order'

const route = useRoute()
const router = useRouter()
const orderDetail = ref(null)
const loading = ref(false)

// 获取订单详情
const fetchOrderDetail = async () => {
  const subOrderSn = route.params.subOrderSn
  if (!subOrderSn) {
    ElMessage.error('订单编号不存在')
    return
  }
  loading.value = true
  try {
    const res = await getSubOrderDetail(subOrderSn)
    if (res?.code === 200) {
      orderDetail.value = res.data
    } else {
      ElMessage.error(res?.msg || '获取订单详情失败')
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

// 计算商品总数量
const totalQuantity = computed(() => {
  return orderDetail.value?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
})

// 状态颜色映射
const statusColorMap = {
  0: { bg: 'linear-gradient(135deg, #ff6a00 0%, #ff9500 100%)', text: '待付款', color: '#ff6a00' },
  1: { bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', text: '待发货', color: '#f59e0b' },
  2: { bg: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', text: '已发货', color: '#3b82f6' },
  3: { bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', text: '已完成', color: '#10b981' },
  4: { bg: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)', text: '已关闭', color: '#6b7280' }
}

// 订单状态样式
const statusStyle = computed(() => {
  const status = orderDetail.value?.status
  return statusColorMap[status] || statusColorMap[4]
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ')
}

// 复制订单编号
const copyOrderSn = (sn) => {
  navigator.clipboard.writeText(sn).then(() => {
    ElMessage.success('订单编号已复制')
  })
}

// 返回订单列表
const goBack = () => {
  router.push('/order')
}

// 打开商品详情
const openProductDetail = (spuId) => {
  window.open(`/product/${spuId}`, '_blank')
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<template>
  <div class="order-detail-page" v-loading="loading">
    <div class="page-container" v-if="orderDetail">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>订单详情</h2>
        <el-button @click="goBack">返回订单列表</el-button>
      </div>

      <!-- 主要内容区 - 左右布局 -->
      <div class="main-content">
        <!-- 左侧订单信息 -->
        <div class="left-section">
          <!-- 订单状态 -->
          <div class="status-card">
            <div class="status-icon-wrapper" :style="{ background: statusStyle.bg }">
              <span class="status-text">{{ statusStyle.text }}</span>
            </div>
            <div class="status-info">
              <p class="status-desc">订单状态：{{ statusStyle.text }}</p>
              <p class="status-time" v-if="orderDetail.createTime">下单时间：{{ formatTime(orderDetail.createTime) }}</p>
            </div>
          </div>

          <!-- 收货信息 -->
          <div class="info-card">
            <div class="card-header">
              <h3>收货信息</h3>
            </div>
            <div class="card-body">
              <div class="info-item">
                <span class="info-label">收货人：</span>
                <span class="info-value">{{ orderDetail.receiverName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">联系电话：</span>
                <span class="info-value">{{ orderDetail.receiverPhone }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">收货地址：</span>
                <span class="info-value">{{ orderDetail.receiverProvince }}{{ orderDetail.receiverCity }}{{ orderDetail.receiverDistrict }}{{ orderDetail.receiverDetailAddress }}</span>
              </div>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="sub-order-card">
            <!-- 店铺头部 -->
            <div class="shop-header">
              <img :src="orderDetail.shopLogo" :alt="orderDetail.shopName" class="shop-logo" />
              <span class="shop-name">{{ orderDetail.shopName }}</span>
              <span class="status-tag" :style="{ background: statusStyle.color }">{{ orderDetail.statusDesc }}</span>
            </div>

            <!-- 商品表格 -->
            <div class="goods-table">
              <div class="goods-table-header">
                <div class="col-product">商品信息</div>
                <div class="col-price">单价</div>
                <div class="col-quantity">数量</div>
                <div class="col-subtotal">小计</div>
              </div>
              <div
                v-for="item in orderDetail.items"
                :key="item.skuId"
                class="goods-row"
                @click="openProductDetail(item.spuId)"
              >
                <div class="col-product">
                  <img :src="item.picUrl" :alt="item.spuName" class="goods-image" />
                  <div class="goods-info">
                    <p class="goods-name">{{ item.spuName }}</p>
                    <p class="goods-spec">{{ item.skuName }}</p>
                  </div>
                </div>
                <div class="col-price">¥{{ item.price }}</div>
                <div class="col-quantity">{{ item.quantity }}</div>
                <div class="col-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
            </div>

            <!-- 费用明细 -->
            <div class="sub-order-footer">
              <div class="fee-summary">
                <span class="fee-item">商品金额：¥{{ orderDetail.goodsAmount?.toFixed(2) }}</span>
                <span class="fee-item">运费：{{ orderDetail.freightAmount > 0 ? '¥' + orderDetail.freightAmount?.toFixed(2) : '包邮' }}</span>
                <span class="fee-item" v-if="orderDetail.couponAmount > 0">优惠券：-¥{{ orderDetail.couponAmount?.toFixed(2) }}</span>
              </div>
              <div class="sub-total">
                <span>订单合计：</span>
                <span class="amount">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧信息面板 -->
        <div class="right-section">
          <!-- 订单信息 -->
          <div class="panel-card">
            <div class="panel-header">
              <h3>订单信息</h3>
            </div>
            <div class="panel-body">
              <div class="info-row">
                <span class="row-label">订单编号</span>
                <div class="row-value">
                  <span>{{ orderDetail.subOrderSn }}</span>
                  <el-button type="primary" link size="small" @click="copyOrderSn(orderDetail.subOrderSn)">复制</el-button>
                </div>
              </div>
              <div class="info-row">
                <span class="row-label">下单时间</span>
                <span class="row-value">{{ formatTime(orderDetail.createTime) }}</span>
              </div>
              <div class="info-row" v-if="orderDetail.paymentTime">
                <span class="row-label">支付时间</span>
                <span class="row-value">{{ formatTime(orderDetail.paymentTime) }}</span>
              </div>
              <div class="info-row">
                <span class="row-label">支付方式</span>
                <span class="row-value">{{ orderDetail.paymentTypeDesc }}</span>
              </div>
              <div class="info-row" v-if="orderDetail.remark">
                <span class="row-label">订单备注</span>
                <span class="row-value">{{ orderDetail.remark }}</span>
              </div>
            </div>
          </div>

          <!-- 物流信息 -->
          <div class="panel-card" v-if="orderDetail.status >= 2 && orderDetail.deliveryCompany">
            <div class="panel-header">
              <h3>物流信息</h3>
            </div>
            <div class="panel-body">
              <div class="info-row">
                <span class="row-label">物流公司</span>
                <span class="row-value">{{ orderDetail.deliveryCompany }}</span>
              </div>
              <div class="info-row">
                <span class="row-label">物流单号</span>
                <div class="row-value">
                  <span>{{ orderDetail.deliverySn }}</span>
                  <el-button type="primary" link size="small" @click="copyOrderSn(orderDetail.deliverySn)" v-if="orderDetail.deliverySn">复制</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 费用汇总 -->
          <div class="panel-card summary-card">
            <div class="panel-header">
              <h3>费用汇总</h3>
            </div>
            <div class="panel-body">
              <div class="summary-row">
                <span>商品总数</span>
                <span>{{ totalQuantity }}件</span>
              </div>
              <div class="summary-row">
                <span>订单金额</span>
                <span class="total-amount">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
              </div>
            </div>
            <div class="panel-footer">
              <div class="final-total">
                <span>实付金额</span>
                <span class="pay-price">¥{{ orderDetail.payAmount?.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 主内容区 - 左右布局 */
.main-content {
  display: flex;
  gap: 24px;
}

.left-section {
  flex: 1;
  min-width: 0;
}

.right-section {
  width: 320px;
  flex-shrink: 0;
}

/* 订单状态卡片 */
.status-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}

.status-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.status-info {
  flex: 1;
}

.status-desc {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.status-time {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 信息卡片 */
.info-card {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.card-body {
  padding: 16px 20px;
}

.info-item {
  display: flex;
  font-size: 14px;
  padding: 8px 0;
}

.info-label {
  color: #666;
  width: 80px;
}

.info-value {
  color: #333;
  flex: 1;
}

/* 子订单卡片 */
.sub-order-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* 店铺头部 */
.shop-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
}

.shop-logo {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
}

.shop-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.status-tag {
  font-size: 12px;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 商品表格 */
.goods-table {
  padding: 0 20px;
}

.goods-table-header {
  display: grid;
  grid-template-columns: 1fr 120px 80px 120px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.goods-row {
  display: grid;
  grid-template-columns: 1fr 120px 80px 120px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  cursor: pointer;
}

.goods-row:last-child {
  border-bottom: none;
}

.goods-row:hover .goods-name {
  color: #ff6a00;
}

.col-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.col-price,
.col-quantity,
.col-subtotal {
  text-align: center;
}

.goods-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.goods-info {
  flex: 1;
  min-width: 0;
}

.goods-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 6px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.goods-spec {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* 子订单底部 */
.sub-order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #f0f0f0;
}

.fee-summary {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.sub-total {
  font-size: 14px;
}

.sub-total .amount {
  font-size: 18px;
  font-weight: 600;
  color: #ff6a00;
}

/* 右侧面板 */
.panel-card {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.panel-body {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  padding: 8px 0;
}

.row-label {
  color: #666;
  min-width: 80px;
}

.row-value {
  color: #333;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 费用汇总 */
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  padding: 8px 0;
}

.total-amount {
  color: #333;
  font-weight: 500;
}

.panel-footer {
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #f0f0f0;
}

.final-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.final-total span:first-child {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.pay-price {
  font-size: 24px;
  font-weight: 700;
  color: #ff6a00;
}
</style>