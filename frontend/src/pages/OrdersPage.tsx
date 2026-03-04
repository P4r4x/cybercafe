import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useThemeConfig } from '@/hooks/useTheme'
import { useOrderHistory } from '@/hooks/useOrderHistory'
import { useUnpaidOrders } from '@/hooks/useUnpaidOrders'
import { useOrder } from '@/hooks/useOrder'
import { useToast } from '@/components/ui'
import { OrderCard, OrderListSkeleton } from '@/components/order'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OrderHistory } from '@/types/order'

export default function OrdersPage() {
  const { config } = useThemeConfig()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [page, setPage] = useState(1)
  const [showUnpaid, setShowUnpaid] = useState(true)
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { orders, totalPages, loading: historyLoading, refetch: refetchHistory } = useOrderHistory(page)
  const { unpaidOrders, loading: unpaidLoading, refetch: refetchUnpaid } = useUnpaidOrders()
  const { cancelOrder } = useOrder()

  const loading = historyLoading || unpaidLoading

  const handleRefresh = () => {
    refetchHistory()
    refetchUnpaid()
  }

  const handlePay = (order: OrderHistory) => {
    const orderData = {
      orderId: String(order.id),
      expiredAt: order.expired_at,
      items: order.items.map(item => {
        const itemTotal = parseFloat(item.base_price) * item.quantity
        const extraTotal = item.options.reduce((sum, opt) => sum + parseFloat(opt.extra_price), 0)
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          total_price: (itemTotal + extraTotal) * item.quantity,
          options: item.options.map(opt => ({
            option_code: opt.option_code,
            values: [opt.option_value]
          }))
        }
      }),
      totalAmount: parseFloat(order.total_amount)
    }
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData))
    navigate('/payment')
  }

  const handleCancel = (orderId: number) => {
    setCancelTargetId(orderId)
    setShowCancelDialog(true)
  }

  const confirmCancel = async () => {
    if (!cancelTargetId) return
    setIsCancelling(true)
    try {
      await cancelOrder(String(cancelTargetId))
      success('订单已取消')
      handleRefresh()
    } catch (err: any) {
      error(err.message || '取消失败')
    } finally {
      setIsCancelling(false)
      setShowCancelDialog(false)
      setCancelTargetId(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen pt-8 pb-8"
      style={{ backgroundColor: config.background.surface }}
    >
      <div className="max-w-3xl w-full px-6">
        <h1
          className="text-3xl font-bold mb-6 flex items-center"
          style={{ color: config.text.title }}
        >
          <ShoppingCart className="w-8 h-8 mr-3" />
          我的订单
        </h1>

        {loading ? (
          <OrderListSkeleton count={5} />
        ) : (
          <>
            {unpaidOrders.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowUnpaid(!showUnpaid)}
                  className="w-full flex items-center justify-between p-3 rounded-xl mb-2 transition-all duration-200"
                  style={{
                    backgroundColor: config.status.warning + '15',
                    border: `1px solid ${config.status.warning}30`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} style={{ color: config.status.warning }} />
                    <span style={{ color: config.status.warning }} className="font-medium">
                      待支付订单 ({unpaidOrders.length})
                    </span>
                  </div>
                  {showUnpaid ? (
                    <ChevronUp size={18} style={{ color: config.status.warning }} />
                  ) : (
                    <ChevronDown size={18} style={{ color: config.status.warning }} />
                  )}
                </button>

                {showUnpaid && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: config.background.secondary }}>
                    {unpaidOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onPay={handlePay}
                        onCancel={handleCancel}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {orders.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl"
                style={{
                  backgroundColor: config.background.secondary,
                  border: `1px solid ${config.border.light}`
                }}
              >
                <ShoppingCart
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: config.text.muted }}
                />
                <p style={{ color: config.text.muted }}>暂无订单记录</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <span style={{ color: config.text.secondary }} className="text-sm">
                    历史订单 ({orders.length})
                  </span>
                </div>
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPay={handlePay}
                    onCancel={handleCancel}
                  />
                ))}
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={showCancelDialog}
        title="取消订单"
        message="确定要取消该订单吗？取消后无法恢复。"
        confirmText="确定取消"
        cancelText="返回"
        type="danger"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelDialog(false)}
        loading={isCancelling}
      />
    </div>
  )
}
