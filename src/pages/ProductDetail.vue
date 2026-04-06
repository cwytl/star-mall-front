<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { getProductById } from '@/api/product'
import { addToCart } from '@/api/cart'
import { checkout } from '@/api/order'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const previewImage = ref('')
const loading = ref(false)
const error = ref('')
const selectedSpecs = ref({})
const quantity = ref(1)
const searchKeyword = ref('')

const selectedSku = computed(() => {
  if (!product.value) return null
  const attrs = product.value.attributes || []
  const allSelected = attrs.every((attr) => selectedSpecs.value[attr.attrName])
  if (!allSelected) return null

  return (
    product.value.skus?.find((sku) =>
      attrs.every((attr) => sku.specs?.[attr.attrName] === selectedSpecs.value[attr.attrName])
    ) || null
  )
})

const displayImage = computed(() => product.value?.mainImage || '')
const displayPrice = computed(() => selectedSku.value?.price ?? '--')
const displayStock = computed(() => selectedSku.value?.stock ?? '--')
const maxQuantity = computed(() =>
  selectedSku.value ? Math.max(selectedSku.value.stock || 0, 1) : 99
)
const isOutOfStock = computed(
  () => selectedSku.value && (selectedSku.value.stock ?? 0) <= 0
)

const displayShopRating = computed(() => {
  const rating = product.value?.shopRating || 0
  const floor = Math.floor(rating)
  const decimal = rating - floor
  // 小数部分 >= 0.5 显示半星，< 0.5 不显示
  return decimal >= 0.5 ? floor + 0.5 : floor
})

const resetSelection = () => {
  selectedSpecs.value = {}
  quantity.value = 1
}

const selectFirstOption = () => {
  if (!product.value) return

  const attrs = product.value.attributes || []
  const newSelection = { ...selectedSpecs.value }

  attrs.forEach((attr) => {
    // 如果已经选中了，跳过
    if (newSelection[attr.attrName]) return

    // 找到第一个有库存的值
    const firstAvailable = attr.values.find((val) => {
      // 检查这个组合是否有对应的 SKU
      return product.value.skus?.some((sku) => {
        // 简单匹配：SKU 的 specs 中该属性值是否匹配
        return sku.specs?.[attr.attrName] === val
      })
    })

    if (firstAvailable) {
      newSelection[attr.attrName] = firstAvailable
    }
  })

  selectedSpecs.value = newSelection
}

const fetchProduct = async (id) => {
  if (!id) return
  loading.value = true
  error.value = ''
  resetSelection()

  // 最小等待时间 200ms
  const minDelay = new Promise(resolve => setTimeout(resolve, 200))

  try {
    // 并行执行：API 请求 + 最小延迟
    const [res] = await Promise.all([
      getProductById(id),
      minDelay
    ])
    product.value = res?.data || res
    previewImage.value = ''
    // 自动选择第一个规格选项
    selectFirstOption()
  } catch (err) {
    error.value = err?.message || '加载商品详情失败，请稍后重试'
    product.value = null
  } finally {
    loading.value = false
  }
}

const isOptionDisabled = (attrName, value) => {
  if (!product.value) return false
  const attrs = product.value.attributes || []
  const candidate = { ...selectedSpecs.value, [attrName]: value }
  return !product.value.skus?.some((sku) =>
    attrs.every((attr) => {
      const sel = candidate[attr.attrName]
      if (!sel) return true
      return sku.specs?.[attr.attrName] === sel
    })
  )
}

const toggleOption = (attrName, value) => {
  const current = selectedSpecs.value[attrName]
  if (current === value) {
    const updated = { ...selectedSpecs.value }
    delete updated[attrName]
    selectedSpecs.value = updated
  } else if (!isOptionDisabled(attrName, value)) {
    selectedSpecs.value = { ...selectedSpecs.value, [attrName]: value }
  }
}

const ensureSelectionComplete = () => {
  const attrs = product.value?.attributes || []
  const missing = attrs.filter((attr) => !selectedSpecs.value[attr.attrName]).map((attr) => attr.attrName)
  if (missing.length) {
    ElMessage.warning(`请选择：${missing.join(' / ')}`)
    return false
  }
  return true
}

const checkLogin = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('您好，请先登录')
    router.push('/login')
    return false
  }
  return true
}

const handleAddToCart = async () => {
  if (!checkLogin()) return
  if (!ensureSelectionComplete()) return
  if (!selectedSku.value) {
    ElMessage.error('所选规格不存在，请重新选择')
    return
  }
  if (isOutOfStock.value) {
    ElMessage.warning('当前 SKU 缺货')
    return
  }

  try {
    await addToCart({
      skuId: selectedSku.value.skuId,
      quantity: quantity.value
    })
    ElMessage.success('已添加到购物车')
    // 重置数量，但保留规格选择
    quantity.value = 1
  } catch (err) {
    ElMessage.error('添加到购物车失败，请重试')
  }
}

