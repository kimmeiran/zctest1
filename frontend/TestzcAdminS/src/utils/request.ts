import axios from 'axios';
import router from '../router';
import { ElMessage } from 'element-plus';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
});

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 判断是否为登录接口（登录失败时由 Login.vue 展示错误信息，不在此处提示「登录过期」）
const isLoginRequest = (config?: { url?: string }) => {
  const url = String(config?.url || '');
  return url.includes('/api/login');
};

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // Check for custom code from backend
    if (res.code && res.code !== 200) {
      if (res.code === 401) {
        localStorage.clear();
        sessionStorage.clear();
        router.push('/login');
        if (!isLoginRequest(response.config)) {
          ElMessage.error('登录过期，请重新登录');
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const config = error.config || {};
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
      if (!isLoginRequest(config)) {
        ElMessage.error('登录过期，请重新登录');
      }
    }
    return Promise.reject(error);
  }
);

export default service;
