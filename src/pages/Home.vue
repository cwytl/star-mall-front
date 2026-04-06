<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { getProductList, getProductDetail } from '@/api/product'
import { getUserInfo } from '@/api/auth'
import { getCategoryList } from '@/api/category'

const router = useRouter()

const products = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const detailError = ref('')
const userInfo = ref(null)
const userLoading = ref(false)
const LOGOUT_MESSAGE_KEY = 'taomall_show_logout_msg'
const keyword = ref('')

// 导航相关的数据和函数（用于 Home 页面的分类、轮播图等）
const hotWords = ['爆款羽绒服', '无线耳机', '秋冬上新', '学生党必买', '百亿补贴']

const categories = ref([])

const banners = [
  {
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
    title: '焕新你的生活灵感',
    desc: '潮流单品 · 家居美学 · 数码好物 · 你想要的都在这'
  },
  {
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    title: '品质生活从这里开始',
    desc: '精选好物 · 品质保障 · 超值优惠'
  },
  {
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80',
    title: '时尚穿搭新选择',
    desc: '潮流服饰 · 百变风格 · 个性表达'
  },
  {
    image: 'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=1600&q=80',
    title: '发现更多好物',
    desc: '海量商品 · 正品保障 · 极速配送'
  }
]

const promoCards = [
  {
    title: '热销榜单',
    desc: '全站销量Top · 买手口碑推荐',
    tag: '热销',
    bg: 'linear-gradient(135deg, #fff1e6, #ffe6d5)'
  },
  {
    title: '超值直降',
    desc: '今日直降 · 叠券再减 · 数量有限',
    tag: '直降',
    bg: 'linear-gradient(135deg, #f0f7ff, #e3f2ff)'
  },
  {
    title: '会员专享',
    desc: '会员95折 · 积分兑好礼 · 免运费',
    tag: '会员',
    bg: 'linear-gradient(135deg, #e8fffa, #f3fffc)'
  },
  {
    title: '品牌闪购',
    desc: '大牌直降 · 今日限定',
    tag: '闪购',
    bg: 'linear-gradient(135deg, #fff1e6, #ffe3dc)'
  },
  {
    title: '新人礼包',
    desc: '领20元红包 · 专享免邮',
    tag: '新人',
    bg: 'linear-gradient(135deg, #e7f3ff, #f0f7ff)'
  },
  {
    title: '领券中心',
    desc: '领券下单 · 立享优惠',
    tag: '领券',
    bg: 'linear-gradient(135deg, #fef3c7, #fff7e6)'
  },
  {
    title: '生鲜甄选',
    desc: '直采水果海鲜 · 当日达次日达',
    tag: '生鲜',
    bg: 'linear-gradient(135deg, #e8fff3, #f3fff8)'
  },
  {
    title: '旅行返场',
    desc: '行李箱·相机·户外装备限时补贴',
    tag: '出行',
    bg: 'linear-gradient(135deg, #eef2ff, #e3e9ff)'
  }
]

const normalizeProducts = (list = []) =>
  list.map((item, idx) => {
    const priceVal = item.price ?? item.salePrice ?? item.promotionPrice
    return {
      id: item.spuId ?? item.id ?? item.productId ?? idx + 1,
      title: item.spuName || item.name || item.title || `优选好物 ${idx + 1}`,
      price: priceVal === undefined || priceVal === null ? '¥ --' : `¥ ${priceVal}`,
      sales: item.sales ? `销量 ${item.sales}` : '销量 --',
      cover: item.mainImage || item.imageUrl || item.image || item.imgUrl || ''
    }
  })

const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    const list = res?.data || []
    categories.value = Array.isArray(list) ? list : []
  } catch (error) {
    categories.value = []
  }
}

const fetchProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await getProductList({ pageNo: 1, pageSize: 12 })
    const list =
      res?.data?.records ||
      res?.records ||
      res?.data ||
      res?.list ||
      res

    products.value = Array.isArray(list) ? normalizeProducts(list) : []
  } catch (error) {
    errorMessage.value = error?.message || '商品推荐加载失败'
    products.value = []
  } finally {
    isLoading.value = false
  }
}

const fetchUserInfo = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    userInfo.value = null
    return
  }
  userLoading.value = true
  try {
    const res = await getUserInfo()
    const data = res?.data || res
    if (res?.code === 200 && data) {
      userInfo.value = data
    } else {
      userInfo.value = null
    }
  } catch (error) {
    userInfo.value = null
  } finally {
    userLoading.value = false
  }
}