const buyNow = async () => {
  if (!checkLogin()) return
  if (!ensureSelectionComplete()) return
  if (!selectedSku.value) {
    ElMessage.error('所选规格不存在，请重新选择')
    return
  }
  if (isOutOfStock.value) {
    ElMessage.warning('当前 SKU 缺货')
    return
  }
  try {
    const res = await checkout({
      shops: [
        {
          shopId: product.value.shopId,
          items: [
            { skuId: selectedSku.value.skuId, quantity: quantity.value }
          ]
        }
      ]
    })
    if (res?.code === 200) {
      // 将预下单数据存储到 sessionStorage，供订单确认页使用
      sessionStorage.setItem('preOrderData', JSON.stringify(res.data))
      router.push('/order-confirm')
    } else {
      ElMessage.error(res?.msg || '预下单失败')
    }
  } catch (err) {
    ElMessage.error('下单失败，请重试')
  }
}

const search = () => {
  if (!searchKeyword.value.trim()) return
  router.push(`/search?keyword=${encodeURIComponent(searchKeyword.value.trim())}`)
}

watch(
  () => selectedSku.value,
  (sku) => {
    // 图片不再随 SKU 切换，统一显示商品主图
    // previewImage.value = sku?.image || ''
  }
)

onMounted(() => fetchProduct(route.params.id))
watch(
  () => route.params.id,
  (id) => fetchProduct(id)
)
</script>

<template>
  <div class="product-detail">
    <!-- 空白骨架屏 -->
    <div v-if="loading" class="skeleton-blank"></div>

    <div v-else-if="error" class="error-box">
      <el-alert type="error" :description="error" show-icon />
    </div>

    <!-- 真实内容 -->
    <Transition name="content-fade">
      <div v-if="product && !loading" class="detail-body">
      <div class="hero-search-box">
        <el-input
          v-model="searchKeyword"
          size="large"
          placeholder="搜一搜你想要的宝贝"
          clearable
          @keyup.enter="search"
        >
          <template #append>
            <el-button type="primary" style="background-color: #ff6a00; border-color: #ff6a00; color: #fff;" @click="search">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="content-row">
        <!-- 店铺信息 -->
        <div class="gallery-wrapper">
          <router-link
            v-if="product.shopName"
            :to="`/shop/${product.shopId}`"
            class="shop-info"
            target="_blank"
          >
            <img class="shop-logo" :src="product.shopLogo" :alt="product.shopName" />
            <div class="shop-meta">
              <span class="shop-name">
                {{ product.shopName }}
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </span>
              <span class="shop-rating">
                <el-rate
                  :model-value="displayShopRating"
                  disabled
                  allow-half
                  :max="5"
                  :colors="['#ff6a00', '#ff6a00', '#ff6a00']"
                  size="small"
                />
                <span class="rating-score">{{ product.shopRating?.toFixed?.(2) || product.shopRating }}</span>
              </span>
            </div>
          </router-link>
          <div class="gallery">
            <div class="main-image" :style="{ backgroundImage: `url(${displayImage})` }" />
            <div class="thumb-bar">
              <div
                class="thumb active"
                :style="{ backgroundImage: `url(${product.mainImage})` }"
              />
            </div>
          </div>
        </div>

        <div class="info">
        <h1 class="title">{{ product.name }}</h1>
        <p class="desc">{{ product.description }}</p>
        <div class="meta">
          <span>分类：{{ product.categoryName }}</span>
        </div>

        <el-card class="price-card" shadow="never">
          <div class="price-row">
            <span class="label">价格</span>
            <span class="price">¥ {{ displayPrice }}</span>
          </div>
          <div class="price-row">
            <span class="label">库存</span>
            <span class="stock">{{ displayStock }}</span>
          </div>
        </el-card>

        <div class="attributes">
          <div v-for="attr in product.attributes" :key="attr.attrName" class="attr-row">
            <div class="attr-name">{{ attr.attrName }}：</div>
            <div class="attr-values">
              <el-button
                v-for="val in attr.values"
                :key="val"
                size="small"
                :type="selectedSpecs?.[attr.attrName] === val ? 'primary' : 'default'"
                :plain="selectedSpecs?.[attr.attrName] !== val"
                :class="{ 'option-disabled': isOptionDisabled(attr.attrName, val) }"
                @click="toggleOption(attr.attrName, val)"
              >
                {{ val }}
              </el-button>
            </div>
          </div>
        </div>

        <div class="attr-row">
          <div class="attr-name">数量：</div>
          <el-input-number v-model="quantity" :min="1" :max="maxQuantity" />
        </div>

        <div class="action-buttons">
          <el-button
            size="large"
            class="btn-cart"
            @click="handleAddToCart"
            :disabled="!selectedSku || isOutOfStock"
          >
            加入购物车
          </el-button>
          <el-button
            size="large"
            class="btn-buy"
            @click="buyNow"
            :disabled="!selectedSku || isOutOfStock"
          >
            立即下单
          </el-button>
        </div>
        </div>
      </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.product-detail {
  padding: 15px 32px 48px 74px;
  background: #f7f9fb;
  min-height: 100vh;
}

