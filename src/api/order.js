// 订单API
import request from './request'

/**
 * 查询订单列表（ES索引实现）
 * @param {Object} params 查询参数
 * @param {number} [params.subOrderId] 子订单ID（可选）
 * @param {number} [params.status] 订单状态（可选）
 * @param {string} [params.spuName] 商品名称（可选）
 * @param {number} [params.pageNo] 页码，默认1
 * @param {number} [params.pageSize] 每页数量，默认12
 * @returns {Promise<{total: number, records: Array<SubOrderVO>}>} 返回分页结果
 *
 * SubOrderVO 数据结构：
 * - subOrderId: 子订单ID
 * - subOrderSn: 子订单编号
 * - status: 状态（0-待付款, 1-待发货, 2-已发货, 3-已完成, 4-已关闭）
 * - statusDesc: 状态描述
 * - receiverName: 收货人姓名
 * - receiverPhone: 收货人电话
 * - receiverProvince: 省
 * - receiverCity: 市
 * - receiverDistrict: 区
 * - receiverDetailAddress: 详细地址
 * - shopId: 店铺ID
 * - shopName: 店铺名称
 * - shopLogo: 店铺Logo
 * - items: 商品明细列表
 *   - spuId: 商品SPU ID
 *   - skuId: 商品SKU ID
 *   - spuName: 商品名称
 *   - skuName: 规格名称
 *   - picUrl: 商品图片
 *   - price: 下单单价
 *   - quantity: 数量
 * - goodsAmount: 商品金额
 * - payAmount: 实付金额
 * - freightAmount: 运费
 * - couponAmount: 优惠金额
 * - deliveryCompany: 物流公司
 * - deliverySn: 物流单号
 * - createTime: 创建时间
 * - paymentTime: 支付时间
 * - paymentType: 支付方式
 * - paymentTypeDesc: 支付方式描述
 * - remark: 备注
 * - isDelete: 是否删除
 */
export function getSubOrderList(params = {}) {
    const { pageNo, pageSize, subOrderId, status, spuName } = params
    const queryParams = {}
    if (subOrderId !== undefined) queryParams.subOrderId = subOrderId
    if (status !== undefined) queryParams.status = status
    if (spuName !== undefined) queryParams.spuName = spuName
    if (pageNo !== undefined) queryParams.pageNo = pageNo
    if (pageSize !== undefined) queryParams.PageSize = pageSize // 后端参数名是 PageSize
    return request.get('/order/list', { params: queryParams })
}

/**
 * 查询主订单详情
 * @param {string} parentOrderSn 主订单编号
 * @returns {Promise<Array<SubOrderVO>>} 返回子订单列表
 */
export function getParentOrderDetail(parentOrderSn) {
    return request.get(`/order/detail/parent/${parentOrderSn}`)
}

/**
 * 查询子订单详情
 * @param {string} subOrderSn 子订单编号
 * @returns {Promise<SubOrderVO>} 返回子订单详情
 *
 * SubOrderVO 数据结构：
 * - subOrderId: 子订单ID
 * - subOrderSn: 子订单编号
 * - status: 状态（1-待发货, 2-已发货, 3-已完成, 4-已关闭）
 * - statusDesc: 状态描述
 * - receiverName: 收货人姓名
 * - receiverPhone: 收货人电话
 * - receiverProvince: 省
 * - receiverCity: 市
 * - receiverDistrict: 区
 * - receiverDetailAddress: 详细地址
 * - shopId: 店铺ID
 * - shopName: 店铺名称
 * - shopLogo: 店铺Logo
 * - items: 商品明细列表
 *   - spuId: 商品SPU ID
 *   - skuId: 商品SKU ID
 *   - spuName: 商品名称
 *   - skuName: 规格名称
 *   - picUrl: 商品图片
 *   - price: 下单单价
 *   - quantity: 数量
 * - goodsAmount: 商品原价总计
 * - payAmount: 实际支付金额
 * - freightAmount: 运费
 * - couponAmount: 订单优惠
 * - deliveryCompany: 物流公司（已发货时有值）
 * - deliverySn: 物流单号（已发货时有值）
 * - createTime: 创建时间
 * - paymentTime: 支付时间
 * - paymentType: 支付方式
 * - paymentTypeDesc: 支付方式描述
 * - isDelete: 是否删除
 */
export function getSubOrderDetail(subOrderSn) {
    return request.get(`/order/detail/sub/${subOrderSn}`)
}

/**
 * 预下单确认接口
 * @param {Object} data 预下单数据
 * @param {number} [data.addressId] 收货地址ID
 * @param {number} [data.couponUserRecordId] 平台通用优惠券/全场券ID
 * @param {Array<{
 *   shopId: number,
 *   shopCouponId?: number,
 *   items: Array<{skuId: number, quantity: number}>
 * }>} data.shops 店铺订单列表
 * @returns {Promise<any>} 返回聚合后的确认单信息
 */
export function checkout(data) {
    return request.post('/order/checkout', data)
}

/**
 * 提交订单
 * @param {Object} data 订单数据
 * @param {number} data.source 商品来源：1-立即购买，2-购物车（必填）
 * @param {number} data.addressId 收货地址ID（必填）
 * @param {number} [data.couponUserRecordId] 用户优惠券领取记录ID（可选）
 * @param {number} data.paymentType 支付方式：1-支付宝, 2-微信（必填）
 * @param {number} data.expectedPayAmount 预期实付金额（必填）
 * @param {string} data.submitToken 防重token（必填）
 * @param {Array<{
 *   shopId: number,
 *   shopCouponId?: number,
 *   shopRemark?: string,
 *   items: Array<{skuId: number, quantity: number}>
 * }>} data.shops 店铺订单列表（必填）
 * @returns {Promise<any>} 接口返回的数据
 */
export function submitOrder(data) {
    return request.post('/order/submit', data)
}

/**
 * 查询订单状态（供前端轮询）
 * @param {string} parentOrderSn 主订单编号
 * @returns {Promise<number>} 返回订单状态
 */
export function getOrderStatus(parentOrderSn) {
    return request.get(`/order/getStatus/${parentOrderSn}`)
}

/**
 * 取消订单
 * @param {string} parentOrderSn 主订单编号
 * @returns {Promise<boolean>} 返回是否取消成功
 */
export function cancelOrder(parentOrderSn) {
    return request.put(`/order/cancel/${parentOrderSn}`)
}

/**
 * 删除订单（逻辑删除）
 * @param {string} orderSn 订单编号
 * @returns {Promise<any>} 接口返回的数据
 */
export function deleteOrder(orderSn) {
    return request.delete(`/order/delete/${orderSn}`)
}

/**
 * 确认收货
 * @param {string} orderSn 订单编号
 * @returns {Promise<any>} 接口返回的数据
 */
export function confirmReceive(orderSn) {
    return request.post(`/order/confirm/${orderSn}`)
}

export default {
    getSubOrderList,
    getParentOrderDetail,
    getSubOrderDetail,
    checkout,
    submitOrder,
    getOrderStatus,
    cancelOrder,
    deleteOrder,
    confirmReceive
}