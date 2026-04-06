<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getSubOrderList, cancelOrder, deleteOrder, confirmReceive } from '@/api/order'

const router = useRouter()
const activeTab = ref('all')
const orders = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const countdownMap = ref({})
const expiredOrderIds = ref(new Set()) // 存储已超时订单ID
let countdownTimer = null

// 订单状态映射
// 0: 待付款, 1: 待发货, 2: 已发货(待收货), 3: 已完成, 4: 已关闭
const statusMap = {
  0: '待付款',
  1: '待发货',
  2: '已发货',
  3: '已完成',
  4: '已关闭'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ')
}

// 计算倒计时
const calcCountdown = (deadline) => {
  if (!deadline) return ''
  const now = new Date()
  const end = new Date(deadline)
  const diff = end - now
  if (diff <= 0) return '已超时'
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}分${seconds}秒`
}

// 更新所有待付款订单的倒计时
const updateAllCountdowns = () => {
  orders.value.forEach(order => {
    if (order.status === 0 && order.payDeadline) {
      const countdown = calcCountdown(order.payDeadline)
      countdownMap.value[order.subOrderId] = countdown
      // 倒计时结束，将订单状态设置为已关闭
      if (countdown === '已超时') {
        order.status = 4
        order.statusDesc = '已关闭'
        delete countdownMap.value[order.subOrderId]
        expiredOrderIds.value.add(order.subOrderId) // 记录已超时订单
        // 如果当前在"待付款"标签页，从列表中移除该订单
        if (activeTab.value === 'pending_payment') {
          orders.value = orders.value.filter(o => o.subOrderId !== order.subOrderId)
        }
      }
    }
  })
}

// 启动倒计时定时器
const startCountdownTimer = () => {
  if (countdownTimer) return
  countdownTimer = setInterval(updateAllCountdowns, 1000)
}

// 停止倒计时定时器
const stopCountdownTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 处理订单数据，移除内联样式，并检查超时订单
const normalizeOrders = (list = []) => {
  return list.map(order => {
    const normalizedItems = (order.items || []).map(item => ({
      ...item,
      // 移除 spuName 中的内联样式，保留 em 标签
      spuName: (item.spuName || '').replace(/style\s*=\s*['"][^'"]*['"]/gi, '')
    }))
    // 检查订单是否已超时（本地缓存或 payDeadline 已过）
    let status = order.status
    let statusDesc = order.statusDesc
    if (order.status === 0 && order.payDeadline) {
      if (expiredOrderIds.value.has(order.subOrderId) || calcCountdown(order.payDeadline) === '已超时') {
        status = 4
        statusDesc = '已关闭'
        expiredOrderIds.value.add(order.subOrderId)
      }
    }
    return {
      ...order,
      items: normalizedItems,
      status,
      statusDesc
    }
  })
}

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: 1,
      pageSize: 12
    }
    // 根据当前 tab 设置状态筛选
    if (activeTab.value !== 'all') {
      const statusValueMap = {
        pending_payment: 0,
        pending_shipment: 1,
        pending_receipt: 2,
        completed: 3,
        closed: 4
      }
      params.status = statusValueMap[activeTab.value]
    }
    // 搜索功能
    const keyword = searchKeyword.value.trim()
    if (keyword) {
      // 如果是纯数字，当作 subOrderId 搜索
      if (/^\d+$/.test(keyword)) {
        params.subOrderId = Number(keyword)
      } else {
        // 否则当作商品名称搜索
        params.spuName = keyword
      }
    }
    const res = await getSubOrderList(params)
    if (res.code === 200) {
      orders.value = normalizeOrders(res.data.records || [])
      // 如果是"已关闭"标签页，额外获取待付款订单中的超时订单
      if (activeTab.value === 'closed') {
        try {
          const pendingRes = await getSubOrderList({ pageNo: 1, pageSize: 100, status: 0 })
          if (pendingRes.code === 200) {
            const expiredOrders = normalizeOrders(pendingRes.data.records || []).filter(o => o.status === 4)
            // 合并超时订单（避免重复）
            const existingIds = new Set(orders.value.map(o => o.subOrderId))
            expiredOrders.forEach(o => {
              if (!existingIds.has(o.subOrderId)) {
                orders.value.push(o)
              }
            })
          }
        } catch (e) {
          console.error('获取待付款订单失败:', e)
        }
      }
      updateAllCountdowns()
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  fetchOrders()
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  fetchOrders()
}

const goToDetail = (spuId) => {
  const url = router.resolve(`/product/${spuId}`).href
  window.open(url, '_blank')
}

// 跳转到子订单详情
const goToOrderDetail = (subOrderSn) => {
  router.push(`/order/sub/${subOrderSn}`)
}

// 切换 tab 时重新获取数据
const handleTabChange = () => {
  fetchOrders()
}

const handlePay = (order) => {
  router.push({
    path: '/cashier',
    query: {
      orderSn: order.subOrderSn,
      payAmount: order.payAmount,
      payDeadline: order.paymentTime ? '' : Date.now() + 30 * 60 * 1000,
      payType: order.paymentType || 1
    }
  })
}

const handleConfirmReceipt = async (order) => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '确认收货', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      lockScroll: false
    })

    const res = await confirmReceive(order.subOrderSn)
    if (res?.code === 200) {
      ElMessage.success('已确认收货')
      fetchOrders()
    } else {
      ElMessage.error(res?.msg || '确认收货失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('确认收货失败，请重试')
    }
  }
}

const handleCancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？取消后商品将不再为您保留。',
      '取消订单',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '我再想想',
        type: 'warning',
        lockScroll: false
      }
    )

    const res = await cancelOrder(order.subOrderSn)
    if (res?.code === 200 && res?.data === true) {
      ElMessage.success('订单已成功取消')
      fetchOrders()
    } else {
      ElMessage.error(res?.msg || '取消订单失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('取消订单失败，请重试')
    }
  }
}

const handleDeleteOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该订单吗？删除后将无法恢复。',
      '删除订单',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        lockScroll: false
      }
    )

    const res = await deleteOrder(order.subOrderSn)
    if (res?.code === 200) {
      ElMessage.success('订单已删除')
      fetchOrders()
    } else {
      ElMessage.error(res?.msg || '删除订单失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除订单失败，请重试')
    }
  }
}

onMounted(() => {
  fetchOrders()
  startCountdownTimer()
})

onUnmounted(() => {
  stopCountdownTimer()
})

</script>

<template>
  <div class="order-page">
    <div class="container">
      <header class="order-header">
        <h1 class="header-title">我的订单</h1>
      </header>

      <!-- 搜索栏 -->
      <section class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="输入商品名称"
          class="search-input"
          clearable
          @clear="clearSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" color="#ff6a00" @click="handleSearch">搜索</el-button>
      </section>

      <section class="order-tabs">
        <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="全部订单" name="all"></el-tab-pane>
          <el-tab-pane label="待付款" name="pending_payment"></el-tab-pane>
          <el-tab-pane label="待发货" name="pending_shipment"></el-tab-pane>
          <el-tab-pane label="待收货" name="pending_receipt"></el-tab-pane>
          <el-tab-pane label="已完成" name="completed"></el-tab-pane>
          <el-tab-pane label="已关闭" name="closed"></el-tab-pane>
        </el-tabs>
      </section>

      <div class="order-list" v-loading="loading">
        <div v-if="orders.length === 0" class="empty-state">
          <el-empty description="暂无相关订单"></el-empty>
        </div>

        <div v-for="order in orders" :key="order.subOrderId" class="order-card">
          <div class="order-card__header">
            <div class="header-left">
              <span class="order-time">{{ formatTime(order.createTime) }}</span>
              <span class="order-id">订单号: {{ order.subOrderSn }}</span>
              <el-button type="primary" link size="small" @click="goToOrderDetail(order.subOrderSn)">订单详情</el-button>
            </div>
            <div class="header-right">
              <span :class="['order-status', `status-${order.status}`]">{{ order.statusDesc }}</span>
              <span v-if="order.status === 0 && countdownMap[order.subOrderId]" class="countdown">
                剩余 {{ countdownMap[order.subOrderId] }}
              </span>
            </div>
          </div>

          <div class="order-card__body">
            <div v-for="item in order.items" :key="item.skuId" class="item-row" @click="goToDetail(item.spuId)">
              <div class="item-image" :style="{ backgroundImage: `url(${item.picUrl})` }"></div>
              <div class="item-info">
                <p class="item-title" v-html="item.spuName"></p>
                <p class="item-spec">{{ item.skuName }}</p>
              </div>
              <div class="item-price">
                <p class="price-val">¥{{ item.price.toFixed(2) }}</p>
                <p class="price-qty">x{{ item.quantity }}</p>
              </div>
            </div>
          </div>

          <div class="order-card__footer">
            <div class="total-info">
              <span>合计: </span>
              <span class="total-price">¥{{ order.payAmount.toFixed(2) }}</span>
            </div>
            <div class="actions">
              <template v-if="order.status === 0">
                <el-button @click="handleCancelOrder(order)">取消订单</el-button>
                <el-button type="primary" color="#ff6a00" @click="handlePay(order)">立即付款</el-button>
              </template>
              <template v-if="order.status === 1">
                <el-button plain>提示发货</el-button>
              </template>
              <template v-if="order.status === 2">
                <el-button plain>查看物流</el-button>
                <el-button type="primary" color="#ff6a00" @click="handleConfirmReceipt(order)">确认收货</el-button>
              </template>
              <template v-if="order.status === 3">
                <el-button plain>评价订单</el-button>
                <el-button plain>申请退换</el-button>
              </template>
              <template v-if="order.status === 4">
                <el-button plain @click="handleDeleteOrder(order)">删除订单</el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-page {
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

.order-header {
  margin-bottom: 24px;
}

.header-title {
  font-size: 24px !important;
  font-weight: 800 !important;
  color: #1f2937 !important;
  margin: 0;
}

/* 搜索栏 */
.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ff6a00 inset;
}

.search-input :deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 1px #ff6a00 inset;
}

.order-tabs {
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

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.order-card__header {
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #6b7280;
}

.order-id {
  color: #374151;
}

.order-status {
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
}

.status-0 { color: #ff6a00; } /* 待付款 */
.status-1 { color: #f59e0b; } /* 待发货 */
.status-2 { color: #3b82f6; } /* 已发货 */
.status-3 { color: #10b981; } /* 已完成 */
.status-4 { color: #9ca3af; } /* 已关闭 */

.countdown {
  margin-left: 12px;
  color: #ef4444;
  font-weight: 600;
}

.order-card__body {
  padding: 10px 20px;
}

.item-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px dashed #f1f5f9;
  cursor: pointer;
}

.item-row:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
}

.item-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  margin: 0 0 4px;
  font-weight: 600;
  color: #1f2937;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-title :deep(em) {
  font-style: normal;
  font-size: inherit;
  font-weight: inherit;
  color: #ff6a00;
}

.item-spec {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.item-price {
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.price-val {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
}

.price-qty {
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.order-card__footer {
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
}

.total-info {
  font-size: 14px;
}

.total-price {
  font-size: 18px;
  font-weight: 800;
  color: #ef4444;
  margin-left: 4px;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions .el-button--primary {
  color: #fff;
}

.empty-state {
  padding: 40px 0;
  background: #fff;
  border-radius: 12px;
}

@media (max-width: 640px) {
  .header-left {
    flex-direction: column;
    gap: 4px;
  }

  .order-card__footer {
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }
}
</style>
