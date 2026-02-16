// Toast类型定义
export type ToastType = 'info' | 'warning' | 'error' | 'success'

// Toast消息接口
export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number  // 显示时长，默认3000ms
  persistent?: boolean // 是否持久显示，默认false
}

// Toast配置接口
export interface ToastConfig {
  maxToasts: number     // 最大同时显示的Toast数量
  defaultDuration: number // 默认显示时长
  position: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' // 显示位置
}

// Toast上下文接口
export interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (message: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

// Toast颜色配置接口
export interface ToastColors {
  background: string
  text: string
  border: string
  icon: string
}

// Toast位置配置
export const TOAST_POSITIONS = {
  'top-center': 'fixed inset-0 flex items-center justify-center',
  'top-right': 'fixed top-4 right-4',
  'top-left': 'fixed top-4 left-4',
  'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2',
} as const

// 默认配置
export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  maxToasts: 5,
  defaultDuration: 3000,
  position: 'top-center'
}