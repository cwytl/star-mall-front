//用户地址相关API
import request from './request'

/**
 * 获取用户地址列表
 * @returns {Promise<any>} 接口返回的数据
 */
export function getUserAddressList() {
  return request.get('/user/getUserAddressList')
}

/**
 * 新增用户地址
 * @param {Object} address - 地址数据
 * @param {string} address.receiverName - 收件人姓名
 * @param {string} address.receiverPhone - 收件人电话
 * @param {string} address.province - 省份
 * @param {string} address.city - 城市
 * @param {string} address.district - 区县
 * @param {string} address.detailAddress - 详细地址
 * @returns {Promise<any>} 接口返回的数据
 */
export function addUserAddress(address) {
  const params = {
    ...address
  }
  return request.post('/user/addUserAddress', params)
}



/**
 * 删除用户地址
 * @param {number} addressId - 地址ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function deleteUserAddress(addressId) {
  return request.delete(`/user/deleteUserAddress/${addressId}`)
}


/**
 * 查询用户地址详情
 * @param {number} addressId - 地址ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function getUserAddressInfo(addressId) {
  return request.get(`/user/getUserAddressInfo/${addressId}`)
}

/**
 * 更新用户地址
 * @param {Object} updateAddress - 需要更新的地址数据
 * @param {number} updateAddress.id - 地址id
 * @param {string} updateAddress.receiverName - 收件人姓名
 * @param {string} updateAddress.receiverPhone - 收件人电话
 * @param {string} updateAddress.province - 省份
 * @param {string} updateAddress.city - 城市
 * @param {string} updateAddress.district - 区县
 * @param {string} updateAddress.detailAddress - 详细地址
 * @returns {Promise<any>} 接口返回的数据
 */
export function updateUserAddress(updateAddress) {
  const params = {
    ...updateAddress
  }
  return request.put('/user/updateUserAddress', params)
}



/**
 * 设置默认地址
 * @param {number} addressId - 地址ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function setDefaultAddress(addressId) {
  return request.put(`/user/setDefaultAddress/${addressId}`)
}


export default {
  getUserAddressList,
  addUserAddress,
  deleteUserAddress,
  getUserAddressInfo,
  updateUserAddress,
  setDefaultAddress
}