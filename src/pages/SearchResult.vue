<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchProduct } from '@/api/product'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.keyword || '').toString())
const categoryId = ref((route.query.categoryId || '').toString())
const categoryName = ref((route.query.categoryName || '').toString())
const minPrice = ref(route.query.minPrice || null)
const maxPrice = ref(route.query.maxPrice || null)
const pageNo = ref(Number(route.query.pageNo) || 1)
const pageSize = ref(12)

const loading = ref(false)
const error = ref('')
const total = ref(0)
const products = ref([])

const normalizedKeyword = computed(() => keyword.value.trim())

const normalizeProducts = (list = []) =>
  list.map((item, idx) => {
    const priceVal = item.price ?? item.salePrice ?? item.promotionPrice
    const rawTitle = item.spuName || item.name || item.title || `精选好物 ${idx + 1}`
    const rawDesc = item.description || item.subtitle || '这个商品暂时没有描述'
    // 移除内联样式，只保留 em 标签，让 CSS 控制高亮颜色
    const cleanTitle = rawTitle.replace(/style\s*=\s*['"][^'"]*['"]/gi, '')
    const cleanDesc = rawDesc.replace(/style\s*=\s*['"][^'"]*['"]/gi, '')
    return {
      id: item.spuId ?? item.id ?? item.productId ?? idx + 1,
      title: cleanTitle,
      description: cleanDesc,
      cover: item.mainImage || item.imageUrl || item.image || item.imgUrl || '',
      price: priceVal === undefined || priceVal === null ? '¥ --' : `¥ ${priceVal}`,
      sales: item.sales ? `销量 ${item.sales}` : '销量 --'
    }
  })

const fetchResults = async () => {
  if (!normalizedKeyword.value && !categoryId.value) {
    products.value = []
    total.value = 0
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await searchProduct(normalizedKeyword.value, categoryId.value, minPrice.value, maxPrice.value, pageNo.value, pageSize.value)
    const data = res?.data || res
    const list = data?.records || data?.list || data?.items || []
    total.value = data?.total ?? (Array.isArray(list) ? list.length : 0)
    products.value = Array.isArray(list) ? normalizeProducts(list) : []
  } catch (err) {
    error.value = err?.message || '搜索失败，请稍后重试'
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (!normalizedKeyword.value && !categoryId.value) {
    ElMessage.warning('请输入要搜索的商品关键词')
    return
  }
  pageNo.value = 1
  const query = { pageNo: pageNo.value }
  if (normalizedKeyword.value) query.keyword = normalizedKeyword.value
  if (categoryId.value) query.categoryId = categoryId.value
  if (categoryName.value) query.categoryName = categoryName.value
  if (minPrice.value) query.minPrice = minPrice.value
  if (maxPrice.value) query.maxPrice = maxPrice.value
  router.push({ path: '/search', query })
}

const handlePageChange = (page) => {
  pageNo.value = page
  const query = { pageNo: pageNo.value }
  if (normalizedKeyword.value) query.keyword = normalizedKeyword.value
  if (categoryId.value) query.categoryId = categoryId.value
  if (categoryName.value) query.categoryName = categoryName.value
  if (minPrice.value) query.minPrice = minPrice.value
  if (maxPrice.value) query.maxPrice = maxPrice.value
  router.push({ path: '/search', query })
}

const goHome = () => router.push('/home')
const goDetail = (id) => {
  if (!id) return
  const url = router.resolve(`/product/${id}`).href
  window.open(url, '_blank')
}

watch(
  () => [route.query.keyword, route.query.categoryId, route.query.categoryName, route.query.minPrice, route.query.maxPrice, route.query.pageNo],
  ([nextKeyword, nextCategoryId, nextCategoryName, nextMinPrice, nextMaxPrice, nextPage]) => {
    keyword.value = (nextKeyword || '').toString()
    categoryId.value = (nextCategoryId || '').toString()
    categoryName.value = (nextCategoryName || '').toString()
    minPrice.value = nextMinPrice || null
    maxPrice.value = nextMaxPrice || null
    pageNo.value = Number(nextPage) || 1
    fetchResults()
  }
)

onMounted(fetchResults)
</script>

<template>
  <div class="search-page">
    <header class="search-header">
      <div class="brand" @click="goHome">
        <div class="brand-mark">Star</div>
        <div>
          <p class="brand-name">Star·Mall</p>
          <p class="brand-tag">灵感搜索</p>
        </div>
      </div>
      <div class="hero-search-box">
        <el-input
          v-model="keyword"
          size="large"
          placeholder="搜一搜你想要的宝贝"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button type="primary" style="background-color: #ff6a00; border-color: #ff6a00; color: #fff;" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </header>

    <section class="result-section">
      <div class="result-meta">
        <p class="meta-sub">共 {{ total }} 件相关商品</p>
      </div>

      <el-skeleton v-if="loading" animated :rows="6" class="result-skeleton" />

      <el-alert
        v-else-if="error"
        :title="error"
        type="error"
        show-icon
        closable
        class="result-alert"
      />

      <el-empty
        v-else-if="!products.length"
        description="没有找到相关商品，换个关键词试试吧"
        class="result-empty"
      />

      <div v-else>
        <el-row :gutter="16">
          <el-col
            v-for="item in products"
            :key="item.id"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="6"
            class="result-col"
          >
            <el-card shadow="hover" class="result-card" @click="goDetail(item.id)">
              <div class="card-cover" :style="{ backgroundImage: `url(${item.cover})` }" />
              <p class="card-title" v-html="item.title"></p>
              <p class="card-desc" v-html="item.description"></p>
              <div class="card-meta">
                <span class="card-price">{{ item.price }}</span>
                <span class="card-sales">{{ item.sales }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div v-if="total > pageSize" class="result-pagination">
          <el-pagination
            background
            layout="prev, pager, next"
            :page-size="pageSize"
            :total="total"
            :current-page="pageNo"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #fff;
  padding: 32px 32px 40px;
  box-sizing: border-box;
}

.search-header {
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
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
  color: #6b7280;
  font-size: 14px;
}

.hero-search-box {
  margin-left: 70px;
  max-width: 750px;
  align-self: center;
  width: 100%;
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

.result-section {
  margin-top: 18px;
  background: #fff;
  border-radius: 14px;
  padding: 20px 18px 28px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
}

.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-left: 20px;
}

.meta-title {
  margin: 0;
  font-weight: 800;
  font-size: 18px;
}

.meta-sub {
  margin: 6px 0 0;
  color: #18181a;
  font-size: 15px;
}

.result-skeleton,
.result-alert,
.result-empty {
  margin-top: 18px;
}

.result-col {
  margin-top: 14px;
}

.result-card {
  border: none;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  height: 100%;
}

.result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.08);
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

.card-title :deep(em) {
  font-style: normal;
  font-size: inherit;
  font-weight: inherit;
  color: #ff6a00;
}

.card-desc {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
  height: 34px;
  overflow: hidden;
}

.card-desc :deep(em) {
  font-style: normal;
  font-size: inherit;
  font-weight: inherit;
  color: #ff6a00;
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

.result-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .search-page {
    padding: 16px;
  }

  .search-header {
    grid-template-columns: 1fr;
  }

  .brand {
    justify-content: center;
  }
}
</style>
