import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useThemeConfig } from '@/hooks/useTheme'

interface ConfirmDialogProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 标题 */
  title?: string
  /** 内容描述 */
  message: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 确认按钮回调 */
  onConfirm: () => void | Promise<void>
  /** 取消按钮回调 */
  onCancel: () => void
  /** 确认按钮是否加载中 */
  loading?: boolean
  /** 确认按钮类型 */
  type?: 'danger' | 'warning' | 'primary'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  loading = false,
  type = 'primary'
}) => {
  const { config, isDark } = useThemeConfig()
  const [confirmHover, setConfirmHover] = useState(false)
  const [cancelHover, setCancelHover] = useState(false)
  const [closeHover, setCloseHover] = useState(false)

  if (!open) return null

  // 获取确认按钮样式
  const getConfirmButtonStyle = () => {
    const baseStyle = {
      padding: '8px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: loading ? 0.7 : 1
    }

    if (isDark) {
      // 夜间模式样式
      switch (type) {
        case 'danger':
          return {
            ...baseStyle,
            background: confirmHover && !loading ? '#B91C1C' : '#DC2626',
            color: '#FFFFFF'
          }
        case 'warning':
          return {
            ...baseStyle,
            background: confirmHover && !loading ? '#B45309' : '#D97706',
            color: '#FFFFFF'
          }
        default: // primary
          return {
            ...baseStyle,
            background: confirmHover && !loading ? '#C2410C' : '#EA580C',
            color: '#FFFFFF'
          }
      }
    } else {
      // 日间模式样式 - 使用樱色/橙色系
      switch (type) {
        case 'danger':
          return {
            ...baseStyle,
            background: confirmHover && !loading ? '#DC2626' : '#EF4444',
            color: '#FFFFFF'
          }
        case 'warning':
          return {
            ...baseStyle,
            background: confirmHover && !loading ? '#D97706' : '#F59E0B',
            color: '#FFFFFF'
          }
        default: // primary - 樱色/橙色
          return {
            ...baseStyle,
            background: confirmHover && !loading ? '#F43F5E' : '#FB7185',
            color: '#FFFFFF'
          }
      }
    }
  }

  // 取消按钮样式
  const getCancelButtonStyle = () => ({
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    border: `1px solid ${config.border.light}`,
    background: cancelHover ? config.background.secondary : 'transparent',
    color: cancelHover ? config.text.primary : config.text.secondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })

  // 关闭按钮样式
  const getCloseButtonStyle = () => ({
    color: closeHover ? config.text.primary : config.text.muted,
    transition: 'color 0.2s ease'
  })

  const handleConfirm = async () => {
    if (loading) return
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* 弹窗主体 */}
      <div 
        className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6"
        style={{
          background: config.background.surface,
          border: `1px solid ${config.border.light}`
        }}
      >
        {/* 关闭按钮 */}
        <button
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={getCloseButtonStyle()}
          onClick={onCancel}
          disabled={loading}
          onMouseEnter={() => setCloseHover(true)}
          onMouseLeave={() => setCloseHover(false)}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <h3 
          className="text-lg font-semibold mb-3 pr-8"
          style={{ color: config.text.primary }}
        >
          {title}
        </h3>

        {/* 内容 */}
        <p 
          className="text-sm leading-relaxed mb-6"
          style={{ color: config.text.secondary }}
        >
          {message}
        </p>

        {/* 按钮组 */}
        <div className="flex justify-end gap-3">
          {/* 取消按钮 */}
          <button
            style={getCancelButtonStyle()}
            onClick={onCancel}
            disabled={loading}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
          >
            {cancelText}
          </button>

          {/* 确认按钮 */}
          <button
            style={getConfirmButtonStyle()}
            onClick={handleConfirm}
            disabled={loading}
            onMouseEnter={() => setConfirmHover(true)}
            onMouseLeave={() => setConfirmHover(false)}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderTopColor: 'currentColor',
                    borderRightColor: 'transparent',
                    borderBottomColor: 'currentColor',
                    borderLeftColor: 'transparent'
                  }}
                />
                {confirmText}
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 确认弹窗 Hook
 * 提供简单的调用方式
 */
export const useConfirmDialog = () => {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'primary'
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
  }>({
    open: false,
    message: ''
  })

  const confirm = (options: {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'primary'
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
  }) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        open: true,
        ...options,
        onCancel: () => {
          options.onCancel?.()
          setDialog({ open: false, message: '' })
          resolve(false)
        },
        onConfirm: async () => {
          await options.onConfirm()
          setDialog({ open: false, message: '' })
          resolve(true)
        }
      })
    })
  }

  const DialogComponent = () => {
    const handleClose = () => {
      dialog.onCancel?.()
      setDialog({ open: false, message: '' })
    }

    return (
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        type={dialog.type}
        onConfirm={dialog.onConfirm || handleClose}
        onCancel={handleClose}
      />
    )
  }

  return {
    confirm,
    DialogComponent
  }
}

export default ConfirmDialog