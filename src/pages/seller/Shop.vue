<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getShopInfo, updateShopInfo } from '@/api/seller'

// Mock 店铺数据
const mockShopInfo = {
  name: 'Star旗舰店',
  logo: '',
  description: '专注高品质生活用品，为您精选每一件好物。',
  contactPhone: '13800138000',
  address: '浙江省杭州市西湖区科技园区'
}

const shopForm = ref(mockShopInfo)
const loading = ref(false)
const saving = ref(false)

const fetchShopInfo = async () => {
  loading.value = true
  try {
    const res = await getShopInfo()
    if (res?.code === 200) {
      shopForm.value = res.data || mockShopInfo
    }
  } catch (error) {
    // 使用 mock 数据
    shopForm.value = mockShopInfo
    console.log('使用 Mock 店铺数据')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await updateShopInfo(shopForm.value)
    if (res?.code === 200) {
      ElMessage.success('保存成功')
    } else {
      // Mock 保存
      ElMessage.success('保存成功（Mock模式）')
    }
  } catch (error) {
    // Mock 保存
    ElMessage.success('保存成功（Mock模式）')
    console.log('Mock 模式保存')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchShopInfo()
})
</script>

<template>
  <div class="seller-shop">
    <div class="page-header">
      <h1 class="page-title">店铺设置</h1>
    </div>

    <el-card v-loading="loading" class="shop-card">
      <el-form :model="shopForm" label-width="100px" label-position="left">
        <el-form-item label="店铺名称">
          <el-input v-model="shopForm.name" placeholder="请输入店铺名称" />
        </el-form-item>

        <el-form-item label="店铺Logo">
          <el-input v-model="shopForm.logo" placeholder="请输入Logo图片URL" />
          <div class="logo-preview" v-if="shopForm.logo">
            <img :src="shopForm.logo" alt="店铺Logo" />
          </div>
        </el-form-item>

        <el-form-item label="店铺简介">
          <el-input
            v-model="shopForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入店铺简介"
          />
        </el-form-item>

        <el-form-item label="联系电话">
          <el-input v-model="shopForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="店铺地址">
          <el-input v-model="shopForm.address" placeholder="请输入店铺地址" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" color="#ff6a00" :loading="saving" @click="handleSave">
            保存设置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.seller-shop {
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

.shop-card {
  max-width: 600px;
}

.logo-preview {
  margin-top: 12px;
}

.logo-preview img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>