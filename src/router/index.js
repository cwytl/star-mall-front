import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue')
  },
  {
    path: '/search',
    name: 'SearchResult',
    component: () => import('@/pages/SearchResult.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/pages/Cart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('@/pages/Order.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order/detail/:orderSn',
    name: 'ParentOrderDetail',
    component: () => import('@/pages/ParentOrderDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order/sub/:subOrderSn',
    name: 'SubOrderDetail',
    component: () => import('@/pages/SubOrderDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/pages/ProductDetail.vue'),
    props: true
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/test/Test.vue'),
    props: true
  },
  {
    path: '/order-confirm',
    name: 'OrderConfirm',
    component: () => import('@/pages/OrderConfirm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/address',
    name: 'Address',
    component: () => import('@/pages/Address.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cashier',
    name: 'Cashier',
    component: () => import('@/pages/Cashier.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order/success',
    name: 'OrderSuccess',
    component: () => import('@/pages/OrderSuccess.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/coupon-center',
    name: 'CouponCenter',
    component: () => import('@/pages/CouponCenter.vue')
  },
  {
    path: '/user-coupon',
    name: 'UserCoupon',
    component: () => import('@/pages/UserCoupon.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shop/:id',
    name: 'Shop',
    component: () => import('@/pages/Shop.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录！')
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router