const handlePromoClick = (item) => {
  if (item?.title === '秒杀会场' || item?.tag === '秒杀') {
    router.push('/coupon')
    return
  }
  if (item?.title === '领券中心') {
    const url = router.resolve('/coupon-center').href
    window.open(url, '_blank')
    return
  }
  console.info(`进入模块：${item?.title || '未知卡片'}`)
}

const goToLogin = () => {
  router.push('/login')
}

const goToAddress = () => {
  router.push('/address')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  userInfo.value = null
  localStorage.setItem(LOGOUT_MESSAGE_KEY, '1')
  window.location.reload()
}

const goToDetail = async (id) => {
  if (!id) return
  detailError.value = ''
  try {
    await getProductDetail(id) // 预取并校验商品存在
    const url = router.resolve(`/product/${id}`).href
    window.open(url, '_blank')
  } catch (err) {
    detailError.value = err?.message || '加载商品详情失败，请稍后重试'
  }
}

const search = () => {
  if (!keyword.value.trim()) return
  router.push(`/search?keyword=${encodeURIComponent(keyword.value.trim())}`)
}

const handleCategoryClick = (item) => {
  if (!item?.id) return
  const url = router.resolve({
    path: '/search',
    query: {
      categoryId: item.id,
      categoryName: item.name
    }
  }).href
  window.open(url, '_blank')
}

onMounted(() => {
  fetchCategories()
  fetchProducts()
  fetchUserInfo()

  if (localStorage.getItem(LOGOUT_MESSAGE_KEY)) {
    ElMessage.success('已退出')
    localStorage.removeItem(LOGOUT_MESSAGE_KEY)
  }
})
</script>