.detail-body {
  display: flex;
  flex-direction: column;
  margin-left: 50px;
  gap: 16px;
}

.content-row {
  display: grid;
  grid-template-columns: 520px 750px;
  gap: 28px;
  align-items: stretch;
}

.gallery-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gallery {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.08);
}

.shop-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.08);
  cursor: pointer;
  text-decoration: none;
}

.shop-logo {
  width: 48px;
  height: 48px;
  border-radius: 2px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.shop-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shop-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.shop-name .arrow-icon {
  font-size: 14px;
  color: #9ca3af;
}

.shop-rating {
  display: flex;
  align-items: center;
}

.shop-rating :deep(.el-rate) {
  height: 16px;
}

.shop-rating :deep(.el-rate__icon) {
  font-size: 14px;
  margin-right: 2px;
}

.shop-rating .rating-score {
  font-size: 13px;
  color: #ff6a00;
  font-weight: 500;
  margin-left: 2px;
}

.hero-search-box {
  max-width: 750px;
  margin-left: calc(520px + 28px);
}

.hero-search-box :deep(.el-input-group__append) {
  background-color: #ff6a00;
  border-color: #ff6a00;
  padding: 0;
  box-shadow: none;
}

.hero-search-box :deep(.el-input-group__append .el-button) {
  margin: 0;
}

.main-image {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
}

.thumb-bar {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.18s ease;
}

.thumb:hover {
  transform: translateY(-2px);
}

.thumb.active {
  border-color: #ff6a00;
}

.info {
  background: #fff;
  border-radius: 12px;
  padding: 8px 20px 24px;
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.08);
}

.breadcrumbs {
  margin-bottom: 8px;
}

.title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
}

.desc {
  margin: 0 0 12px;
  font-size: 18px;
  color: #6b7280;
}

.meta {
  display: flex;
  gap: 16px;
  color: #4b5563;
  font-size: 18px;
  margin-bottom: 12px;
}

.price-card {
  background: linear-gradient(135deg, #fff7ed, #fff);
  border: 1px solid #ffe4d5;
  margin-bottom: 16px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.price-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #6b7280;
}

.price {
  font-size: 30px;
  font-weight: 800;
  color: #ef4444;
}

.stock {
  font-weight: 700;
  color: #0ea5e9;
}

.attributes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.attr-row :deep(.el-input-number) {
  width: 110px;
}

.attr-row :deep(.el-input-number .el-input-number__decrease),
.attr-row :deep(.el-input-number .el-input-number__increase) {
  background-color: #fff;
}

.attr-row :deep(.el-input-number .el-input__inner) {
  font-weight: 500;
  color: #000;
}

.attr-name {
  min-width: 70px;
  color: #4b5563;
}

.attr-values {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attr-values :deep(.el-button) {
  padding: 15px 30px;
  font-size: 14px;
  border-radius: 5px;
  background-color: #fff;
  color: #565c67;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.attr-values :deep(.el-button:hover),
.attr-values :deep(.el-button.el-button--primary) {
  background-color: #fff;
  color: #ff6a00;
  border-color: #ff6a00;
}

.option-disabled {
  opacity: 0.5;
  color: #9ca3af !important;
  border-color: #e5e7eb !important;
  background-color: #f9fafb !important;
}

.action-buttons {
  margin-top: 48px;
  display: flex;
  gap: 12px;
}

.action-buttons .el-button {
  min-width: 160px;
  height: 56px;
  font-size: 16px;
}

.action-buttons .btn-cart {
  background-color: #ffc400;
  border-color: #ffc400;
  color: #fff;
}

.action-buttons .btn-cart:hover {
  background-color: #e6af00;
  border-color: #e6af00;
  color: #fff;
}

.action-buttons .btn-buy {
  background-color: #ff6a00;
  border-color: #ff6a00;
  color: #fff;
}

.action-buttons .btn-buy:hover {
  background-color: #e65f00;
  border-color: #e65f00;
  color: #fff;
}

.error-box {
  padding: 18px 24px;
}

/* 空白骨架屏 */
.skeleton-blank {
  min-height: calc(100vh - 80px);
}

/* 内容淡入动画 */
.content-fade-enter-active {
  transition: opacity 0.5s ease;
}

.content-fade-enter-from {
  opacity: 0;
}

@media (max-width: 960px) {
  .content-row {
    grid-template-columns: 1fr;
  }

  .main-image {
    height: 320px;
  }
}
</style>
