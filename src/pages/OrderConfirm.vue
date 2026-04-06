<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, CircleCheckFilled, Plus } from '@element-plus/icons-vue'
import AlipayIcon from '@/assets/images/pay-icon/支付宝.svg'
import WechatPayIcon from '@/assets/images/pay-icon/微信支付.svg'
import { checkout, submitOrder as submitOrderApi } from '@/api/order'
import { getUserAddressList } from '@/api/userAddress'
import { getAvailableCoupons } from '@/api/coupon'

const router = useRouter()

// 预下单数据
const orderData = ref(null)
const selectedPayType = ref(1) // 1-支付宝, 2-微信

// 优惠券相关
const couponList = ref([]) // 可用优惠券列表
const selectedCouponUserRecordId = ref(null)
const couponExpanded = ref(false) // 优惠券折叠状态

// 地址相关
const addressList = ref([])
const addressExpanded = ref(false)

// 排序后的地址列表（选中地址排在最前面）
const sortedAddresses = computed(() => {
  const list = [...addressList.value]
  const selectedAddressId = orderData.value?.userAddressId
  if (!selectedAddressId) return list

  const selectedIndex = list.findIndex(addr => addr.id === selectedAddressId)
  if (selectedIndex === -1) return list

  const selectedAddress = list.splice(selectedIndex, 1)[0]
  return [selectedAddress, ...list]
})

// 显示的地址列表（默认只显示3个）
const displayedAddresses = computed(() => {
  if (addressExpanded.value) {
    return sortedAddresses.value
  }
  return sortedAddresses.value.slice(0, 3)
})

// 是否有更多地址
const hasMoreAddresses = computed(() => {
  return addressList.value.length > 3
})

// 店铺备注（每个店铺独立的备注）
const shopRemarks = ref({})

