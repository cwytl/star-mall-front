<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, CircleCheckFilled } from '@element-plus/icons-vue'
import { getCartList, deleteCart, updateCart } from '@/api/cart'
import { getAvailableCoupons } from '@/api/coupon'
import { checkout as checkoutApi } from '@/api/order'

const router = useRouter()

const cartItems = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

// 优惠券折叠状态
const couponExpanded = ref(false)

// 优惠券列表
const couponList = ref([])
const couponLoading = ref(false)

// 选中的优惠券ID
const selectedCouponUserRecordId = ref(null)

// 当前选中的优惠券
const selectedCoupon = computed(() => {
  if (!selectedCouponUserRecordId.value) return null
  return couponList.value?.find(c => c.id === selectedCouponUserRecordId.value)
})

// 切换优惠券折叠状态
const toggleCouponExpand = () => {
  couponExpanded.value = !couponExpanded.value
}

// 选择优惠券
const selectCoupon = (coupon) => {
  if (!coupon.available) return
  // 如果点击的是已选中的优惠券，则取消选择
  if (selectedCouponUserRecordId.value === coupon.id) {
    selectedCouponUserRecordId.value = null
  } else {
    selectedCouponUserRecordId.value = coupon.id
  }
}

// 获取可用优惠券
const fetchAvailableCoupons = async () => {
  if (totalPrice.value <= 0) {
    couponList.value = []
    selectedCouponUserRecordId.value = null
    return
  }
  couponLoading.value = true
  try {
    const res = await getAvailableCoupons(totalPrice.value)
    if (res?.code === 200) {
      couponList.value = res.data || []
      // 如果选中的优惠券不在新列表中或不可用，清空选择
      if (selectedCouponUserRecordId.value) {
        const selectedCoupon = couponList.value.find(c => c.id === selectedCouponUserRecordId.value)
        if (!selectedCoupon || !selectedCoupon.available) {
          selectedCouponUserRecordId.value = null
        }
      }
    }
  } catch (err) {
    console.error('获取优惠券失败:', err)
  } finally {
    couponLoading.value = false
  }
}

const formatSpecs = (specsJson) => {
  if (!specsJson) return ''
  try {
    const specs = typeof specsJson === 'string' ? JSON.parse(specsJson) : specsJson
    return Object.entries(specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ')
  } catch (err) {
    return ''
  }
}

const normalizeCartItems = (list = []) =>
  list.map((item) => ({
    id: item.skuId,
    spuId: item.spuId,
    description: item.title,
    spec: formatSpecs(item.specJson),
    price: item.price,
    originPrice: item.price,
    quantity: item.quantity,
    image: item.image,
    checked: item.checked === 1 || item.checked === true,
    shopId: item.shopId,
    shopName: item.shopName,
    createTime: item.createTime
  }))

const groupedCartItems = computed(() => {
  const groups = {}
  cartItems.value.forEach((item) => {
    const shopId = item.shopId || 0
    if (!groups[shopId]) {
      groups[shopId] = {
        shopId,
        shopName: item.shopName || '未知店铺',
        items: []
      }
    }
    groups[shopId].items.push(item)
  })

  // 店铺内部按 createTime 降序排序（最新在前）
  Object.values(groups).forEach(group => {
    group.items.sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : 0
      const timeB = b.createTime ? new Date(b.createTime).getTime() : 0
      return timeB - timeA
    })
    // 记录店铺最新商品的 createTime
    group.latestCreateTime = group.items[0]?.createTime || ''
  })

  // 店铺按最新商品的 createTime 降序排序
  return Object.values(groups).sort((a, b) => {
    const timeA = a.latestCreateTime ? new Date(a.latestCreateTime).getTime() : 0
    const timeB = b.latestCreateTime ? new Date(b.latestCreateTime).getTime() : 0
    return timeB - timeA
  })
})

const isShopAllChecked = (shopId) => {
  const group = groupedCartItems.value.find(g => g.shopId === shopId)
  if (!group || group.items.length === 0) return false
  return group.items.every(item => item.checked)
}