<template>
  <div class="home-page">
    <el-container class="hero">
      <el-aside width="220px" class="category-aside">
        <div class="category-title">全部类目</div>
        <ul class="category-list">
          <li v-for="item in categories" :key="item.id" class="category-item" @click="handleCategoryClick(item)">
            <div class="category-name">{{ item.name }}</div>
            <div class="category-sub">{{ item.descStr }}</div>
          </li>
        </ul>
      </el-aside>

      <el-main class="hero-main">
        <div class="search-banner-section">
          <div class="hero-search-box">
            <el-input
              v-model="keyword"
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
          <div class="hero-carousel">
            <el-carousel height="400px" indicator-position="outside" trigger="click" interval="3800">
              <el-carousel-item v-for="banner in banners" :key="banner.title">
                <div class="banner" :style="{ backgroundImage: `url(${banner.image})` }">
                  <div class="banner-overlay">
                    <p class="banner-title">{{ banner.title }}</p>
                    <p class="banner-desc">{{ banner.desc }}</p>
                    <el-button color="#ff6a00" size="large" round>立即逛逛</el-button>
                  </div>
                </div>
              </el-carousel-item>
            </el-carousel>
          </div>
          </div>

        <div class="promo-row">
          <el-card
            v-for="item in promoCards"
            :key="item.title"
            shadow="never"
            class="promo-card"
            :style="{ background: item.bg }"
          >
            <div class="promo-tag">{{ item.tag }}</div>
            <p class="promo-title">{{ item.title }}</p>
            <p class="promo-desc">{{ item.desc }}</p>
            <el-button
              size="small"
              round
              color="#ff6a00"
              plain
              @click="handlePromoClick(item)"
            >
              立即前往
            </el-button>
          </el-card>
        </div>
      </el-main>

      <el-aside width="260px" class="side-panel">
        <el-card shadow="never" class="user-card">
          <el-button
            v-if="userInfo"
            class="logout-btn"
            size="small"
            text
            type="primary"
            @click="handleLogout"
          >
            退出
          </el-button>
          <template v-if="userLoading">
            <div class="user-avatar loading" />
            <p class="user-greeting">加载中...</p>
            <p class="user-tip">正在拉取个人信息</p>
          </template>
          <template v-else-if="userInfo">
            <div class="user-avatar has-image">
              <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="avatar" />
              <span v-else>{{ userInfo.userName?.slice(0, 1) || 'U' }}</span>
            </div>
            <p class="user-greeting">{{ userInfo.userName }}</p>
            <p class="user-address" @click="goToAddress">
              <el-icon><Location /></el-icon>
              <span>收货地址</span>
            </p>
            <p class="user-tip">欢迎回来，看看为你精选的好物</p>
          </template>
          <template v-else>
            <div class="user-avatar">Hi</div>
            <p class="user-greeting">Hi，欢迎来到StarMall</p>
            <p class="user-tip">登录后获取更多专属推荐</p>
            <el-button color="#ff6a00" style="color: #fff;" round block @click="goToLogin">登录 / 注册</el-button>
          </template>
        </el-card>
        <el-card shadow="hover" class="notice-card">
          <p class="notice-title">热点速报</p>
          <ul class="notice-list">
            <li>冬季上新·羽绒服会场直降</li>
            <li>潮电好物·耳机音箱限时秒杀</li>
            <li>品质家居·百亿补贴精选</li>
            <li>校园专享·学生认证领礼包</li>
          </ul>
        </el-card>
      </el-aside>
    </el-container>

    <section class="recommend">
      <div class="section-header">
        <div>
          <p class="section-eyebrow">猜你喜欢</p>
          <h2 class="section-title">为你推荐</h2>
        </div>
        <el-button text color="#ff6a00">查看更多</el-button>
      </div>

      <div v-if="errorMessage" class="recommend-feedback error">{{ errorMessage }}</div>
      <div v-else-if="isLoading" class="recommend-feedback loading">正在加载推荐商品...</div>
      <div v-else-if="products.length === 0" class="recommend-feedback">暂无推荐数据</div>
      <div v-else-if="detailError" class="recommend-feedback error">{{ detailError }}</div>
      <el-row v-else :gutter="16">
        <el-col
          v-for="item in products"
          :key="item.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="6"
          class="product-col"
        >
          <el-card shadow="hover" class="product-card" @click="goToDetail(item.id)">
            <div class="product-thumb" :style="{ backgroundImage: `url(${item.cover})` }" />
            <p class="product-title">{{ item.title }}</p>
            <div class="product-meta">
              <span class="product-price">{{ item.price }}</span>
              <span class="product-sales">{{ item.sales }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <footer class="site-footer">
      <div class="footer-links">
        <a href="#">关于商城</a>
        <a href="#">合作招商</a>
        <a href="#">廉正举报</a>
        <a href="#">隐私政策</a>
        <a href="#">联系我们</a>
      </div>
      <p class="footer-copy">© 2025 StarMall · Inspired by Taobao</p>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  background: #fff;
  min-height: 100vh;
  color: #1f2937;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

.top-nav {
  height: 40px;
  background: #f5f5f5;
  border-bottom: 1px solid #ededed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  font-size: 13px;
  color: #4b5563;
}

.top-nav__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-nav__logo {
  font-weight: 700;
  color: #ff6a00;
  margin-right: 12px;
}

.top-nav__tag {
  color: #ea580c;
  margin-right: 10px;
}

.top-nav__location {
  padding: 2px 8px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ffe2cc;
}

.top-nav__links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.top-nav__links a {
  color: #4b5563;
  text-decoration: none;
}

.top-nav__links a:hover {
  color: #ff6a00;
}

.main-nav {
  display: grid;
  grid-template-columns: 220px 1fr 240px;
  align-items: center;
  gap: 20px;
  padding: 20px 32px 12px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff6a00, #ff9c44);
  color: #fff;
  font-size: 28px;
  font-weight: 800;
  display: grid;
  place-items: center;
  box-shadow: 0 12px 30px rgba(255, 106, 0, 0.35);
}

.logo-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.logo-sub {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.search-box {
  width: 100%;
}

.hot-words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.hot-word {
  font-size: 12px;
  padding: 4px 10px;
  background: #fff6ed;
  border-radius: 12px;
  color: #ea580c;
}

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.hero {
  padding: 50px 32px 10px;
  box-sizing: border-box;
  align-items: stretch;
}

.category-aside {
  background: #fff;
  border-radius: 12px;
  padding: 12px 0;
  margin-left: 10px;
  margin-right: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
}

.category-title {
  font-weight: 700;
  padding: 0 18px 10px;
}

.category-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.category-item {
  padding: 10px 18px;
  border-left: 4px solid transparent;
  transition: all 0.18s ease;
  cursor: pointer;
}

.category-item:hover {
  background: #fff7ee;
  border-left-color: #ff6a00;
}

.category-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f2937;
}

.category-sub {
  font-size: 12px;
  color: #6b7280;
}

.hero-main {
  padding: 0 20px 16px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 560px;
}

.hero-search-box {
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

.hero-search-box :deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.search-banner-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.hero-carousel {
  width: 100%;
  max-width: 900px;
  min-height: 360px;
  overflow: hidden;
  border-radius: 14px;
  box-sizing: border-box;
}

.hero-carousel :deep(.el-carousel) {
  overflow: hidden;
  border-radius: 14px;
  width: 100%;
}

.hero-carousel :deep(.el-carousel__container) {
  overflow: hidden;
  width: 100%;
}

.hero-carousel :deep(.el-carousel__item) {
  overflow: hidden;
  width: 100%;
}

.hero-carousel :deep(.el-carousel__item--card) {
  overflow: hidden;
  width: 100%;
}

.banner {
  height: 400px;
  width: 100%;
  border-radius: 14px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.banner-overlay {
  width: 360px;
  padding: 28px;
  margin-left: 12px;
  border-radius: 14px;
  backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.banner-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 106, 0, 0.9);
  border-radius: 999px;
  font-size: 12px;
  margin-bottom: 8px;
}

.banner-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 800;
}

.banner-desc {
  margin: 0 0 12px;
  color: #e5e7eb;
}

.promo-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.promo-card {
  position: relative;
  overflow: hidden;
  border: none;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
}

.promo-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  color: #ff6a00;
  background: #fff;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid #ffe2cc;
}

