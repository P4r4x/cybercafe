import React from 'react'
import { ToastMessage, ToastColors } from './types'
import { useThemeConfig } from '@/hooks/useTheme'
import { 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react'

// 单个Toast组件的Props
interface ToastItemProps {
  toast: ToastMessage
  onRemove: (id: string) => void
  colors: ToastColors
}

// Toast单个组件
export const ToastItem: React.FC<ToastItemProps> = ({ 
  toast, 
  onRemove, 
  colors 
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    // 快速浮现动画
    const enterTimer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    // 自动消失定时器
    let exitTimer: NodeJS.Timeout
    if (!toast.persistent) {
      exitTimer = setTimeout(() => {
        handleRemove()
      }, toast.duration || 3000)
    }

    return () => {
      clearTimeout(enterTimer)
      if (exitTimer) clearTimeout(exitTimer)
    }
  }, [toast.duration, toast.persistent])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // 等待淡出动画完成
  }

  // 获取图标
  const getIcon = () => {
    const iconClass = "w-4 h-4 flex-shrink-0"
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={iconClass} />
      case 'error':
        return <AlertCircle className={iconClass} />
      case 'warning':
        return <AlertTriangle className={iconClass} />
      case 'info':
        return <Info className={iconClass} />
      default:
        return <Info className={iconClass} />
    }
  }

  return (
    <div
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
        min-w-[280px] max-w-md transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}
        ${isExiting ? 'opacity-0 scale-95 -translate-y-2' : ''}
      `}
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      {/* 图标 */}
      <div style={{ color: colors.icon }}>
        {getIcon()}
      </div>

      {/* 消息内容 */}
      <div className="flex-1 text-sm font-medium leading-tight">
        {toast.message}
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={handleRemove}
        className="ml-2 p-1 rounded-md hover:bg-white/10 transition-colors duration-200"
        style={{ color: colors.icon }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// Toast容器组件的Props
interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
  position?: string
}

// Toast容器组件
export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  onRemove,
  position = 'fixed inset-0 flex items-center justify-center'
}) => {
  const { config, isDark } = useThemeConfig()

  // 获取Toast颜色配置
  const getToastColors = (type: ToastMessage['type']): ToastColors => {
    switch (type) {
      case 'success':
        return {
          background: isDark ? 'rgba(96, 165, 96, 0.85)' : 'rgba(134, 196, 134, 0.9)', // 更柔和的绿色
          text: '#FFFFFF',
          border: isDark ? 'rgba(96, 165, 96, 0.25)' : 'rgba(134, 196, 134, 0.15)',
          icon: '#FFFFFF'
        }
      
      case 'error':
        // 错误固定为更柔和的黄色
        return {
          background: 'rgba(217, 180, 89, 0.9)', // 更柔和的黄色
          text: '#FFFFFF',
          border: 'rgba(217, 180, 89, 0.25)',
          icon: '#FFFFFF'
        }
      
      case 'warning':
        // 警告固定为更柔和的红色
        return {
          background: 'rgba(220, 102, 102, 0.9)', // 更柔和的红色
          text: '#FFFFFF',
          border: 'rgba(220, 102, 102, 0.25)',
          icon: '#FFFFFF'
        }
      
      case 'info':
      default:
        return {
          background: isDark 
            ? 'rgba(107, 154, 198, 0.85)' // 更柔和的蓝色
            : 'rgba(147, 179, 207, 0.9)', 
          text: '#FFFFFF',
          border: isDark 
            ? 'rgba(107, 154, 198, 0.25)' 
            : 'rgba(147, 179, 207, 0.15)',
          icon: '#FFFFFF'
        }
    }
  }

  return (
    <div 
      className={`z-50 ${position}`}
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
            colors={getToastColors(toast.type)}
          />
        ))}
      </div>
    </div>
  )
}