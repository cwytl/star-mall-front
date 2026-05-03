<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { sellerLogin } from '@/api/seller'
import { setSellerLogin } from '@/store/seller'

const router = useRouter()

const form = ref({
  username: '',
  password: ''
})
const error = ref('')
const loading = ref(false)

// Mock 商家数据（用于测试）
const mockSeller = {
  username: 'seller001',
  password: '123456',
  token: 'mock_seller_token_abc123',
  sellerInfo: {
    id: 1,
    name: 'Star旗舰店',
    username: 'seller001',
    phone: '13800138000',
    avatar: ''
  }
}

const handleLogin = async () => {
  error.value = ''

  const username = form.value.username.trim()
  const password = form.value.password.trim()

  if (!username) {
    error.value = '请输入商家账号'
    return
  }
  if (!password) {
    error.value = '请输入密码'
    return
  }

  // Mock 登录（测试用）
  if (username === mockSeller.username && password === mockSeller.password) {
    setSellerLogin(mockSeller.token, mockSeller.sellerInfo)
    ElMessage.success('登录成功（Mock模式）')
    router.push('/seller/dashboard')
    return
  }

  loading.value = true
  try {
    const res = await sellerLogin({ username, password })
    if (res?.code === 200) {
      const token = res?.data?.token || res?.data
      if (token) {
        setSellerLogin(token, res?.data?.seller)
        ElMessage.success('登录成功')
        router.push('/seller/dashboard')
      }
    } else {
      error.value = res?.message || '登录失败'
    }
  } catch (err) {
    error.value = '登录失败，请检查账号密码'
    console.error('登录错误:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="seller-login-page">
    <div class="login-card">
      <h2 class="login-title">商家后台登录</h2>

      <el-input
        v-model="form.username"
        size="large"
        placeholder="请输入商家账号"
        class="form-item"
        :prefix-icon="User"
      />

      <el-input
        v-model="form.password"
        size="large"
        type="password"
        placeholder="请输入密码"
        class="form-item"
        show-password
      />

      <p v-if="error" class="error-text">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <span>{{ error }}</span>
      </p>

      <el-button
        type="primary"
        color="#ff6a00"
        class="login-btn"
        :loading="loading"
        @click="handleLogin"
      >
        登录
      </el-button>

      <div class="footer-links">
        <a href="/login">用户端登录</a>
      </div>
    </div>
  </div>
</template>

<script>
import { User } from '@element-plus/icons-vue'
export default {
  components: { User }
}
</script>

<style scoped>
.seller-login-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbdde0 0%, #c9cbce 100%);
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 56px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  text-align: center;
  color: #1e293b;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 32px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item :deep(.el-input__wrapper) {
  background: #f3f6f8;
  border-radius: 8px;
  height: 48px;
  box-shadow: none;
}

.error-text {
  margin: -8px 0 16px;
  color: #ef4444;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.footer-links {
  margin-top: 20px;
  text-align: center;
}

.footer-links a {
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
}

.footer-links a:hover {
  color: #ff6a00;
}
</style>