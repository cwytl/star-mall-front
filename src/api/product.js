// 商品相关 API
import request from './request'

/**
 * 获取商品列表
 * @param {Object} params
 * @param {number} params.pageNo 页码
 * @param {number} params.pageSize 每页数量
 * @returns {Promise<any>} 接口返回的数据
 */
export function getProductList(params = { pageNo: 1, pageSize: 12 }) {
  return request.post('/product/list', params)
}


/**
 * 获取商品详情
 * @param {number} id 商品ID（spuId）
 */
export function getProductById(spuId) {
  return request.get(`/product/${spuId}`)
}

/**
 * 
 * @param {number} id 商品id 
 * @returns {Promise<any>} 接口返回的数据
 */
export function getProductDetail(id) {
  return request.get(`/product/${id}`)
}

/**
 * 根据关键词、类目id搜索商品
 * @param {Object} keyword 关键词
 * @param {Object} categoryId 类目id
 * @param {number} pageNo 页码
 * @param {number} pageSize 每页数量id
 * @returns {Promise<any>} 接口返回的数据
 */
export function searchProduct(keyword = '', categoryId = '',pageNo = 1,pageSize = 12) {
  return request.get('/product/search',{
    params: {keyword,categoryId,pageNo,pageSize  }
    })
}

export default {
  getProductList,
  getProductById,
  searchProduct
}