const toggleShopCheck = async (shopId, checked) => {
  const group = groupedCartItems.value.find(g => g.shopId === shopId)
  if (!group) return
  for (const item of group.items) {
    item.checked = checked
    try {
      await updateCart({
        skuId: item.id,
        quantity: item.quantity,
        checked: checked ? 1 : 0
      })
    } catch (err) {
      ElMessage.error('更新失败，请重试')
    }
  }
}

const fetchCartItems = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await getCartList()
    const list = res?.data ?? res ?? []
    cartItems.value = Array.isArray(list) ? normalizeCartItems(list) : []
  } catch (err) {
    errorMessage.value = err?.message || '获取购物车失败'
    cartItems.value = []
  } finally {
    isLoading.value = false
  }
}

const recommended = ref([
  {
    id: 'rec-1',
    title: '云朵记忆棉枕 护颈助眠',
    price: 129,
    originPrice: 169,
    tag: '凑单爆款',
    cover:
      'https://images.unsplash.com/photo-1582719478145-b04f0b95b553?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'rec-2',
    title: '北欧风双面羊毛呢大衣',
    price: 458,
    originPrice: 699,
    tag: '双12精选',
    cover:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'rec-3',
    title: '蓝牙降噪耳机 主动降噪 续航35h',
    price: 299,
    originPrice: 399,
    tag: '人气爆款',
    cover:
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'rec-4',
    title: '高硼硅耐热玻璃水杯 700ml',
    price: 39.9,
    originPrice: 59,
    tag: '热销',
    cover:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80'
  }
])

const allChecked = computed({
  get() {
    if (!cartItems.value.length) return false
    return cartItems.value.every((item) => item.checked)
  },
  async set(val) {
    for (const item of cartItems.value) {
      item.checked = val
      try {
        await updateCart({
          skuId: item.id,
          quantity: item.quantity,
          checked: val ? 1 : 0
        })
      } catch (err) {
        ElMessage.error('更新失败，请重试')
      }
    }
  }
})

const selectedQuantity = computed(() =>
  cartItems.value.reduce((sum, item) => sum + (item.checked ? item.quantity : 0), 0)
)

const originTotal = computed(() =>
  cartItems.value.reduce(
    (sum, item) => sum + (item.checked ? item.originPrice * item.quantity : 0),
    0
  )
)

const totalPrice = computed(() =>
  cartItems.value.reduce(
    (sum, item) => sum + (item.checked ? item.price * item.quantity : 0),
    0
  )
)

// 优惠券优惠金额
const couponDiscount = computed(() => {
  if (!selectedCoupon.value) return 0
  return selectedCoupon.value.reduceAmount || 0
})

// 最终应付金额
const finalPayAmount = computed(() => {
  const amount = totalPrice.value - couponDiscount.value
  return amount > 0 ? amount : 0
})

const totalSaved = computed(() => {
  const saved = originTotal.value - totalPrice.value
  return saved > 0 ? saved : 0
})

const shippingHint = computed(() => {
  if (totalPrice.value >= 199) return '包邮'
  if (totalPrice.value >= 88) return '已满88元包邮，差价可享跨店满减'
  const diff = (88 - totalPrice.value).toFixed(1)
  return `凑单满88元可包邮，还差 ¥${diff}`
})

// 监听选中商品总金额变化，重新获取可用优惠券
watch(totalPrice, () => {
  fetchAvailableCoupons()
})

const changeQty = async (item, delta) => {
  const next = item.quantity + delta
  if (next < 1) return

  item.quantity = next
  await updateCartItem(item, next)
}

const removeItem = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      lockScroll: false
    })

    await deleteCart(item.id)
    cartItems.value = cartItems.value.filter((i) => i.id !== item.id)
    ElMessage.success('商品已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试')
    }
  }
}

const updateCartItem = async (item, quantity) => {
  try {
    await updateCart({
      skuId: item.id,
      quantity,
      checked: item.checked ? 1 : 0
    })
  } catch (err) {
    ElMessage.error('更新失败，请重试')
    // 恢复数量
    const res = await getCartList()
    const list = res?.data ?? res ?? []
    cartItems.value = Array.isArray(list) ? normalizeCartItems(list) : []
  }
}

