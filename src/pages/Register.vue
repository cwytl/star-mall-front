<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { sendCode, register } from '@/api/auth'

const phone = ref('')
const code = ref('')
const agreementChecked = ref(false)
const countdown = ref(0)
const phoneError = ref('')
const codeError = ref('')
let countdownTimer = null
const router = useRouter()

const handleGetCode = async () => {
  phoneError.value = ''
  codeError.value = ''

  if (countdown.value > 0) return

  const phoneNumber = phone.value.trim()
  const phonePattern = /^1[3-9]\d{9}$/

  if (!phoneNumber) {
    phoneError.value = '请输入手机号'
    return
  }

  if (!phonePattern.test(phoneNumber)) {
    phoneError.value = '请输入正确的手机号'
    return
  }

  try {
    const res = await sendCode({ phoneNumber, type: 'register' })
    if (res?.code === 200) {
      console.info('验证码：', res?.data)
      countdown.value = 60
      countdownTimer = setInterval(() => {
        if (countdown.value <= 1) {
          clearInterval(countdownTimer)
          countdownTimer = null
          countdown.value = 0
        } else {
          countdown.value -= 1
        }
      }, 1000)
    }
  } catch (error) {
    console.error('获取验证码失败', error)
  }
}

const handleRegister = async () => {
  agreementChecked.value = true
  phoneError.value = ''
  codeError.value = ''

  const phoneNumber = phone.value.trim()
  const phonePattern = /^1[3-9]\d{9}$/

  if (!phoneNumber) {
    phoneError.value = '请输入手机号'
    return
  }

  if (!phonePattern.test(phoneNumber)) {
    phoneError.value = '请输入正确的手机号'
    return
  }

  if (!code.value.trim()) {
    codeError.value = '请输入验证码'
    return
  }

  try {
    const res = await register({ phoneNumber, code: code.value.trim() })
    if (res?.code === 200) {
      const token = res?.data?.token || res?.data
      if (token) {
        localStorage.setItem('token', token)
      }
      console.info('注册成功，token：', res?.data)
      ElMessage.success('注册成功')
      router.push('/home')
    } else if (res?.code === 500 && res?.msg === '该手机号已注册') {
      ElMessage.error('该手机号已注册')
    }
  } catch (error) {
    console.error('注册失败', error)
  }
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="register-page">
    <span class="back-login" @click="router.push('/login')">返回登录</span>
    <div class="register-card">
      <div class="header">
        <h2>欢迎注册星选商城</h2>
        <p>使用手机号码完成注册并开启您的购物之旅</p>
      </div>

      <div class="form-section">
        <div class="form-field">
          <label for="phone">手机号码</label>
          <el-input
            id="phone"
            v-model="phone"
            size="large"
            placeholder="请输入手机号码"
            class="input-control"
          />
          <p v-if="phoneError" class="error-text">
            <el-icon class="error-icon"><WarningFilled /></el-icon>
            <span>{{ phoneError }}</span>
          </p>
        </div>

        <div class="form-field">
          <label for="code">验证码</label>
          <el-input
            id="code"
            v-model="code"
            size="large"
            placeholder="请输入验证码"
            class="input-control"
          >
            <template #suffix>
              <span
                class="code-suffix"
                :class="{ 'is-disabled': countdown > 0 }"
                @click="handleGetCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
              </span>
            </template>
          </el-input>
          <p v-if="codeError" class="error-text">
            <el-icon class="error-icon"><WarningFilled /></el-icon>
            <span>{{ codeError }}</span>
          </p>
        </div>
      </div>

      <el-button type="primary" color="#ff6a00" class="register-btn" @click="handleRegister">
        同意并注册
      </el-button>

      <div class="agreement">
        <el-checkbox v-model="agreementChecked" class="circle-checkbox" size="small" />
        <span class="agreement-text">
          已阅读并同意以下协议平台服务协议、隐私权政策、法律声明及客户端服务协议
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #fff;
  padding: 40px 16px;
  box-sizing: border-box;
  position: relative;
}

.back-login {
  position: absolute;
  top: 18px;
  left: 18px;
  color: #ff6a00;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}

.back-login:hover {
  text-decoration: underline;
}

.register-card {
  width: min(480px, 100%);
  background: #fff;
  border-radius: 18px;
  padding: 32px 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: -80px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #111827;
}

.header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
}

.input-control :deep(.el-input__wrapper) {
  background: #f3f6f8;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 15px;
}

.error-text {
  margin: 4px 0 0;
  color: #ef4444;
  font-size: 12px;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.error-icon {
  font-size: 14px;
}

.code-suffix {
  color: #ff6a00;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}

.code-suffix.is-disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.code-suffix:hover {
  text-decoration: underline;
}

.register-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  color: #fff;
}

.agreement {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

.circle-checkbox :deep(.el-checkbox__inner) {
  border-radius: 50%;
}

.agreement :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.agreement :deep(.el-checkbox__inner:hover) {
  border-color: #ff6a00;
  background-color: #ff6a00;
}

.agreement :deep(.el-checkbox__inner::after) {
  border-color: #fff;
}

@media (max-width: 480px) {
  .register-card {
    padding: 28px 20px;
  }
}
</style>
