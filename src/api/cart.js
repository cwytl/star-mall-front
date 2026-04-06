// 购物车API
import request from './request'

/**
 * 获取购物车列表
 * @returns {Promose<any>} 接口返回的数据
 */
export function getCartList() {
    return request.get('/cart/list')
}

/**
 * 添加商品到购物车
 * @param {number} skuId 商品skuId
 * @param {number} quantity 商品数量
 * @returns {Promose<any>} 接口返回的数据
 */
export function addToCart(params = {skuId,quantity}) {
    return request.post('/cart/add',params)
}


/**
 * 删除购物车
 * @param {number} skuId 商品skuId
 * @returns {Promose<any>} 接口返回的数据
 */
export function deleteCart(skuId) {
    return request.delete(`/cart/delete/${skuId}`)
}


/**
 * 修改购物车
 * @param {number} skuId 商品skuId
 * @param {number} quantity 商品数量
 * @param {number} checked 商品选中状态
 * @returns {Promose<any>} 接口返回的数据
 */
export function updateCart(params = {skuId,quantity,checked}) {
    return request.put('/cart/update',params)
}

export default{
    getCartList,
    addToCart,
    deleteCart,
    updateCart
}
