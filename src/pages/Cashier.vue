<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import { getParentOrderStatus, getSubOrderStatus, cancelOrder } from '@/api/order'

const router = useRouter()
const route = useRoute()

// 订单信息
const orderSn = ref('')
const subOrderSn = ref('')
const orderType = ref('parent')
const payAmount = ref('0.00')
const payDeadline = ref(null)
const paymentType = ref(1)

// 倒计时
const remainingTime = ref(0)
const countdownText = ref('')
const isTimeout = ref(false)

// 轮询定时器
let pollTimer = null
let countdownTimer = null

// 计算支付方式名称
const payTypeName = computed(() => {
  return paymentType.value === 1 ? '支付宝' : paymentType.value === 2 ? '微信支付' : '在线支付'
})

// 生成二维码URL
const qrCodeUrl = computed(() => {
  if (!orderSn.value) return ''
  const payUrl = `http://172.20.10.3:8080/api/order/pay?orderSn=${orderSn.value}&paymentType=${paymentType.value}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payUrl)}`
})

// 格式化倒计时
const formatCountdown = (seconds) => {
  if (seconds <= 0) return '00分00秒'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}分${String(secs).padStart(2, '0')}秒`
}

// 更新倒计时
const updateCountdown = () => {
  if (!payDeadline.value) return

  const now = Date.now()
  const diff = Math.floor((payDeadline.value - now) / 1000)

  if (diff <= 0) {
    remainingTime.value = 0
    countdownText.value = '00分00秒'
    isTimeout.value = true
    stopPolling()
    ElMessage.error('订单已超时，请重新下单')
    return
  }

  remainingTime.value = diff
  countdownText.value = formatCountdown(diff)
}

// 轮询订单状态
const pollOrderStatus = async () => {
  if (isTimeout.value) return

  try {
    // 根据订单类型选择不同的轮询 API
    let res
    if (orderType.value === 'sub') {
      // 子订单：轮询子订单状态
      res = await getSubOrderStatus(subOrderSn.value)
    } else {
      // 主订单：轮询主订单状态
      res = await getParentOrderStatus(orderSn.value)
    }
    const status = res?.data

    if (status === 1) {
      // 支付成功
      stopPolling()
      ElMessage.success('支付成功！')
      setTimeout(() => {
        router.replace({
          path: '/order/success',
          query: { orderSn: orderSn.value }
        })
      }, 3000)
    } else if (status === 4) {
      // 订单已关闭
      stopPolling()
      ElMessage.error('订单已关闭')
      router.back()
    }
  } catch (err) {
    console.error('查询订单状态失败:', err)
  }
}

// 开始轮询
const startPolling = () => {
  // 每2秒轮询一次
  pollTimer = setInterval(pollOrderStatus, 2000)
  // 立即执行一次
  pollOrderStatus()
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 复制订单编号
const copyOrderSn = async () => {
  try {
    await navigator.clipboard.writeText(orderSn.value)
    ElMessage.success('订单编号已复制')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 返回订单详情
const goToOrderDetail = () => {
  router.push(`/order/detail/${orderSn.value}`)
}

// 取消订单
const cancelOrderLoading = ref(false)

const handleCancelOrder = () => {
  ElMessageBox.confirm(
    '确定要取消该订单吗？取消后商品将不再为您保留。',
    '提示',
    {
      confirmButtonText: '确定取消',
      cancelButtonText: '我再想想',
      type: 'warning',
      lockScroll: false
    }
  ).then(async () => {
    // 停止轮询
    stopPolling()

    cancelOrderLoading.value = true
    try {
      const res = await cancelOrder(orderSn.value)
      if (res?.code === 200 && res?.data === true) {
        ElMessage.success('订单已成功取消')
        // 2秒后跳转到订单列表页
        setTimeout(() => {
          router.replace('/order')
        }, 2000)
      } else {
        ElMessage.error(res?.msg || '取消订单失败')
      }
    } catch (err) {
      ElMessage.error('取消订单失败，请重试')
    } finally {
      cancelOrderLoading.value = false
    }
  }).catch(() => {
    // 用户点击"我再想想"，不做任何操作
  })
}

// 初始化
onMounted(() => {
  // 从路由参数获取订单信息
  const { orderSn: sn, subOrderSn: subSn, orderType: type, payAmount: amount, payDeadline: deadline, paymentType: payType } = route.query

  if (!sn) {
    ElMessage.warning('订单信息不存在')
    router.push('/home')
    return
  }

  orderSn.value = sn
  subOrderSn.value = subSn || ''
  orderType.value = type || 'parent'
  payAmount.value = amount || '0.00'
  payDeadline.value = deadline ? Number(deadline) : null
  paymentType.value = payType ? Number(payType) : 1

  // 启动倒计时
  if (payDeadline.value) {
    updateCountdown()
    countdownTimer = setInterval(updateCountdown, 1000)
  }

  // 启动轮询
  startPolling()
})

// 清理
onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="cashier-page">
    <div class="cashier-container">
      <!-- 顶部标题 -->
      <div class="cashier-header" :class="{ 'alipay': paymentType === 1, 'wechat': paymentType === 2 }">
        <p class="pay-type-name">{{ payTypeName }}</p>
      </div>

      <!-- 待支付金额 -->
      <div class="amount-section">
        <span class="amount-label">待支付金额:</span>
        <span class="amount-value">¥{{ payAmount }}</span>
      </div>

   

      <!-- 倒计时 -->
      <div class="countdown-section" :class="{ timeout: isTimeout }">
        <template v-if="isTimeout">
          <span class="timeout-text">订单已超时，请重新下单</span>
        </template>
        <template v-else>
          <span class="countdown-label">剩余时间：</span>
          <span class="countdown-time">{{ countdownText }}</span>
        </template>
      </div>

      <!-- 二维码区域 -->
      <div class="qrcode-section" v-if="!isTimeout">
        <div class="qrcode-wrapper">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="支付二维码" class="qrcode-image" />
        </div>
        <p class="qrcode-tip">请使用手机扫码模拟支付</p>
      </div>

      <!-- 超时后显示返回按钮 -->
      <div class="action-section" v-if="isTimeout">
        <el-button type="primary" size="large" @click="router.push('/home')">
          返回首页
        </el-button>
      </div>

      <!-- 支付说明 -->
      <div class="tips-section">
        <h3>支付说明</h3>
        <ul>
          <li>请在倒计时结束前完成支付</li>
          <li>支付成功后将自动跳转到订单详情</li>
          <li>如遇问题，请联系客服</li>
        </ul>
      </div>

      <!-- 底部操作 -->
      <div class="footer-section" v-if="!isTimeout">
        <el-button text class="cancel-btn" @click="handleCancelOrder">
          取消订单
        </el-button>
        <el-button text type="primary" @click="goToOrderDetail">
          查看订单详情
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cashier-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.cashier-container {
  max-width: 500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* 顶部 */
.cashier-header {
  padding: 18px 18px;
  text-align: center;
  color: #fff;
}

.cashier-header.wechat {
  background: linear-gradient(135deg, #29b941 0%, #3ab491 100%);
}

.cashier-header.alipay {
  background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.pay-type-name {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
}

/* 金额区域 */
.amount-section {
  padding: 10px 24px;
  text-align: center;
  border-bottom: 1px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.amount-label {
  font-size: 20px;
  color: #5b5a5a;
}

.amount-value {
  font-size: 23px;
  font-weight: 700;
  color: #ff6a00;
}



/* 倒计时 */
.countdown-section {
  padding: 10px 24px;
  text-align: center;
  background: #ffffff;
}

.countdown-section.timeout {
  background: #fff0f0;
}

.countdown-label {
  font-size: 14px;
  color: #666;
}

.countdown-time {
  font-size: 20px;
  font-weight: 600;
  color: #f14c4c;
  margin-left: 8px;
}

.timeout-text {
  font-size: 16px;
  color: #f56c6c;
  font-weight: 500;
}

/* 二维码区域 */
.qrcode-section {
  padding: 20px 24px;
  text-align: center;
}

.qrcode-wrapper {
  display: inline-block;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 16px;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  display: block;
}

.qrcode-tip {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 操作区域 */
.action-section {
  padding: 20px 24px;
  text-align: center;
}

/* 支付说明 */
.tips-section {
  padding: 20px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.tips-section h3 {
  font-size: 14px;
  color: #333;
  margin: 0 0 12px;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
}

.tips-section li {
  font-size: 13px;
  color: #999;
  line-height: 1.8;
}

/* 底部 */
.footer-section {
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.cancel-btn {
  color: #999;
}

.cancel-btn:hover {
  color: #666;
}
</style>