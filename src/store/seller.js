// 商家登录状态
import { ref } from 'vue'
import { getSellerInfo, sellerLogout as logoutApi } from '@/api/seller'

export const sellerInfo = ref(null)
export const sellerLoggedIn = ref(false)

// 检查商家登录状态
export function checkSellerAuth() {
  const token = localStorage.getItem('seller_token')
  return !!token
}

// 获取商家信息
export async function fetchSellerInfo() {
  const token = localStorage.getItem('seller_token')
  if (!token) {
    sellerInfo.value = null
    sellerLoggedIn.value = false
    return
  }

  try {
    const res = await getSellerInfo()
    if (res?.code === 200) {
      sellerInfo.value = res.data
      sellerLoggedIn.value = true
    } else {
      sellerInfo.value = null
      sellerLoggedIn.value = false
    }
  } catch (error) {
    sellerInfo.value = null
    sellerLoggedIn.value = false
  }
}

// 设置商家登录
export function setSellerLogin(token, info = null) {
  localStorage.setItem('seller_token', token)
  sellerLoggedIn.value = true
  if (info) {
    sellerInfo.value = info
  }
}

// 商家登出
export async function sellerLogout() {
  try {
    await logoutApi()
  } catch (error) {
    console.error('Logout API failed:', error)
  }
  localStorage.removeItem('seller_token')
  sellerInfo.value = null
  sellerLoggedIn.value = false
}

export function useSellerStore() {
  return {
    sellerInfo,
    sellerLoggedIn,
    checkSellerAuth,
    fetchSellerInfo,
    setSellerLogin,
    sellerLogout
  }
}