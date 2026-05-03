<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import {
  getSellerProducts,
  toggleProductStatus,
  deleteSellerProduct
} from '@/api/seller'

// Mock 商品数据
const mockProducts = [
  { id: 1, name: '秋冬加绒卫衣男士宽松百搭', price: 89.00, stock: 256, status: 1, sales: 189 },
  { id: 2, name: '无线蓝牙耳机降噪运动款', price: 199.00, stock: 128, status: 1, sales: 342 },
  { id: 3, name: '纯棉四件套床上用品', price: 299.00, stock: 45, status: 1, sales: 67 },
  { id: 4, name: '智能手表运动监测款', price: 459.00, stock: 0, status: 0, sales: 23 },
  { id: 5, name: '便携式充电宝20000mAh', price: 79.00, stock: 500, status: 1, sales: 856 },
  { id: 6, name: '真皮男士休闲皮带', price: 68.00, stock: 89, status: 1, sales: 124 }
]

const products = ref(mockProducts)
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(mockProducts.length)

const filteredProducts = computed(() => {
  if (!searchKeyword.value) return products.value
  const keyword = searchKeyword.value.toLowerCase()
  return products.value.filter(p =>
    p.name?.toLowerCase().includes(keyword) ||
    p.id?.toString().includes(keyword)
  )
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getSellerProducts({
      page: currentPage.value,
      size: pageSize.value
    })
    if (res?.code === 200) {
      products.value = res.data?.list || res.data || mockProducts
      total.value = res.data?.total || products.value.length
    }
  } catch (error) {
    // 使用 mock 数据
    products.value = mockProducts
    console.log('使用 Mock 商品数据')
  } finally {
    loading.value = false
  }
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确认${action}该商品？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // Mock 操作
    row.status = newStatus
    ElMessage.success(`${action}成功（Mock模式）`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该商品？删除后不可恢复', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    // Mock 删除
    products.value = products.value.filter(p => p.id !== row.id)
    ElMessage.success('删除成功（Mock模式）')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getStatusText = (status) => {
  return status === 1 ? '已上架' : '已下架'
}

const getStatusType = (status) => {
  return status === 1 ? 'success' : 'info'
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="seller-products">
    <div class="page-header">
      <h1 class="page-title">商品管理</h1>
      <el-button type="primary" color="#ff6a00" :icon="Plus">
        添加商品
      </el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索商品名称或ID"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
      />
    </div>

    <el-table :data="filteredProducts" v-loading="loading" stripe>
      <el-table-column prop="id" label="商品ID" width="100" />
      <el-table-column prop="name" label="商品名称" min-width="200" />
      <el-table-column prop="price" label="价格" width="120">
        <template #default="{ row }">
          ¥{{ row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sales" label="销量" width="100" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" link>编辑</el-button>
          <el-button
            size="small"
            :type="row.status === 1 ? 'warning' : 'success'"
            link
            @click="handleToggleStatus(row)"
          >
            <el-icon>
              <ArrowDown v-if="row.status === 1" />
              <ArrowUp v-else />
            </el-icon>
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button size="small" type="danger" :icon="Delete" link @click="handleDelete(row)">
            删除
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
        @change="fetchProducts"
      />
    </div>
  </div>
</template>

<style scoped>
.seller-products {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.search-bar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>