const onCheckboxChange = async (item) => {
  try {
    await updateCart({
      skuId: item.id,
      quantity: item.quantity,
      checked: item.checked ? 1 : 0
    })
  } catch (err) {
    ElMessage.error('更新失败，请重试')
  }
}

const onQtyBlur = async (item) => {
  if (item.quantity < 1) {
    item.quantity = 1
  }
  await updateCartItem(item, item.quantity)
}

onMounted(() => {
  fetchCartItems()
})

const goToProductDetail = (item) => {
  const url = router.resolve(`/product/${item.spuId}`).href
  window.open(url, '_blank')
}

const checkout = async () => {
  if (selectedQuantity.value === 0) {
    ElMessage.warning('请先选择商品')
    return
  }

  // 构建 shops 参数
  const shops = []
  groupedCartItems.value.forEach(group => {
    const checkedItems = group.items.filter(item => item.checked)
    if (checkedItems.length > 0) {
      shops.push({
        shopId: group.shopId,
        items: checkedItems.map(item => ({
          skuId: item.id,
          quantity: item.quantity
        }))
      })
    }
  })

  try {
    const data = { shops }
    // 添加优惠券参数
    if (selectedCouponUserRecordId.value) {
      data.couponUserRecordId = selectedCouponUserRecordId.value
    }

    const res = await checkoutApi(data)
    if (res?.code === 200) {
      // 存储预下单数据
      sessionStorage.setItem('preOrderData', JSON.stringify(res.data))
      // 跳转到订单确认页
      router.push('/order-confirm')
    } else {
      ElMessage.error(res?.msg || '预下单失败')
    }
  } catch (err) {
    console.error('预下单失败:', err)
    ElMessage.error('预下单失败，请重试')
  }
}
</script>

