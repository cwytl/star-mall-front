// 类目相关 API
import request from './request'

/**
 * 获取分类列表
 * @returns {Promise<any>} 接口返回的数据
 */
export function getCategoryList() {
  return request.get('/category/getCategoryList')
}

export default {
  getCategoryList
}