<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { sendCode, loginByCode, loginByPassword } from '@/api/auth'

const router = useRouter()

const activeTab = ref('password')
const agreementChecked = ref(false)
const form = ref({
  account: '',
  password: ''
})
const phoneError = ref('')
const codeError = ref('')
const countdown = ref(0)
let countdownTimer = null

const passwordPlaceholder = computed(() =>
  activeTab.value === 'sms' ? '请输入短信验证码' : '请输入密码'
)

const accountPlaceholder = computed(() =>
  activeTab.value === 'sms' ? '请输入手机号' : '请输入用户名'
)

const loginLabel = computed(() => '同意并登录')

const handleGetCode = async () => {
  if (activeTab.value !== 'sms' || countdown.value > 0) return
  phoneError.value = ''

  const phoneNumber = form.value.account.trim()
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
    const res = await sendCode({ phoneNumber, type: 'login' })
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

const handleLogin = async () => {
  agreementChecked.value = true
  phoneError.value = ''
  codeError.value = ''

  if (activeTab.value === 'sms') {
    const phoneNumber = form.value.account.trim()
    const phonePattern = /^1[3-9]\d{9}$/
    if (!phoneNumber) {
      phoneError.value = '请输入手机号'
      return
    }
    if (!phonePattern.test(phoneNumber)) {
      phoneError.value = '请输入正确的手机号'
      return
    }
    if (!form.value.password.trim()) {
      codeError.value = '请输入验证码'
      return
    }

    try {
      const res = await loginByCode({ phoneNumber, code: form.value.password.trim() })
      if (res?.code === 200) {
        const token = res?.data?.token || res?.data
        if (token) {
          localStorage.setItem('token', token)
        }
        console.info('登录成功，token：', res?.data)
        ElMessage.success('登录成功')
        router.push('/home')
      }
    } catch (error) {
      console.error('验证码登录失败', error)
    }

    return
  }

  // 密码登录（用户名 + 密码）
  const username = form.value.account.trim()

  if (!username) {
    phoneError.value = '请输入用户名'
    return
  }
  if (!form.value.password.trim()) {
    phoneError.value = '请输入密码'
    return
  }

  try {
    const res = await loginByPassword({ username, password: form.value.password.trim() })
    if (res?.code === 200) {
      const token = res?.data?.token || res?.data
      if (token) {
        localStorage.setItem('token', token)
      }
      console.info('登录成功，token：', res?.data)
      ElMessage.success('登录成功')
      router.push('/home')
    }
  } catch (error) {
    console.error('密码登录失败', error)
    phoneError.value = '登录失败，请检查用户名和密码'
  }
}

const goRegister = () => {
  router.push('/register')
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="auth-page">
    <span class="back-home" @click="router.push('/home')">返回首页</span>
    <div class="auth-card">
      <div class="auth-left">
        <p class="qr-title">手机扫码登录</p>
        <div class="qr-box">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TaoMall"
            alt="扫码登录二维码"
          />
        </div>
        <p class="qr-tip">打开APP · 点击左上角扫一扫</p>
      </div>

      <div class="auth-divider"></div>

      <div class="auth-right">
        <div class="custom-tabs">
          <span
            class="tab-item"
            :class="{ active: activeTab === 'password' }"
            @click="
              activeTab = 'password';
              form.account = '';
              form.password = '';
              phoneError = '';
              codeError = ''
            "
          >
            密码登录
          </span>
          <span class="tab-divider"></span>
          <span
            class="tab-item"
            :class="{ active: activeTab === 'sms' }"
            @click="
              activeTab = 'sms';
              form.account = '';
              form.password = '';
              phoneError = '';
              codeError = ''
            "
          >
            短信登录
          </span>
        </div>

        <div class="form-body">
          <el-input
            v-model="form.account"
            size="large"
            :placeholder="accountPlaceholder"
            class="form-item"
            type="text"
            name="username"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            readonly
            @focus="$event.target.removeAttribute('readonly')"
          />
          <p v-if="phoneError" class="error-text">
            <el-icon class="error-icon"><WarningFilled /></el-icon>
            <span>{{ phoneError }}</span>
          </p>
          <el-input
            v-model="form.password"
            size="large"
            :placeholder="passwordPlaceholder"
            class="form-item"
            :type="activeTab === 'sms' ? 'text' : 'password'"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          >
            <template #suffix>
              <span
                v-if="activeTab === 'sms'"
                class="code-suffix"
                :class="{ 'is-disabled': countdown > 0 }"
                @click="handleGetCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
              </span>
            </template>
          </el-input>
          <p v-if="codeError && activeTab === 'sms'" class="error-text">
            <el-icon class="error-icon"><WarningFilled /></el-icon>
            <span>{{ codeError }}</span>
          </p>
          <el-button type="primary" color="#ff6a00" class="login-btn" @click="handleLogin">
            {{ loginLabel }}
          </el-button>
        </div>

        <div class="link-row">
          <el-link type="info" :underline="false">忘记账号</el-link>
          <el-link type="primary" :underline="false" @click="goRegister">免费注册</el-link>
        </div>

        <div class="agreement">
          <el-checkbox v-model="agreementChecked" class="circle-checkbox" size="small" />
          <span class="agreement-text">
            已阅读并同意以下协议
            <a href="#">平台服务协议</a>、<a href="#">隐私权政策</a>、<a href="#">法律声明</a>及
            <a href="#">客户端服务协议</a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px 20px;
  box-sizing: border-box;
  position: relative;
}

.back-home {
  position: absolute;
  top: 18px;
  left: 18px;
  color: #ff6a00;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}

.back-home:hover {
  text-decoration: underline;
}

.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  display: grid;
  grid-template-columns: 1fr auto 1.2fr;
  gap: 32px;
  width: min(760px, 100%);
  min-height: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  margin-top: -70px;
}

.auth-divider {
  width: 1px;
  height: 300px;
  background: #e5e7eb;
  align-self: center;
  margin-right: 30px;
}

.auth-left {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  padding-bottom: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.qr-title {
  margin: 0;
  font-weight: 500;
  color: #494f5b;
  font-size: 20px;
}

.qr-box {
  width: 220px;
  height: 220px;
  display: grid;
  place-items: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: inset 0 0 0 0.5px #cecdcc;
}

.qr-box img {
  width: 180px;
  height: 180px;
}

.qr-tip {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.auth-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 30px;
}

.custom-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
  margin-right: 50px;
}

.tab-item {
  width: 80px;
  text-align: center;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
}

.tab-item:hover {
  color: #ff6a00;
}

.tab-item.active {
  color: #ff6a00;
  font-size: 20px;
  font-weight: 600;
}

.tab-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
  width: 320px;
}