<template>
  <div class="cart-page">
    <div class="cart-layout">
      <div class="cart-main">
        <header class="cart-hero">
          <h1 class="hero-title">购物车</h1>
        </header>

        <section class="cart-toolbar">
          <div class="select-all">
            <el-checkbox v-model="allChecked" size="large">全选</el-checkbox>
            <span class="toolbar-tip">已选 {{ selectedQuantity }} 件</span>
          </div>
          <div class="toolbar-actions">
            <span class="toolbar-promo">跨店满减 · 优惠会自动叠加</span>
            <el-tag type="danger" effect="plain" size="small">限时特惠</el-tag>
            <el-tag type="warning" effect="plain" size="small">分期免息</el-tag>
            <el-tag type="success" effect="plain" size="small">极速退款</el-tag>
          </div>
        </section>

        <div class="cart-list">
          <div v-if="errorMessage" class="cart-feedback error">{{ errorMessage }}</div>
          <div v-else-if="isLoading" class="cart-feedback loading">正在获取购物车...</div>
          <div v-else-if="cartItems.length === 0" class="cart-feedback">购物车空空如也</div>
          <div v-else class="shop-card list-card">
            <div class="cart-header-row">
              <span class="col-check">选择</span>
              <span class="col-product">商品信息</span>
              <span class="col-price">单价</span>
              <span class="col-qty">数量</span>
              <span class="col-subtotal">小计</span>
              <span class="col-actions">操作</span>
            </div>

            <template v-for="(group, groupIndex) in groupedCartItems" :key="group.shopId">
              <div v-if="groupIndex > 0" class="shop-divider"></div>
              <div class="shop-name-row">
                <div class="col-check">
                  <el-checkbox
                    :model-value="isShopAllChecked(group.shopId)"
                    size="large"
                    @change="(val) => toggleShopCheck(group.shopId, val)"
                  />
                </div>
                <div class="col-product shop-name">{{ group.shopName }}</div>
              </div>
              <div v-for="item in group.items" :key="item.id" class="cart-item">
                <div class="col-check">
                  <el-checkbox v-model="item.checked" size="large" @change="onCheckboxChange(item)" />
                </div>
                <div class="col-product product-clickable" @click="goToProductDetail(item)">
                  <div class="product-thumb" :style="{ backgroundImage: `url(${item.image})` }" />
                  <div class="product-info">
                    <p class="product-title">{{ item.description }}</p>
                    <p class="product-spec">{{ item.spec || '无可选规格' }}</p>
                  </div>
                </div>
                <div class="col-price">
                  <p class="price-now">¥ {{ item.price.toFixed(2) }}</p>
                </div>
                <div class="col-qty">
                  <div class="qty-control">
                    <button @click="changeQty(item, -1)">-</button>
                    <input v-model.number="item.quantity" type="number" min="1" @blur="onQtyBlur(item)" />
                    <button @click="changeQty(item, 1)">+</button>
                  </div>
                </div>
                <div class="col-subtotal">
                  <p class="subtotal">¥ {{ (item.price * item.quantity).toFixed(2) }}</p>
                </div>
                <div class="col-actions">
                  <el-button text size="small" type="primary">移入收藏</el-button>
                  <el-button text size="small" type="danger" @click="removeItem(item)">
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </div>
        </div>
    </div> <!-- cart-main -->

    <aside class="checkout-panel">
      <div class="panel-card">
          <div class="panel-row">
            <span class="label">已选</span>
            <span class="value accent">{{ selectedQuantity }} 件</span>
          </div>
          <div class="panel-row">
            <span class="label">商品总额</span>
            <span class="value">¥ {{ originTotal.toFixed(2) }}</span>
          </div>
          <div class="panel-row coupon-trigger" @click="toggleCouponExpand">
            <span class="label">
              优惠券
              <el-icon class="arrow-icon" :class="{ expanded: couponExpanded }"><ArrowDown /></el-icon>
            </span>
            <span class="value highlight">
              <template v-if="selectedCoupon">-¥{{ selectedCoupon.reduceAmount }}</template>
              <template v-else>{{ couponList.filter(c => c.available).length }}张可用</template>
            </span>
          </div>
          <!-- 优惠券折叠区域 -->
          <div class="coupon-collapse" :class="{ expanded: couponExpanded }">
            <div class="coupon-list" v-loading="couponLoading">
              <template v-if="couponList.length > 0">
                <div
                  v-for="coupon in couponList"
                  :key="coupon.id"
                  class="coupon-item"
                  :class="{ disabled: !coupon.available, selected: coupon.available && selectedCouponUserRecordId === coupon.id }"
                  @click="selectCoupon(coupon)"
                >
                  <div class="coupon-left" :class="{ disabled: !coupon.available }">
                    <span class="coupon-amount">¥{{ coupon.reduceAmount }}</span>
                    <span class="coupon-threshold">{{ coupon.thresholdAmount > 0 ? `满${coupon.thresholdAmount}` : '无门槛' }}</span>
                  </div>
                  <div class="coupon-right">
                    <span class="coupon-title">{{ coupon.title }}</span>
                    <span v-if="coupon.available" class="coupon-type">{{ coupon.subTitle }}</span>
                    <span v-else class="coupon-reason">{{ coupon.reason || '不可用' }}</span>
                  </div>
                  <div v-if="coupon.available" class="coupon-check">
                    <el-icon v-if="selectedCouponUserRecordId === coupon.id" class="check-icon"><CircleCheckFilled /></el-icon>
                    <span v-else class="unchecked-circle"></span>
                  </div>
                </div>
              </template>
              <div v-else class="no-coupon-tip">暂无可用优惠券</div>
            </div>
          </div>
          <div class="panel-divider" />
          <div class="panel-row total">
            <span class="label">应付金额</span>
            <span class="value total-price">¥ {{ finalPayAmount.toFixed(2) }}</span>
          </div>
          <p class="shipping-hint">{{ shippingHint }}</p>
          <el-button
            type="primary"
            color="#ff6a00"
            size="large"
            round
            class="checkout-btn"
            @click="checkout"
          >
            结算
          </el-button>
        </div>

        <div class="panel-card promo-card">
          <p class="panel-title">凑单必买</p>
          <ul class="promo-list">
            <li>跨店满299减30，超值叠加津贴</li>
            <li>会员享受专属券包与包邮特权</li>
            <li>部分商品支持 3/6 期免息</li>
          </ul>
          <el-button size="small" plain color="#ff6a00" round>去领券</el-button>
        </div>
      </aside>
    </div>

    <section class="recommend-section">
      <div class="section-head">
        <div>
          <p class="section-eyebrow">猜你喜欢</p>
          <h3 class="section-title">凑单精选</h3>
        </div>
        <el-button text color="#ff6a00">换一批</el-button>
      </div>
      <div class="rec-grid">
        <el-card
          v-for="item in recommended"
          :key="item.id"
          shadow="hover"
          class="rec-card"
        >
          <div class="rec-cover" :style="{ backgroundImage: `url(${item.cover})` }" />
          <div class="rec-info">
            <el-tag size="small" type="warning" effect="plain">{{ item.tag }}</el-tag>
            <p class="rec-title">{{ item.title }}</p>
            <div class="rec-price">
              <span class="now">¥ {{ item.price.toFixed(2) }}</span>
              <span class="origin">¥ {{ item.originPrice.toFixed(2) }}</span>
            </div>
            <el-button size="small" color="#ff6a00" plain round>加入购物车</el-button>
          </div>
        </el-card>
      </div>
    </section>
  </div>

