<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, View, Van } from '@element-plus/icons-vue'
import { getSellerOrders, shipOrder, updateOrderStatus } from '@/api/seller'

// Mock 订单数据
const mockOrders = [
  { orderSn: '202411270001', buyerName: '张三', totalAmount: 298.00, status: 'paid', createTime: '2024-11-27 10:30:22' },
  { orderSn: '202411270002', buyerName: '李四', totalAmount: 459.00, status: 'shipped', createTime: '2024-11-27 09:15:18' },
  { orderSn: '202411260003', buyerName: '王五', totalAmount: 89.00, status: 'completed', createTime: '2024-11-26 16:45:30' },
  { orderSn: '202411260004', buyerName: '赵六', totalAmount: 199.00, status: 'pending', createTime: '2024-11-26 14:20:55' },
  { orderSn: '202411250005', buyerName: '孙七', totalAmount: 79.00, status: 'paid', createTime: '2024-11-25 11:08:42' },
  { orderSn: '202411250006', buyerName: '周八', totalAmount: 68.00, status: 'cancelled', createTime: '2024-11-25 08:33:11' }
]

const orders = ref(mockOrders)
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(mockOrders.length)

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const filteredOrders = computed(() => {
  let result = orders.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(o =>
      o.orderSn?.toLowerCase().includes(keyword)
    )
  }
  if (statusFilter.value) {
    result = result.filter(o => o.status === statusFilter.value)
  }
  return result
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getSellerOrders({
      page: currentPage.value,
      size: pageSize.value,
      status: statusFilter.value
    })
    if (res?.code === 200) {
      orders.value = res.data?.list || res.data || mockOrders
      total.value = res.data?.total || orders.value.length
    }
  } catch (error) {
    // 使用 mock 数据
    orders.value = mockOrders
    console.log('使用 Mock 订单数据')
  } finally {
    loading.value = false
  }
}

const handleShip = async (row) => {
  try {
    const { value: logisticsCompany } = await ElMessageBox.prompt('请输入物流公司', '发货', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入物流公司名称'
    })

    // Mock 发货
    row.status = 'shipped'
    ElMessage.success(`发货成功（Mock模式）物流：${logisticsCompany}`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发货失败')
    }
  }
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    paid: 'primary',
    shipped: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="seller-orders">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索订单号"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
      />
      <el-select v-model="statusFilter" placeholder="订单状态" style="width: 150px" @change="fetchOrders">
        <el-option
          v-for="item in statusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <el-table :data="filteredOrders" v-loading="loading" stripe>
      <el-table-column prop="orderSn" label="订单号" width="200" />
      <el-table-column prop="buyerName" label="买家" width="120" />
      <el-table-column prop="totalAmount" label="订单金额" width="120">
        <template #default="{ row }">
          ¥{{ row.totalAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :icon="View" link>详情</el-button>
          <el-button
            size="small"
            type="primary"
            :icon="Van"
            link
            v-if="row.status === 'paid'"
            @click="handleShip(row)"
          >
            发货
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
        @change="fetchOrders"
      />
    </div>
  </div>
</template>

<style scoped>
.seller-orders {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>