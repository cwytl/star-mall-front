// axios封装（全局）
import axios from 'axios'

const service = axios.create({
  baseURL: 'http://localhost:8080/api',    // 你后端的接口前缀
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    // Attach token header for all requests
    config.headers.token = token
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default service
