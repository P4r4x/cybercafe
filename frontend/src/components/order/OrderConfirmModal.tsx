import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, Clock, CheckCircle } from 'lucide-react'
import { useCart } from '@/hooks/cartContext'
import { useThemeConfig } from '@/hooks/useTheme'
import { useOrder, SubmitResponse } from '@/hooks/useOrder'

interface OrderConfirmModalProps {
  onClose: () => void
  onSuccess?: (data: { orderId: number; expiredAt: string }) => void
}

export const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { config } = useThemeConfig()
  const { items, totalPrice } = useCart()
  const { submitOrder, confirmOrder, formatOptionText } = useOrder()

  const [isExiting, setIsExiting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(15 * 60)
  const [submitData, setSubmitData] = useState<SubmitResponse | null>(null)
  const orderSubmittedRef = useRef(false)

  useEffect(() => {
    if (orderSubmittedRef.current) return

    const initOrder = async () => {
      try {
        const data = await submitOrder()
        setSubmitData(data)
        // 使用 requestAnimationFrame 确保 DOM 渲染后再触发动画
        requestAnimationFrame(() => {
          setIsOpen(true)
        })
        orderSubmittedRef.current = true
      } catch (err: any) {
        onClose()
      }
    }
    initOrder()
  }, [submitOrder, onClose])

  const handleExpire = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  useEffect(() => {
    if (!isOpen || isExiting) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, isExiting, handleExpire])

  const handleConfirm = async () => {
    if (!submitData) return

    setIsSubmitting(true)
    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        options: Object.entries(item.selectedOptions)
          .map(([optionId, indices]) => {
            const option = item.product.options.find(o => o.id === Number(optionId))
            return {
              option_code: option?.option_code || '',
              values: indices.map(idx => option?.values?.[idx]?.value || '').filter(Boolean)
            }
          })
          .filter(opt => opt.option_code && opt.values.length > 0)
      }))

      const confirmResponse = await confirmOrder(orderItems, submitData.result, submitData.token)
      setIsExiting(true)
      setTimeout(() => {
        onClose()
        onSuccess?.({ orderId: confirmResponse.order_id, expiredAt: confirmResponse.expired_at })
      }, 300)
    } catch (err: any) {
      setIsExiting(true)
      setTimeout(() => {
        onClose()
      }, 300)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!submitData && !isExiting) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ease-out pointer-events-auto p-4"
      style={{
        backgroundColor: isOpen && !isExiting ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
        pointerEvents: isOpen && !isExiting ? 'auto' : 'none'
      }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden transition-transform duration-300 ease-out"
        style={{
          backgroundColor: config.background.surface,
          transform: isOpen && !isExiting ? 'translateY(0)' : 'translateY(100vh)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: config.border.light }}>
          <div className="flex items-center gap-2">
            <Clock size={20} style={{ color: countdown < 60 ? '#EF4444' : config.text.primary }} />
            <span
              className="font-medium"
              style={{ color: countdown < 60 ? '#EF4444' : config.text.primary }}
            >
              剩余 {formatTime(countdown)}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: config.background.secondary }}
          >
            <X size={20} style={{ color: config.text.primary }} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="space-y-3">
            {items.map((item, index) => {
              const optionKey = Object.entries(item.selectedOptions)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([optionId, indices]) => `${optionId}:${indices.sort((a, b) => a - b).join(',')}`)
                .join(';')

              return (
                <div
                  key={`${item.product.id}_${optionKey}_${index}`}
                  className="flex gap-3"
                >
                  <img
                    src={item.product.image_url || '/assets/default.png'}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-sm line-clamp-1"
                      style={{ color: config.text.primary }}
                    >
                      {item.product.name}
                    </h4>
                    <p
                      className="text-xs line-clamp-1 mt-0.5"
                      style={{ color: config.text.secondary }}
                    >
                      {formatOptionText(item)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: config.text.muted }}>
                        x{item.quantity}
                      </span>
                      <span
                        className="font-medium text-sm"
                        style={{ color: config.price.primary }}
                      >
                        ¥{item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t space-y-4" style={{ borderColor: config.border.light }}>
          <div className="flex items-center justify-between">
            <span className="text-base" style={{ color: config.text.secondary }}>
              合计
            </span>
            <div
              className="text-2xl font-bold"
              style={{ color: config.price.primary }}
            >
              ¥{totalPrice.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl font-medium text-base transition-all hover:opacity-80"
              style={{
                backgroundColor: config.background.secondary,
                color: config.text.primary
              }}
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || countdown <= 0}
              className="flex-1 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: config.status.info,
                color: 'white'
              }}
            >
              {isSubmitting ? '确认中...' : '确认订单'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