</template>

<style scoped>
.cart-page {
  background: #fff;
  min-height: 100vh;
  padding: 50px 26px 48px;
  color: #1f2937;
}

.cart-layout {
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 20px;
  align-items: flex-start;
}

.cart-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-hero {
  border-radius: 16px;
  padding: 5px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.hero-eyebrow {
  margin: 0;
  color: #f97316;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 400;
  font-size: 12px;
}

.hero-title {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
  color:#ff5000;
}

.hero-steps {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #374151;
}

.step.active .step-index {
  background: linear-gradient(135deg, #ff6a00, #ff9c44);
  color: #fff;
  box-shadow: 0 10px 24px rgba(255, 106, 0, 0.25);
}

.step.active .step-text {
  color: #111827;
  font-weight: 700;
}

.step-divider {
  width: 32px;
  height: 1px;
  background: #e5e7eb;
}

.cart-toolbar {
  margin-top: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-tip {
  color: #6b7280;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f97316;
  font-weight: 600;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-feedback {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  border: 1px dashed #e2e8f0;
  text-align: center;
}

.cart-feedback.loading {
  background: #fff8eb;
  color: #b45309;
  border-color: #facc15;
}

.cart-feedback.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.shop-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.shop-divider {
  height: 0.5px;
  background: #e5e7eb;
  margin: 6px 
}

.shop-name-row {
  display: grid;
  grid-template-columns: 70px 2.2fr 1fr 0.8fr 1fr 120px;
  padding: 5px 18px;
  background: #fff;
}

.shop-name-row .shop-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
}

.cart-header-row {
  display: grid;
  grid-template-columns: 70px 2.2fr 1fr 0.8fr 1fr 120px;
  padding: 10px 18px;
  color: #6b7280;
  font-size: 13px;
  border-bottom: 1px solid #f3f4f6;
}

.cart-item {
  display: grid;
  grid-template-columns: 70px 2.2fr 1fr 0.8fr 1fr 120px;
  align-items: center;
  padding: 14px 18px;
  gap: 10px;
}

.col-product {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: center;
}

.product-clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  padding: 4px;
  margin: -4px;
}

.product-clickable:hover {
  background-color: #f9fafb;
}

.product-clickable:hover .product-title {
  color: #ff5000;
}

.product-thumb {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px #f3f4f6;
}

.product-info {
  min-width: 0;
}

.product-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #111827;
}

.product-spec {
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 13px;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.col-price,
.col-subtotal {
  text-align: center;
}

.price-now {
  margin: 0;
  color: #ef4444;
  font-weight: 800;
}

.price-origin {
  margin: 2px 0 0;
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 12px;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.qty-control button {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8fafc;
  cursor: pointer;
  font-size: 16px;
}

.qty-control input {
  width: 36px;
  height: 32px;
  border: none;
  text-align: center;
  outline: none;
  padding: 0;
  line-height: 32px;
  box-sizing: border-box;
}

/* 移除 number 输入框的 spinner */
.qty-control input::-webkit-outer-spin-button,
.qty-control input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-control input[type='number'] {
  -moz-appearance: textfield;
}

.subtotal {
  margin: 0;
  font-weight: 800;
  color: #ef4444;
}

.save {
  margin: 2px 0 0;
  color: #10b981;
  font-size: 12px;
}

.col-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.checkout-panel {
  position: sticky;
  top: 50px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-card {
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.05);
}

.panel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-row.total {
  margin-bottom: 6px;
}

.label {
  color: #6b7280;
}

.value {
  font-weight: 700;
  color: #111827;
}

.value.accent {
  color: #f97316;
}

.value.highlight {
  color: #10b981;
}

/* 优惠券触发器样式 */
.coupon-trigger {
  cursor: pointer;
  user-select: none;
}

.coupon-trigger:hover {
  background: #f9fafb;
  border-radius: 6px;
}

.coupon-trigger .label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coupon-trigger .arrow-icon {
  font-size: 14px;
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
  max-height: 300px;
}

.coupon-list {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coupon-item {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #fed7aa;
}

.coupon-left {
  width: 80px;
  padding: 10px 8px;
  background: linear-gradient(135deg, #ff6a00, #ff8533);
  color: #fff;
  text-align: center;
  flex-shrink: 0;
}

.coupon-amount {
  display: block;
  font-size: 18px;
  font-weight: 700;
}

.coupon-threshold {
  display: block;
  font-size: 11px;
  opacity: 0.9;
  margin-top: 2px;
}

.coupon-right {
  flex: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coupon-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.coupon-type {
  font-size: 12px;
  color: #ff6a00;
}

.coupon-reason {
  font-size: 12px;
  color: #999;
}

.coupon-item.disabled {
  opacity: 0.6;
  background: #f5f5f5;
  border-color: #e8e8e8;
  cursor: default;
}

.coupon-left.disabled {
  background: linear-gradient(135deg, #ccc, #ddd);
}

.coupon-item:not(.disabled) {
  cursor: pointer;
}

.coupon-item:not(.disabled):hover {
  box-shadow: 0 2px 8px rgba(255, 106, 0, 0.15);
}

.coupon-item.selected {
  border-color: #ff6a00;
  box-shadow: 0 2px 8px rgba(255, 106, 0, 0.2);
}

.coupon-check {
  padding: 0 10px;
  display: flex;
  align-items: center;
}

.check-icon {
  font-size: 20px;
  color: #ff6a00;
}

.unchecked-circle {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 50%;
}

.no-coupon-tip {
  font-size: 13px;
  color: #999;
  text-align: center;
  padding: 16px 0;
}

.total-price {
  color: #ef4444;
  font-size: 22px;
}

.panel-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 6px 0 10px;
}

.shipping-hint {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 13px;
}

.checkout-btn {
  width: 100%;
  height: 40px;
  font-size: 23px;
  font-weight: 600;
  border-radius: 14px;
  color: #fff;
}

.promo-card {
  background: linear-gradient(135deg, #fff7ed, #fff);
}

.panel-title {
  margin: 0 0 10px;
  font-weight: 700;
}

.promo-list {
  margin: 0 0 12px;
  padding-left: 16px;
  color: #6b7280;
  line-height: 1.6;
}

.recommend-section {
  margin-top: 20px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-eyebrow {
  margin: 0;
  color: #f97316;
  letter-spacing: 0.06em;
  font-size: 12px;
}

.section-title {
  margin: 4px 0 0;
}

.rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.rec-card {
  border: none;
}

.rec-cover {
  height: 160px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  margin-bottom: 10px;
}

.rec-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rec-title {
  margin: 0;
  font-weight: 700;
  color: #111827;
}

.rec-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rec-price .now {
  color: #ef4444;
  font-weight: 800;
}

.rec-price .origin {
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .checkout-panel {
    position: static;
  }
}

@media (max-width: 860px) {
  .cart-header-row {
    display: none;
  }

  .shop-name-row {
    grid-template-columns: 1fr;
    padding: 10px 14px;
  }

  .cart-item {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    align-items: flex-start;
  }

  .col-check {
    order: 1;
  }

  .col-product {
    order: 2;
  }

  .col-price {
    order: 3;
  }

  .col-qty {
    order: 4;
  }

  .col-subtotal {
    order: 5;
  }

  .col-actions {
    order: 6;
  }
}
</style>
