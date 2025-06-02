import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // API基础URL
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 获取用户token
    const userStore = useUserStore();
    const token = userStore.token;
    
    // 如果有token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('请求错误', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    
    // 如果返回的状态码不是200，说明接口请求有问题，处理不同状态码
    if (res.code !== 200) {
      // 显示错误消息
      ElMessage({
        message: res.message || '系统错误',
        type: 'error',
        duration: 5 * 1000
      });
      
      // 401: 未登录或token过期
      if (res.code === 401) {
        ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const userStore = useUserStore();
          userStore.logout();
          location.reload(); // 刷新页面
        });
      }
      
      return Promise.reject(new Error(res.message || '系统错误'));
    } else {
      return res;
    }
  },
  (error) => {
    console.error('响应错误', error);
    
    // 显示错误消息
    ElMessage({
      message: error.message || '请求失败',
      type: 'error',
      duration: 5 * 1000
    });
    
    return Promise.reject(error);
  }
);

// 封装GET请求
export function get<T>(url: string, params?: any): Promise<T> {
  return service.get(url, { params });
}

// 封装POST请求
export function post<T>(url: string, data?: any): Promise<T> {
  return service.post(url, data);
}

// 封装PUT请求
export function put<T>(url: string, data?: any): Promise<T> {
  return service.put(url, data);
}

// 封装DELETE请求
export function del<T>(url: string, params?: any): Promise<T> {
  return service.delete(url, { params });
}

export default service; 