// 优惠券API
import request from './request'

/**
 * 查询领券中心
 * @returns {Promise<any>} 接口返回的数据
 */
export function getPublishingCoupon() {
    return request.get('/coupon/center/list')
}

/**
 * 领取优惠券
 * @param {number} templateId 优惠券模板ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function receiveCoupon(templateId) {
    return request.post(`/coupon/receive/${templateId}`)
}

/**
 * 查询我的优惠券列表
 * @param {number} [status] 优惠券状态（可选）
 * @returns {Promise<any>} 接口返回的数据
 */
export function getMyCoupons(status) {
    return request.get('/coupon/my/list', { params: { status } })
}

/**
 * 结算时查询当前订单可用优惠券
 * @param {number} orderAmount 订单金额
 * @returns {Promise<any>} 接口返回的数据
 */
export function getAvailableCoupons(orderAmount) {
    return request.get('/coupon/available', { params: { orderAmount } })
}

/**
 * 锁定优惠券 (0 -> 1)
 * 调用时机：用户提交订单，后端创建订单记录时
 * @param {number} recordId 优惠券记录ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function lockCoupon(recordId) {
    return request.post('/coupon/lock', null, { params: { recordId } })
}

/**
 * 正式核销优惠券 (1 -> 2)
 * 调用时机：支付系统回调，确认支付成功时
 * @param {number} recordId 优惠券记录ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function useCoupon(recordId) {
    return request.post('/coupon/use', null, { params: { recordId } })
}

/**
 * 释放/回滚优惠券 (1 -> 0)
 * 调用时机：用户手动取消订单 或 支付超时自动关闭订单
 * @param {number} recordId 优惠券记录ID
 * @returns {Promise<any>} 接口返回的数据
 */
export function releaseCoupon(recordId) {
    return request.post('/coupon/release', null, { params: { recordId } })
}

export default {
    getPublishingCoupon,
    receiveCoupon,
    getMyCoupons,
    getAvailableCoupons,
    lockCoupon,
    useCoupon,
    releaseCoupon
}