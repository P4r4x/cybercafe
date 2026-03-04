import React from 'react'
import { Clock, Package } from 'lucide-react'
import { useThemeConfig } from '@/hooks/useTheme'
import { OrderHistory, statusLabels, OrderStatus } from '@/types/order'

interface OrderCardProps {
  order: OrderHistory
  onPay?: (order: OrderHistory) => void
  onCancel?: (orderId: number) => void
}

const getStatusColor = (status: OrderStatus, config: ReturnType<typeof useThemeConfig>['config']) => {
  switch (status) {
    case 'paid':
      return config.status.success
    case 'created':
      return config.status.warning
    case 'canceled':
    case 'expired':
      return config.status.error
    default:
      return config.text.muted
  }
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPay, onCancel }) => {
  const { config, isDark } = useThemeConfig()
  const statusColor = getStatusColor(order.status, config)
  const isUnpaid = order.status === 'created'

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: string) => {
    return `¥${parseFloat(price).toFixed(2)}`
  }

  const calculateItemPrice = (item: { base_price: string; options: { extra_price: string }[] }): string => {
    const basePrice = parseFloat(item.base_price)
    const extraTotal = item.options.reduce((sum, opt) => sum + parseFloat(opt.extra_price), 0)
    return String(basePrice + extraTotal)
  }

  const formatExpiredTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    if (isToday) return `今天 ${timeStr}`
    if (isTomorrow) return `明天 ${timeStr}`
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + timeStr
  }

  return (
    <div
      className="rounded-xl p-4 mb-3 transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: config.text.muted }} />
          <span style={{ color: config.text.secondary, fontSize: '14px' }}>
            订单 #{order.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: config.text.muted }} />
          <span style={{ color: config.text.muted, fontSize: '12px' }}>
            {formatTime(order.created_at)}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: isDark ? `${statusColor}20` : `${statusColor}15`,
              color: statusColor
            }}
          >
            {statusLabels[order.status]}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex-1">
              <span style={{ color: config.text.primary }} className="text-sm">
                {item.product_name}
              </span>
              <span style={{ color: config.text.muted }} className="text-xs ml-2">
                x{item.quantity}
              </span>
              {item.options.length > 0 && (
                <span style={{ color: config.text.muted }} className="text-xs ml-2">
                  ({item.options.map(o => o.option_value).join(', ')})
                </span>
              )}
            </div>
            <span style={{ color: config.text.secondary }} className="text-sm">
              {formatPrice(calculateItemPrice(item))}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: config.border.light }}>
        <span style={{ color: config.text.primary }} className="font-medium">
          合计: <span style={{ color: config.price.primary }}>{formatPrice(order.total_amount)}</span>
        </span>
      </div>

      {isUnpaid && (
        <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: config.border.light }}>
          <div className="flex items-center gap-1 text-sm" style={{ color: config.status.warning }}>
            <Clock size={14} />
            <span>过期时间: {formatExpiredTime(order.expired_at)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onCancel?.(order.id)}
              className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
              style={{
                border: `1px solid ${config.border.medium}`,
                color: config.text.secondary,
                backgroundColor: 'transparent'
              }}
            >
              取消订单
            </button>
            <button
              onClick={() => onPay?.(order)}
              className="px-3 py-1.5 rounded-lg text-sm text-white transition-all duration-200"
              style={{
                background: config.gradient.primary
              }}
            >
              立即支付
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
