<script setup>
import { ref, onMounted } from 'vue'
import { getHotProductsToday } from '@/api/product'

const loading = ref(false)
const result = ref(null)
const error = ref(null)

const testFetch = async () => {
  loading.value = true
  error.value = null
  result.value = null
  try {
    console.log('开始调用 getHotProductsToday...')
    const res = await getHotProductsToday()
    console.log('返回结果:', res)
    result.value = res
  } catch (err) {
    console.error('请求错误:', err)
    error.value = err?.message || '请求失败'
  } finally {
    loading.value = false
  }
}

onMounted(testFetch)
</script>

<template>
  <div class="test-page">
    <h2>测试页面 - 热门商品接口</h2>
    <el-button @click="testFetch" :loading="loading">重新请求</el-button>

    <div v-if="loading" style="margin-top: 20px;">加载中...</div>

    <div v-if="error" style="margin-top: 20px; color: red;">
      <p>错误: {{ error }}</p>
    </div>

    <div v-if="result" style="margin-top: 20px;">
      <p>请求成功!</p>
      <p>商品数量: {{ result?.data?.length || 0 }}</p>
      <pre style="max-height: 300px; overflow: auto; background: #f5f5f5; padding: 10px;">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.test-page {
  padding: 40px;
}
</style>