import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'

// API请求配置
interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, string>
}

// API响应处理
interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

// 统一的API请求Hook
export const useApi = () => {
  const navigate = useNavigate()
  const { error } = useToast()

  // 获取完整的API URL
  const getApiUrl = (endpoint: string) => {
    const API_BASE = import.meta.env.VITE_API_BASE
    // 确保endpoint以/开头
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${API_BASE}${cleanEndpoint}`
  }

  // 处理认证失败
  const handleAuthError = () => {
    console.warn('Authentication failed, redirecting to login')
    // 清除本地存储的认证信息
    localStorage.removeItem('cybercafe_user')
    localStorage.removeItem('cybercafe_token')
    // 跳转到登录页
    navigate('/login', { replace: true })
    // 显示错误提示
    error('认证失败，请重新登录')
  }

  // 统一的API请求方法
  const apiRequest = async <T = any>(
    endpoint: string, 
    config: ApiConfig = {}
  ): Promise<T> => {
    const {
      method = 'GET',
      headers = {},
      body,
      params
    } = config

    // 构建URL（带查询参数）
    let url = getApiUrl(endpoint)
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      url += `?${searchParams.toString()}`
    }

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    // 添加Authorization头（如果有token）
    const token = localStorage.getItem('cybercafe_token')
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }

    // 准备请求配置
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // 确保发送cookies
      body: body ? JSON.stringify(body) : undefined
    }

    try {
      console.log(`API Request: ${method} ${url}`)
      
      const response = await fetch(url, requestConfig)
      
      console.log(`API Response: ${response.status} ${response.statusText}`)

      // 处理401认证错误
      if (response.status === 401) {
        handleAuthError()
        throw new Error('认证失败')
      }

      // 处理其他HTTP错误
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        
        let errorMessage = `请求失败 (${response.status})`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch {
          // 如果不是JSON格式，使用默认错误信息
        }
        
        throw new Error(errorMessage)
      }

      // 解析响应数据
      const data = await response.json()
      console.log('API Response Data:', data)
      
      return data

    } catch (err: any) {
      console.error('API Request Failed:', err)
      
      // 如果是认证错误，已经处理了跳转，直接抛出
      if (err.message === '认证失败') {
        throw err
      }
      
      // 其他错误显示Toast提示
      error(err.message || '网络请求失败')
      throw err
    }
  }

  // 便捷方法
  const get = <T = any>(endpoint: string, params?: Record<string, string>) => 
    apiRequest<T>(endpoint, { method: 'GET', params })

  const post = <T = any>(endpoint: string, body?: any, params?: Record<string, string>) => 
    apiRequest<T>(endpoint, { method: 'POST', body, params })

  const put = <T = any>(endpoint: string, body?: any, params?: Record<string, string>) => 
    apiRequest<T>(endpoint, { method: 'PUT', body, params })

  const del = <T = any>(endpoint: string, params?: Record<string, string>) => 
    apiRequest<T>(endpoint, { method: 'DELETE', params })

  // 导出API方法
  return {
    // 通用请求方法
    request: apiRequest,
    
    // HTTP方法封装
    get,
    post,
    put,
    delete: del
  }
}