.promo-title {
  margin: 0 0 6px;
  font-weight: 800;
  font-size: 18px;
  color: #1f2937;
}

.promo-desc {
  margin: 0 0 10px;
  color: #4b5563;
}

.side-panel {
  padding-left: 16px;
}

.user-card {
  margin-bottom: 12px;
  text-align: center;
  position: relative;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6a00, #ff9c44);
  color: #fff;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
  font-weight: 800;
}

.user-avatar.has-image {
  background: #fff;
  box-shadow: inset 0 0 0 1px #ffe2cc;
  overflow: hidden;
}

.user-avatar.has-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-avatar.loading {
  background: linear-gradient(90deg, #fff2e5, #ffe8d8, #fff2e5);
  animation: shimmer 1.2s infinite;
}

.user-avatar span {
  font-size: 18px;
}

.logout-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}

@keyframes shimmer {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 120px 0;
  }
}

.user-greeting {
  margin: 0;
  font-weight: 700;
}

.user-address {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 8px 0 12px;
  padding: 8px 16px;
  background: #fff5f0;
  border: 1px solid #ffe2cc;
  border-radius: 20px;
  color: #ff6a00;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-address:hover {
  background: #ffeadd;
  border-color: #ffcd9e;
}

.user-address .el-icon {
  font-size: 16px;
}

.user-tip {
  margin: 4px 0 12px;
  color: #6b7280;
}

.notice-card {
  border: none;
  background: #fffaf5;
}

.notice-title {
  margin: 0 0 10px;
  font-weight: 700;
}

.notice-list {
  margin: 0;
  padding-left: 18px;
  color: #4b5563;
  line-height: 1.6;
}

.recommend {
  padding: 12px 32px 48px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-eyebrow {
  margin: 0;
  color: #f97316;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}

.section-title {
  margin: 4px 0 0;
  font-size: 24px;
}

.product-col {
  margin-bottom: 16px;
}

.product-card {
  border: none;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
}

.product-thumb {
  height: 180px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  margin-bottom: 12px;
}

.product-title {
  margin: 0 0 10px;
  font-weight: 600;
  color: #111827;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #6b7280;
}

.product-price {
  color: #ef4444;
  font-weight: 800;
}

.recommend-feedback {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  border: 1px dashed #e2e8f0;
  text-align: center;
}

.recommend-feedback.loading {
  background: #fff8eb;
  color: #b45309;
  border-color: #facc15;
}

.recommend-feedback.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.site-footer {
  border-top: 1px solid #f0f2f5;
  padding: 24px 32px 32px;
  color: #6b7280;
  text-align: center;
  background: #fff;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 8px;
}

.footer-links a {
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
}

.footer-links a:hover {
  color: #ff6a00;
}

.footer-copy {
  margin: 0;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .main-nav {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .nav-actions {
    justify-content: flex-start;
  }

  .hero {
    display: block;
  }

  .category-aside,
  .side-panel {
    display: none;
  }

  .hero-main {
    padding: 0;
  }
}

@media (max-width: 640px) {
  .top-nav {
    padding: 0 16px;
  }

  .banner {
    height: 220px;
  }

  .banner-overlay {
    width: 90%;
    margin: 0 auto;
  }

  .recommend {
    padding: 12px 16px 32px;
  }
}
</style>
