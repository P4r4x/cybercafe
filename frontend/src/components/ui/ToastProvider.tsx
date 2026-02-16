import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastMessage, ToastContextType, ToastType, DEFAULT_TOAST_CONFIG } from './types'
import { ToastContainer } from './Toast'

// Toast上下文
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// ToastProvider的Props
interface ToastProviderProps {
  children: ReactNode
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-center' | 'top-right' | 'top-left' | 'bottom-center'
}

// Toast提供者组件
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = DEFAULT_TOAST_CONFIG.maxToasts,
  defaultDuration = DEFAULT_TOAST_CONFIG.defaultDuration,
  position = DEFAULT_TOAST_CONFIG.position
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Console日志输出
  const logToConsole = useCallback((type: ToastType, message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = `[${timestamp}] Toast:`
    
    switch (type) {
      case 'error':
        console.error(`${prefix} ${message}`, { type: 'error', timestamp })
        break
      case 'warning':
        console.warn(`${prefix} ${message}`, { type: 'warning', timestamp })
        break
      case 'success':
        console.log(`%c${prefix} ${message}`, 'color: green', { type: 'success', timestamp })
        break
      case 'info':
      default:
        console.log(`${prefix} ${message}`, { type: 'info', timestamp })
        break
    }
  }, [])

  // 添加Toast
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId()
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration
    }

    // 输出到Console
    logToConsole(toast.type, toast.message)

    setToasts(prevToasts => {
      // 如果超过最大数量，移除最旧的
      const filteredToasts = prevToasts.length >= maxToasts 
        ? prevToasts.slice(1) 
        : prevToasts
      
      return [...filteredToasts, newToast]
    })

    return id
  }, [generateId, defaultDuration, maxToasts, logToConsole])

  // 移除Toast
  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  // 清空所有Toast
  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // 便捷方法
  const success = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'success', message, duration })
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'error', message, duration })
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'warning', message, duration })
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'info', message, duration })
  }, [addToast])

  // 获取位置样式
  const getPositionClass = () => {
    switch (position) {
      case 'top-center':
        return 'fixed inset-0 flex items-center justify-center'
      case 'top-right':
        return 'fixed top-4 right-4'
      case 'top-left':
        return 'fixed top-4 left-4'
      case 'bottom-center':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'fixed inset-0 flex items-center justify-center'
    }
  }

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <ToastContainer
          toasts={toasts}
          onRemove={removeToast}
          position={getPositionClass()}
        />
      )}
    </ToastContext.Provider>
  )
}

// 使用Toast的Hook
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// 便捷的全局Toast Hook（不需要Provider）
export const useToastSimple = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId()
    const newToast: ToastMessage = { ...toast, id }
    
    // Console日志输出
    const timestamp = new Date().toLocaleTimeString()
    const prefix = `[${timestamp}] Toast:`
    
    switch (toast.type) {
      case 'error':
        console.error(`${prefix} ${toast.message}`, { type: 'error', timestamp })
        break
      case 'warning':
        console.warn(`${prefix} ${toast.message}`, { type: 'warning', timestamp })
        break
      case 'success':
        console.log(`%c${prefix} ${toast.message}`, 'color: green', { type: 'success', timestamp })
        break
      case 'info':
      default:
        console.log(`${prefix} ${toast.message}`, { type: 'info', timestamp })
        break
    }

    setToasts(prev => [...prev.slice(-4), newToast]) // 最多保留5个
    
    // 自动移除
    if (!toast.persistent) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toast.duration || 3000)
    }

    return id
  }, [generateId])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'success', message, duration })
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'error', message, duration })
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'warning', message, duration })
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'info', message, duration })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearAll: () => setToasts([]),
    success,
    error,
    warning,
    info
  }
}