.form-item {
  width: 100%;
}

.form-item :deep(.el-input__wrapper) {
  background: #f3f6f8;
  border-radius: 5px;
  padding: 0 14px;
  font-size: 16px;
  height: 48px;
  box-shadow: none;
  transition: background-color 0.2s ease;
}

.form-item :deep(.el-input__wrapper:hover),
.form-item :deep(.el-input__wrapper:focus-within) {
  background: #e8eaed;
  box-shadow: none;
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

.error-text {
  margin: -6px 0 0;
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

.login-btn {
  width: 100%;
  height: 52px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  color: #fff;
}

.link-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  width: 320px;
}

.agreement {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
  width: 320px;
}

.circle-checkbox :deep(.el-checkbox__inner) {
  border-radius: 50%;
}

.agreement :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.agreement :deep(.el-checkbox__inner:hover) {
  border-color: #ff6a00;
  background-color: #ff6a00;
}

.agreement :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  border-color: #ff6a00;
  background-color: #ff6a00;
}

.agreement :deep(.el-checkbox__inner::after) {
  border-color: #fff;
}

.agreement-text a {
  color: #ff6a00;
  text-decoration: none;
}

.agreement-text a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .auth-card {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .auth-divider {
    display: none;
  }

  .qr-box {
    width: 160px;
    height: 160px;
  }

  .qr-box img {
    width: 120px;
    height: 120px;
  }
}
</style>