// 计算商品总数量
const totalQuantity = computed(() => {
  return orderData.value?.subOrders?.reduce((total, sub) =>
    total + (sub.items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0
  ) || 0
})

// 当前选中的优惠券
const selectedCoupon = computed(() => {
  if (!selectedCouponUserRecordId.value) return null
  return couponList.value?.find(c => c.id === selectedCouponUserRecordId.value)
})

// 获取预下单数据
onMounted(async () => {
  const data = sessionStorage.getItem('preOrderData')
  if (data) {
    orderData.value = JSON.parse(data)
    // 初始化选中的优惠券
    if (orderData.value?.couponUserRecordId) {
      selectedCouponUserRecordId.value = orderData.value.couponUserRecordId
    }
    // 获取可用优惠券列表
    try {
      const orderAmount = orderData.value?.goodsAmount || 0
      const res = await getAvailableCoupons(orderAmount)
      if (res?.code === 200) {
        couponList.value = res.data || []
      }
    } catch (err) {
      console.error('获取优惠券列表失败:', err)
    }
    // 获取地址列表
    try {
      const res = await getUserAddressList()
      if (res?.code === 200) {
        addressList.value = res.data || []
      }
    } catch (err) {
      console.error('获取地址列表失败:', err)
    }
  } else {
    ElMessage.warning('订单数据不存在，请重新下单')
    router.push('/home')
  }
})

// 构建shops参数的辅助函数
const buildShopsParams = () => {
  return orderData.value?.subOrders?.map(sub => ({
    shopId: sub.shopId,
    items: sub.items?.map(item => ({
      skuId: item.skuId,
      quantity: item.quantity
    })) || []
  })) || []
}

// 直接选择地址
const selectAddressDirect = async (address) => {
  // 如果已经选中，不做处理
  if (address.id === orderData.value?.userAddressId) return

  try {
    const data = {
      addressId: address.id,
      shops: buildShopsParams()
    }
    // 保持优惠券参数
    if (selectedCouponUserRecordId.value) {
      data.couponUserRecordId = selectedCouponUserRecordId.value
    }

    const res = await checkout(data)
    if (res?.code === 200) {
      orderData.value = res.data
      sessionStorage.setItem('preOrderData', JSON.stringify(res.data))
      ElMessage.success('收货地址已更新')
    } else {
      ElMessage.error(res?.msg || '更新地址失败')
    }
  } catch (err) {
    ElMessage.error('更新地址失败，请重试')
  }
}

// 切换优惠券折叠状态
const toggleCouponExpand = () => {
  couponExpanded.value = !couponExpanded.value
}

// 选择优惠券
const selectCoupon = async (coupon) => {
  if (!coupon.available) return

  // 如果点击的是已选中的优惠券，则取消选择
  const isDeselect = selectedCouponUserRecordId.value === coupon.id

  try {
    const data = {
      shops: buildShopsParams()
    }
    if (!isDeselect) {
      data.couponUserRecordId = coupon.id
    }

    const res = await checkout(data)
    if (res?.code === 200) {
      orderData.value = res.data
      selectedCouponUserRecordId.value = isDeselect ? null : coupon.id
      sessionStorage.setItem('preOrderData', JSON.stringify(res.data))
    } else {
      ElMessage.error(res?.msg || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败，请重试')
  }
}

// 提交订单
const submitLoading = ref(false)

const submitOrderFn = async () => {
  if (!orderData.value?.userAddressId) {
    ElMessage.warning('请选择收货地址')
    return
  }

  submitLoading.value = true

  try {
    // 构建店铺订单列表
    const shops = orderData.value?.subOrders?.map(sub => ({
      shopId: sub.shopId,
      shopRemark: shopRemarks.value[sub.shopId]?.trim() || '',
      items: sub.items?.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity
      })) || []
    })) || []

    const data = {
      source: 1, // 1-立即购买
      addressId: orderData.value.userAddressId,
      paymentType: selectedPayType.value,
      expectedPayAmount: orderData.value.payAmount,
      submitToken: orderData.value.submitToken,
      shops
    }

    // 添加可选参数
    if (selectedCouponUserRecordId.value) {
      data.couponUserRecordId = selectedCouponUserRecordId.value
    }

    const res = await submitOrderApi(data)
    if (res?.code === 200) {
      ElMessage.success('订单提交成功')
      // 清除预下单数据
      sessionStorage.removeItem('preOrderData')
      // 跳转到收银台页面
      router.replace({
        path: '/cashier',
        query: {
          orderSn: res.data.orderSn,
          payAmount: res.data.payAmount,
          payDeadline: res.data.payDeadline,
          payType: res.data.payType
        }
      })
    } else {
      ElMessage.error(res?.msg || '订单提交失败')
    }
  } catch (err) {
    ElMessage.error('订单提交失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

// 打开商品详情页（新标签页）
const openProductDetail = (spuId) => {
  window.open(`/product/${spuId}`, '_blank')
}
</script>

<template>
  <div class="order-confirm">
    <!-- 左侧主要内容区 -->
    <div class="main-content">
      <!-- 收货地址 -->
      <div class="section-card address-section">
        <div class="section-header">
          <h3 class="section-title">收货地址</h3>
          <el-button type="primary" link class="add-address-btn" @click="router.push('/address')">
            <el-icon><Plus /></el-icon>
            新增地址
          </el-button>
        </div>
        <div v-if="addressList.length > 0" class="address-content-wrapper">
          <div class="address-list">
            <div
              v-for="address in displayedAddresses"
              :key="address.id"
              class="address-card"
              :class="{ selected: orderData?.userAddressId === address.id }"
              @click="selectAddressDirect(address)"
            >
              <div class="address-card-content">
                <div class="address-card-header">
                  <span class="address-name">{{ address.receiverName }}</span>
                  <span class="address-phone">{{ address.receiverPhone }}</span>
                  <el-tag v-if="address.isDefault === 1" size="small" type="warning">默认</el-tag>
                </div>
                <div class="address-card-detail">{{ address.province }}{{ address.city }}{{ address.district }}{{ address.detailAddress }}</div>
              </div>
              <div v-if="orderData?.userAddressId === address.id" class="address-card-check">
                <el-icon class="check-icon"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
          <div v-if="hasMoreAddresses" class="address-expand-btn" @click="addressExpanded = !addressExpanded">
            <span>{{ addressExpanded ? '收起地址' : '查看所有地址' }}</span>
            <el-icon class="arrow-icon" :class="{ 'is-expanded': addressExpanded }"><ArrowDown /></el-icon>
          </div>
        </div>
        <div v-else class="no-address-tip">
          <span>暂无收货地址，</span>
          <el-button type="primary" link @click="router.push('/address')">去添加</el-button>
        </div>
      </div>

      <!-- 商品清单 -->
      <div v-for="subOrder in orderData?.subOrders" :key="subOrder.shopId" class="section-card goods-section">
        <!-- 店铺信息 -->
        <div class="shop-header">
          <img :src="subOrder.shopLogo" :alt="subOrder.shopName" class="shop-logo" />
          <span class="shop-name">{{ subOrder.shopName }}</span>
        </div>
        <div class="goods-table">
          <!-- 表头 -->
          <div class="goods-table-header">
            <div class="col-product">商品信息</div>
            <div class="col-price">单价</div>
            <div class="col-quantity">数量</div>
            <div class="col-subtotal">小计</div>
          </div>
          <!-- 商品列表 -->
          <div
            v-for="item in subOrder.items"
            :key="item.skuId"
            class="goods-item-wrapper"
          >
            <div class="goods-row">
              <div class="col-product" @click="openProductDetail(item.spuId)">
                <img :src="item.picUrl" :alt="item.spuName" class="goods-image" />
                <div class="goods-info">
                  <div class="goods-name">{{ item.spuName }}</div>
                  <div class="goods-spec">{{ item.skuName }}</div>
                </div>
              </div>
              <div class="col-price">
                <span class="goods-price">¥{{ item.price }}</span>
              </div>
              <div class="col-quantity">
                <span class="goods-quantity">{{ item.quantity }}</span>
              </div>
              <div class="col-subtotal">
                <span class="goods-subtotal">¥{{ item.totalPrice?.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 店铺小计 -->
        <div class="shop-subtotal">
          <span>店铺小计：¥{{ subOrder.subPayAmount?.toFixed(2) }}</span>
          <span v-if="subOrder.subFreightAmount > 0" class="shop-freight">(含运费¥{{ subOrder.subFreightAmount?.toFixed(2) }})</span>
        </div>

        <!-- 订单备注 -->
        <div class="remark-card">
          <div class="remark-card-title">订单备注</div>
          <el-input
            v-model="shopRemarks[subOrder.shopId]"
            placeholder="选填"
            maxlength="100"
            clearable
            class="remark-item-input"
          />
        </div>
      </div>
    </div>

    <!-- 右侧结算面板 -->
    <div class="settlement-panel">
      <div class="panel-card">
        <h3 class="panel-title">支付方式</h3>
        <div class="pay-options">
          <div
            class="pay-option"
            :class="{ active: selectedPayType === 1 }"
            @click="selectedPayType = 1"
          >
            <img :src="AlipayIcon" class="pay-icon" alt="支付宝" />
            <span class="pay-name">支付宝</span>
            <el-icon v-if="selectedPayType === 1" class="check-icon"><CircleCheckFilled /></el-icon>
          </div>
          <div
            class="pay-option"
            :class="{ active: selectedPayType === 2 }"
            @click="selectedPayType = 2"
          >
            <img :src="WechatPayIcon" class="pay-icon" alt="微信支付" />
            <span class="pay-name">微信支付</span>
            <el-icon v-if="selectedPayType === 2" class="check-icon"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <h3 class="panel-title">费用明细</h3>
        <div class="fee-detail">
          <div class="fee-row">
            <span>商品金额</span>
            <span>¥{{ orderData?.goodsAmount?.toFixed(2) }}</span>
          </div>
          <div class="fee-row">
            <span>运费</span>
            <span>{{ orderData?.freightAmount > 0 ? '¥' + orderData?.freightAmount?.toFixed(2) : '包邮' }}</span>
          </div>
          <div class="fee-row discount coupon-trigger" @click="toggleCouponExpand">
            <span class="coupon-label">
              优惠券
              <el-icon class="arrow-icon" :class="{ expanded: couponExpanded }"><ArrowDown /></el-icon>
            </span>
            <span class="coupon-text">
              <template v-if="selectedCoupon">-¥{{ orderData?.couponAmount?.toFixed(2) }}</template>
              <template v-else>{{ couponList.filter(c => c.available).length }}张可用</template>
            </span>
          </div>
          <!-- 优惠券折叠区域 -->
          <div class="coupon-collapse" :class="{ expanded: couponExpanded }">
            <div class="coupon-list-mini">
              <template v-if="couponList.length > 0">
                <div
                  v-for="coupon in couponList.slice(0, 3)"
                  :key="coupon.id"
                  class="coupon-item-mini"
                  :class="{ disabled: !coupon.available, selected: coupon.available && selectedCouponUserRecordId === coupon.id }"
                  @click="coupon.available && selectCoupon(coupon)"
                >
                  <div class="coupon-left-mini" :class="{ disabled: !coupon.available }">
                    <span class="coupon-amount-mini">¥{{ coupon.reduceAmount }}</span>
                    <span class="coupon-threshold-mini">{{ coupon.thresholdAmount > 0 ? `满${coupon.thresholdAmount}` : '无门槛' }}</span>
                  </div>
                  <div class="coupon-right-mini">
                    <span class="coupon-title-mini">{{ coupon.title }}</span>
                    <span v-if="coupon.available" class="coupon-subtitle-mini">{{ coupon.subTitle }}</span>
                    <span v-else class="coupon-reason-mini">{{ coupon.reason || '不可用' }}</span>
                  </div>
                  <div v-if="coupon.available" class="coupon-check-mini">
                    <el-icon v-if="selectedCouponUserRecordId === coupon.id" class="check-icon-mini"><CircleCheckFilled /></el-icon>
                    <span v-else class="unchecked-circle-mini"></span>
                  </div>
                </div>
              </template>
              <div v-else class="no-coupon-tip">
                暂无优惠券
              </div>
            </div>
          </div>
        </div>
        <div class="fee-total">
          <span>共{{ totalQuantity }}件</span>
          <div class="total-right">
            <span class="total-label">实付：</span>
            <span class="total-price">¥{{ orderData?.payAmount?.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <el-button
          type="primary"
          color="#ff6a00"
          size="large"
          class="submit-btn"
          :loading="submitLoading"
          :disabled="!orderData?.userAddressId"
          @click="submitOrderFn"
        >
          提交订单
        </el-button>
    </div>
  </div>
</template>

<style scoped>
.order-confirm {
  display: flex;
  gap: 24px;
  padding: 24px;
  min-height: 100vh;
  background: #f5f5f5;
}

/* 左侧主要内容区 */
.main-content {
  margin-left: 50px;
  flex: 1;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 地址栏 */
.address-section {
  cursor: default;
}

.add-address-btn {
  color: #333 !important;
}

.add-address-btn:hover {
  color: #000 !important;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.address-card {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  background: #fafafa;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.address-card:hover {
  background: #fff5f0;
  border-color: #ffba8c;
}

.address-card.selected {
  background: #fff5f0;
  border-color: #ff6a00;
}

.address-card-content {
  flex: 1;
  min-width: 0;
}

.address-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.address-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.address-phone {
  font-size: 14px;
  color: #666;
}

.address-card-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.address-card-check {
  flex-shrink: 0;
  margin-left: 8px;
}

.address-card-check .check-icon {
  font-size: 20px;
  color: #ff6a00;
}

.no-address-tip {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.address-expand-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 10px 0 0;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.address-expand-btn:hover {
  color: #666;
}

.address-expand-btn .arrow-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.address-expand-btn .arrow-icon.is-expanded {
  transform: rotate(180deg);
}

/* 商品清单 */
.goods-table {
  width: 100%;
}

/* 店铺头部 */
.shop-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px 8px 0 0;
  margin-bottom: 12px;
}

.shop-logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

.shop-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 店铺小计 */
.shop-subtotal {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: #333;
}

.shop-freight {
  color: #999;
  font-size: 12px;
}

.goods-table-header {
  display: grid;
  grid-template-columns: 1fr 120px 80px 100px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.goods-row {
  display: grid;
  grid-template-columns: 1fr 120px 80px 100px;
  padding: 16px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.goods-row:last-child {
  border-bottom: none;
}

/* 商品项包装器 */
.goods-item-wrapper {
  border-bottom: 1px solid #f0f0f0;
}

.goods-item-wrapper:last-child {
  border-bottom: none;
}

/* 订单备注卡片 */
.remark-card {
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.remark-card-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.remark-item-input {
  width: 100%;
}

.remark-item-input :deep(.el-input__wrapper) {
  background: #fff;
  border-radius: 6px;
  box-shadow: none;
  border: 1px solid #e8e8e8;
}

.remark-item-input :deep(.el-input__wrapper:hover) {
  border-color: #ccc;
}

.remark-item-input :deep(.el-input__wrapper.is-focus) {
  border-color: #ff6a00;
}

.remark-item-input :deep(.el-input__inner) {
  font-size: 14px;
  color: #333;
}

.remark-item-input :deep(.el-input__inner::placeholder) {
  color: #999;
}

.col-product {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.col-product:hover .goods-name {
  color: #ff6a00;
}

.col-price,
.col-quantity,
.col-subtotal {
  text-align: center;
}

.goods-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.goods-info {
  flex: 1;
  min-width: 0;
}

.goods-name {
  font-size: 18px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.goods-spec {
  font-size: 16px;
  color: #999;
}

.goods-price {
  color: #333;
  font-size: 18px;
}

.goods-quantity {
  color: #666;
  font-size: 18px;
}

.goods-subtotal {
  color: #ff6a00;
  font-weight: 600;
  font-size: 18px;
}

/* 右侧结算面板 */
.settlement-panel {
  margin-left: 10px;
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
}

/* 支付方式 */
.pay-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pay-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.pay-option:hover {
  border-color: #ccc;
  background: #fafafa;
}

.pay-option.active {
  border-color: #ff6a00;
  background: #fff7f0;
}

.pay-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.pay-name {
  font-size: 14px;
  color: #333;
  margin-left: 12px;
  font-weight: 500;
}

.check-icon {
  color: #ff6a00;
  font-size: 18px;
  margin-left: auto;
}

/* 费用明细 */
.fee-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.fee-row.discount .coupon-text {
  color: #ff6a00;
  cursor: pointer;
}

/* 优惠券触发器样式 */
.coupon-trigger {
  cursor: pointer;
  user-select: none;
  padding: 6px 0;
  margin: 0 -6px;
  padding-left: 6px;
  padding-right: 6px;
  border-radius: 6px;
  transition: background 0.2s;
}

.coupon-trigger:hover {
  background: #fafafa;
}

.coupon-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coupon-trigger .arrow-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.coupon-trigger .arrow-icon.expanded {
  transform: rotate(180deg);
}

/* 优惠券折叠区域 */
.coupon-collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.coupon-collapse.expanded {
  max-height: 400px;
}

.coupon-list-mini {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coupon-item-mini {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #fed7aa;
  cursor: pointer;
  transition: all 0.2s;
}

.coupon-item-mini:hover {
  box-shadow: 0 2px 8px rgba(255, 106, 0, 0.15);
}

.coupon-item-mini.selected {
  border-color: #ff6a00;
  box-shadow: 0 2px 8px rgba(255, 106, 0, 0.2);
}

.coupon-item-mini.disabled {
  opacity: 0.6;
  cursor: default;
  background: #f5f5f5;
  border-color: #e8e8e8;
}

.coupon-item-mini.disabled:hover {
  box-shadow: none;
}

.coupon-left-mini {
  width: 60px;
  padding: 8px 6px;
  background: linear-gradient(135deg, #ff6a00, #ff8533);
  color: #fff;
  text-align: center;
  flex-shrink: 0;
}

.coupon-left-mini.disabled {
  background: linear-gradient(135deg, #ccc, #ddd);
}

.coupon-amount-mini {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.coupon-threshold-mini {
  display: block;
  font-size: 10px;
  opacity: 0.9;
  margin-top: 2px;
}

.coupon-right-mini {
  flex: 1;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.coupon-title-mini {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon-subtitle-mini {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon-reason-mini {
  font-size: 11px;
  color: #f56c6c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon-check-mini {
  padding: 0 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.check-icon-mini {
  font-size: 20px;
  color: #ff6a00;
}

.unchecked-circle-mini {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 50%;
}

.no-coupon-tip {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 10px 0;
}

.fee-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

.total-right {
  display: flex;
  align-items: center;
}

.total-label {
  color: #666;
}

.total-price {
  font-size: 18px;
  font-weight: 600;
  color: #ff6a00;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

/* 响应式 */
@media (max-width: 900px) {
  .order-confirm {
    flex-direction: column;
    padding: 16px;
  }

  .settlement-panel {
    width: 100%;
  }
}
</style>