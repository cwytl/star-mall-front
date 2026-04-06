// 登录/注册API
import request from './request'
/**
 * 发送验证码
 * @param {Object} params
 * @param {string} params.phoneNumber 手机号 
 * @param {string} params.type 请求类型（登录or注册）
 * @returns {Promise<any>} 接口返回的数据
 */
export function sendCode(params = { phoneNumber, type}) {
  return request.post('/user/sendCode', params)
}

/**
 * 注册
 * @param {Object} params
 * @param {string} params.phoneNumber 手机号 
 * @param {string} params.code 验证码
 * @returns {Promise<any>} 接口返回的数据
 */
export function register(params = { phoneNumber, code}) {
  return request.post('/user/register', params)
}


/**
 * 手机号验证码登录
 * @param {Object} params
 * @param {string} params.phoneNumber 手机号 
 * @param {string} params.code 验证码
 * @returns {Promise<any>} 接口返回的数据
 */
export function loginByCode(params = { phoneNumber, code}) {
  return request.post('/user/login/code', params)
}

/**
 * 账号密码登录
 * @param {Object} params
 * @param {string} params.username 用户名 
 * @param {string} params.password 密码
 * @returns {Promise<any>} 接口返回的数据
 */
export function loginByPassword(params = { username, password}) {
  return request.post('/user/login/password', params)
}

/**
 * 获取用户信息
 * @returns {Promise<any>} 接口返回的数据
 */
export function getUserInfo() {
  return request.get('/user/profile')
}



export default{
    sendCode,
    register,
    loginByCode,
    loginByPassword,
    getUserInfo
}