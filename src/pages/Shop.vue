<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const shopId = route.params.id
</script>

<template>
  <div class="shop-page">
    <div class="placeholder-box">
      <el-empty description="功能待完善" />
    </div>
  </div>
</template>

<style scoped>
.shop-page {
  padding: 40px 32px;
  background: #f7f9fb;
  min-height: 100vh;
}

.placeholder-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
}
</style>