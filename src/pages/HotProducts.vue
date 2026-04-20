<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHotProductsToday } from '@/api/product'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const products = ref([])

const normalizeProducts = (list = []) =>
  list.map((item, idx) => ({
    id: item.spuId ?? item.id ?? idx + 1,
    title: item.spuName || item.name || `热门好物 ${idx + 1}`,
    description: item.description || '这个商品暂时没有描述',
    cover: item.mainImage || item.imageUrl || item.image || '',
    price: item.price === undefined || item.price === null ? '¥ --' : `¥ ${item.price}`,
    sales: item.sales ? `销量 ${item.sales}` : '销量 --'
  }))

const fetchHotProducts = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getHotProductsToday()
    const list = res?.data || res || []
    products.value = Array.isArray(list) ? normalizeProducts(list) : []
  } catch (err) {
    error.value = err?.message || '加载热门商品失败，请稍后重试'
    products.value = []
  } finally {
    loading.value = false
  }
}

const goHome = () => router.push('/home')
const goDetail = (id) => {
  if (!id) return
  const url = router.resolve(`/product/${id}`).href
  window.open(url, '_blank')
}

onMounted(fetchHotProducts)
</script>

<template>
  <div class="hot-page">
    <header class="hot-header">
      <div class="brand" @click="goHome">
        <div class="brand-mark">Star</div>
        <div>
          <p class="brand-name">Star·Mall</p>
          <p class="brand-tag">热销榜单</p>
        </div>
      </div>
      <p class="header-desc">今日销量Top · 买手口碑推荐</p>
    </header>

    <section class="hot-section">
      <el-skeleton v-if="loading" animated :rows="6" class="hot-skeleton" />

      <el-alert
        v-else-if="error"
        :title="error"
        type="error"
        show-icon
        closable
        class="hot-alert"
      />

      <el-empty
        v-else-if="!products.length"
        description="暂无热门商品数据"
        class="hot-empty"
      />

      <div v-else>
        <div class="product-grid">
          <el-card
            v-for="(item, idx) in products"
            :key="item.id"
            shadow="hover"
            class="hot-card"
            @click="goDetail(item.id)"
          >
            <div class="card-rank" v-if="idx < 10">
              <span class="rank-badge" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
            </div>
            <div class="card-cover" :style="{ backgroundImage: `url(${item.cover})` }" />
            <p class="card-title">{{ item.title }}</p>
            <p class="card-desc">{{ item.description }}</p>
            <div class="card-meta">
              <span class="card-price">{{ item.price }}</span>
              <span class="card-sales">{{ item.sales }}</span>
            </div>
          </el-card>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hot-page {
  min-height: 100vh;
  background: #fff;
  padding: 32px 32px 40px;
  box-sizing: border-box;
}

.hot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #fff1e6, #ffe6d5);
  border-radius: 14px;
  padding: 16px 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff6a00, #ff9644);
  color: #fff;
  font-weight: 800;
  display: grid;
  place-items: center;
  font-size: 18px;
  box-shadow: 0 10px 24px rgba(255, 106, 0, 0.35);
}

.brand-name {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
}

.brand-tag {
  margin: 2px 0 0;
  color: #ff6a00;
  font-size: 14px;
  font-weight: 600;
}

.header-desc {
  color: #6b7280;
  font-size: 14px;
}

.hot-section {
  margin-top: 18px;
  background: #fff;
  border-radius: 14px;
  padding: 20px 18px 28px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
}

.hot-skeleton,
.hot-alert,
.hot-empty {
  margin-top: 18px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-top: 14px;
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.hot-card {
  border: none;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  height: 100%;
  position: relative;
}

.hot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.08);
}

.card-rank {
  position: absolute;
  top: 8px;
  left: 8px;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f5f5f5;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.rank-badge.top {
  background: linear-gradient(135deg, #ff6a00, #ff9644);
  color: #fff;
}

.card-cover {
  width: 100%;
  padding-top: 72%;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  margin-bottom: 12px;
}

.card-title {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 15px;
  color: #111827;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.card-desc {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
  height: 34px;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #374151;
}

.card-price {
  color: #ff6a00;
  font-weight: 800;
  font-size: 16px;
}

.card-sales {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .hot-page {
    padding: 16px;
  }

  .hot-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>