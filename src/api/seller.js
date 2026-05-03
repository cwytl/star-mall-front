// 商家端 API
import service from './request'

// 商家登录
export function sellerLogin(data) {
  return service.post('/seller/login', data)
}

// 获取商家信息
export function getSellerInfo() {
  return service.get('/seller/info')
}

// 商家登出
export function sellerLogout() {
  return service.post('/seller/logout')
}

// ===== 商品管理 =====

// 获取商品列表
export function getSellerProducts(params) {
  return service.get('/seller/products', { params })
}

// 获取商品详情
export function getSellerProductDetail(id) {
  return service.get(`/seller/products/${id}`)
}

// 创建商品
export function createSellerProduct(data) {
  return service.post('/seller/products', data)
}

// 更新商品
export function updateSellerProduct(id, data) {
  return service.put(`/seller/products/${id}`, data)
}

// 上架/下架商品
export function toggleProductStatus(id, status) {
  return service.put(`/seller/products/${id}/status`, { status })
}

// 删除商品
export function deleteSellerProduct(id) {
  return service.delete(`/seller/products/${id}`)
}

// ===== 订单管理 =====

// 获取订单列表
export function getSellerOrders(params) {
  return service.get('/seller/orders', { params })
}

// 获取订单详情
export function getSellerOrderDetail(orderSn) {
  return service.get(`/seller/orders/${orderSn}`)
}

// 发货
export function shipOrder(orderSn, data) {
  return service.post(`/seller/orders/${orderSn}/ship`, data)
}

// 更新订单状态
export function updateOrderStatus(orderSn, status) {
  return service.put(`/seller/orders/${orderSn}/status`, { status })
}

// ===== 店铺设置 =====

// 获取店铺信息
export function getShopInfo() {
  return service.get('/seller/shop')
}

// 更新店铺信息
export function updateShopInfo(data) {
  return service.put('/seller/shop', data)
}

// ===== 数据统计 =====

// 获取Dashboard数据
export function getDashboardStats() {
  return service.get('/seller/dashboard')
}