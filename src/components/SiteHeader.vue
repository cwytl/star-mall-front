<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserInfo } from '@/api/auth'

const router = useRouter()

const keyword = ref('')
const hotWords = ['爆款羽绒服', '无线耳机', '秋冬上新', '学生党必买', '百亿补贴']

const userInfo = ref(null)
const userLoading = ref(false)
const LOGOUT_MESSAGE_KEY = 'taomall_show_logout_msg'

// 检查是否登录
const checkLogin = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return false
  }
  return true
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

const search = () => {
  if (!keyword.value.trim()) return
  router.push({
    path: '/search',
    query: { keyword: keyword.value.trim() }
  })
}

const goToCart = () => {
  if (!checkLogin()) return
  router.push('/cart')
}

const goToHome = () => {
  router.push('/home')
}

const goToOrder = () => {
  if (!checkLogin()) return
  router.push('/order')
}

const goToUserCoupon = () => {
  if (!checkLogin()) return
  router.push('/user-coupon')
}

onMounted(() => {
  fetchUserInfo()
  if (localStorage.getItem(LOGOUT_MESSAGE_KEY)) {
    ElMessage.success('已退出')
    localStorage.removeItem(LOGOUT_MESSAGE_KEY)
  }
})
</script>

<template>
  <div class="site-header">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="top-nav__left">
        <span class="top-nav__logo" @click="goToHome">Star·Mall</span>
        <span class="top-nav__tag">灵感发现好物</span>
        <span class="top-nav__location">送至：杭州</span>
      </div>
      <div class="top-nav__links">
        <a href="javascript:void(0)" @click="goToHome">商城首页</a>
        <a href="javascript:void(0)" @click="goToCart">购物车</a>
        <a href="javascript:void(0)" @click="goToOrder">我的订单</a>
        <a href="javascript:void(0)" @click="goToUserCoupon">我的卡券包</a>
        <a href="#">智能客服</a>
      </div>
    </header>

    <!-- 主导航栏 -->

  </div>
</template>

<style scoped>
.site-header {
  width: 100%;
}

.top-nav {
  height: 40px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
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
  cursor: pointer;
}

.top-nav__tag {
  color: #ea580c;
  /* color: #1f2937;; */
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
  gap: 36px;
}

.top-nav__links a {
  color: #1f2937;
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
  background: #f5f5f5;
  border-radius: 12px;
  color: #ea580c;
}

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1024px) {
  .main-nav {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .nav-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .top-nav {
    padding: 0 16px;
  }

  .main-nav {
    padding: 20px 16px 12px;
  }

  .logo-area {
    display: none;
  }
}
</style>
