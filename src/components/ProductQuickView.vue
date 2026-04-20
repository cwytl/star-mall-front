<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProductById } from '@/api/product'
import { addToCart } from '@/api/cart'
import { checkout } from '@/api/order'

const props = defineProps({
  spuId: {
    type: [Number, String],
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'added'])

const router = useRouter()

const product = ref(null)
const loading = ref(false)
const error = ref('')
const selectedSpecs = ref({})
const quantity = ref(1)

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

const displayPrice = computed(() => selectedSku.value?.price ?? product.value?.price ?? '--')
const displayStock = computed(() => selectedSku.value?.stock ?? '--')
const maxQuantity = computed(() =>
  selectedSku.value ? Math.max(selectedSku.value.stock || 0, 1) : 99
)
const isOutOfStock = computed(() => selectedSku.value && (selectedSku.value.stock ?? 0) <= 0)

const resetSelection = () => {
  selectedSpecs.value = {}
  quantity.value = 1
}

const selectFirstOption = () => {
  if (!product.value) return

  const attrs = product.value.attributes || []
  const newSelection = { ...selectedSpecs.value }

  attrs.forEach((attr) => {
    if (newSelection[attr.attrName]) return

    const firstAvailable = attr.values.find((val) => {
      return product.value.skus?.some((sku) => {
        return sku.specs?.[attr.attrName] === val
      })
    })

    if (firstAvailable) {
      newSelection[attr.attrName] = firstAvailable
    }
  })

  selectedSpecs.value = newSelection
}

const fetchProduct = async () => {
  if (!props.spuId) return
  loading.value = true
  error.value = ''
  resetSelection()

  try {
    const res = await getProductById(props.spuId)
    product.value = res?.data || res
    selectFirstOption()
  } catch (err) {
    error.value = err?.message || '加载商品详情失败'
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
    quantity.value = 1
    emit('added')
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
          items: [{ skuId: selectedSku.value.skuId, quantity: quantity.value }]
        }
      ]
    })
    if (res?.code === 200) {
      emit('update:visible', false)
      sessionStorage.setItem('preOrderData', JSON.stringify({ ...res.data, source: 1 }))
      router.push('/order-confirm')
    } else {
      ElMessage.error(res?.msg || '预下单失败')
    }
  } catch (err) {
    ElMessage.error('下单失败，请重试')
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.spuId) {
      fetchProduct()
    } else if (!val) {
      resetSelection()
    }
  }
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    width="900px"
    title="商品详情"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="8" animated />
    </div>

    <el-alert v-else-if="error" type="error" :description="error" show-icon />

    <div v-else-if="product" class="quick-view-content">
      <div class="gallery">
        <div class="main-image" :style="{ backgroundImage: `url(${product.mainImage})` }" />
      </div>

      <div class="info">
        <h2 class="title">{{ product.name }}</h2>
        <p class="desc">{{ product.description }}</p>

        <div class="price-section">
          <span class="label">价格：</span>
          <span class="price">¥ {{ displayPrice }}</span>
        </div>
        <div class="stock-section">
          <span class="label">库存：</span>
          <span class="stock">{{ displayStock }}</span>
        </div>

        <div v-if="product.attributes && product.attributes.length" class="attributes">
          <div v-for="attr in product.attributes" :key="attr.attrName" class="attr-row">
            <span class="attr-name">{{ attr.attrName }}：</span>
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
          <span class="attr-name">数量：</span>
          <el-input-number v-model="quantity" :min="1" :max="maxQuantity" />
        </div>

        <div class="actions">
          <el-button size="large" class="btn-cart" @click="handleAddToCart" :disabled="!selectedSku || isOutOfStock">
            加入购物车
          </el-button>
          <el-button size="large" class="btn-buy" @click="buyNow" :disabled="!selectedSku || isOutOfStock">
            立即购买
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.loading-wrapper {
  padding: 20px;
}

.quick-view-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
}

.gallery {
  display: flex;
  flex-direction: column;
}

.main-image {
  width: 100%;
  height: 350px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.price-section,
.stock-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  color: #6b7280;
  font-size: 14px;
}

.price {
  font-size: 24px;
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
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.attr-name {
  min-width: 60px;
  color: #4b5563;
  font-size: 14px;
}

.attr-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attr-values :deep(.el-button) {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 4px;
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

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.actions .el-button {
  min-width: 120px;
  height: 44px;
  font-size: 14px;
}

.btn-cart {
  background-color: #ffc400;
  border-color: #ffc400;
  color: #fff;
}

.btn-cart:hover {
  background-color: #e6af00;
  border-color: #e6af00;
  color: #fff;
}

.btn-buy {
  background-color: #ff6a00;
  border-color: #ff6a00;
  color: #fff;
}

.btn-buy:hover {
  background-color: #e65f00;
  border-color: #e65f00;
  color: #fff;
}
</style>