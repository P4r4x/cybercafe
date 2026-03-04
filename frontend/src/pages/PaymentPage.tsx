import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, Wallet, Timer, Check } from 'lucide-react'
import { useThemeConfig } from '@/hooks/useTheme'
import { useOrder } from '@/hooks/useOrder'
import { useCart } from '@/hooks/cartContext'
import { useToast } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface OrderItemData {
  product_id: number
  product_name: string
  image_url?: string
  quantity: number
  total_price: number
}

interface OrderData {
  orderId: string
  expiredAt: string
  items: OrderItemData[]
  totalAmount: number
}

type PaymentState = 'idle' | 'processing' | 'success' | 'failed'

export default function PaymentPage() {
  const { config } = useThemeConfig()
  const navigate = useNavigate()
  const location = useLocation()
  const { cancelOrder, payWithBalance } = useOrder()
  const { clearCart } = useCart()
  const { success, error: showError } = useToast()

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const isPayingRef = useRef(false)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const expiredTimestampRef = useRef<number>(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  /* 初始化订单 */
  useEffect(() => {
    const pendingOrderStr = sessionStorage.getItem('pendingOrder')

    if (pendingOrderStr) {
      try {
        const data = JSON.parse(pendingOrderStr) as OrderData
        if (data?.items?.length) setOrderData(data)
        else navigate('/home')
      } catch {
        navigate('/home')
      }
    } else {
      const data = location.state as OrderData
      if (data?.items?.length) setOrderData(data)
      else navigate('/home')
    }

    return () => {
      // 清理计时器
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
      // 清空购物车: 用户离开支付页面时（无论是导航、支付成功、超时还是取消）都清空购物车
      // 避免购物车残留数据导致下次点单时出现无效选项
      clearCart()
    }
  }, [navigate, location.state, clearCart])

  /* 倒计时 */
  const handleCountdownEnd = useCallback(async () => {
    if (countdownRef.current) clearInterval(countdownRef.current)

    if (orderData?.orderId) {
      try {
        await cancelOrder(orderData.orderId)
      } catch {}
    }

    sessionStorage.removeItem('pendingOrder')
    success('超时：订单已自动取消')
    navigate('/home')
  }, [orderData, cancelOrder, success, navigate])

  useEffect(() => {
    if (!orderData) return

    const expiredTime = new Date(orderData.expiredAt).getTime()
    if (isNaN(expiredTime)) return

    expiredTimestampRef.current = expiredTime

    const update = () => {
      const remain = Math.ceil(
        (expiredTimestampRef.current - Date.now()) / 1000
      )

      if (remain <= 0) {
        handleCountdownEnd()
        return
      }

      setCountdown(remain)
    }

    update()
    countdownRef.current = setInterval(update, 1000)

    const handleVisibility = () => {
      if (!document.hidden) update()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [orderData, handleCountdownEnd])

  /* 支付 */
  const handlePay = async () => {
    if (!selectedPayment) return
    if (isPayingRef.current) return
    if (!orderData?.orderId) return

    isPayingRef.current = true
    setPaymentState('processing')

    try {
      if (selectedPayment === 'balance') {
        await payWithBalance(orderData.orderId)
        success('支付成功')
        navigate('/home')
      } else {
        await new Promise(resolve => setTimeout(resolve, 800))
        startPolling()
      }
    } catch (err: any) {
      setPaymentState('failed')
      console.error('支付失败:', err.message)
    } finally {
      isPayingRef.current = false
    }
  }

  const startPolling = () => {
    let attempts = 0

    pollRef.current = setInterval(() => {
      attempts++

      if (attempts >= 3) {
        clearInterval(pollRef.current!)
        setPaymentState('success')
        isPayingRef.current = false
        success('支付成功')
        navigate('/home')
      }
    }, 2000)
  }

  /* 取消订单 */
  const confirmCancel = useCallback(async () => {
    if (!orderData?.orderId) return
    setIsCancelling(true)

    try {
      await cancelOrder(orderData.orderId)
      success('订单已取消')
      navigate('/home')
    } catch (err: any) {
      showError(err.message || '取消失败')
    } finally {
      setIsCancelling(false)
      setShowCancelDialog(false)
    }
  }, [orderData, cancelOrder, success, showError, navigate])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!orderData) return null

  return (
    <div
      className="min-h-screen px-12 py-14"
      style={{ backgroundColor: config.background.surface }}
    >
        <div className="max-w-6xl mx-auto space-y-8">

          {/* 标题 */}
          <div>
            <h1
              className="text-2xl font-bold tracking-wide mb-4"
              style={{ color: config.text.primary }}
            >
              支付订单
            </h1>

            {/* 分割线 */}
            <div
              className="border-b mb-6"
              style={{ borderColor: config.border.light }}
            />

            {/* 倒计时板块 */}
            <div
              className="border rounded-lg p-5 flex items-center gap-4"
              style={{
                borderColor: config.status.warning,
                backgroundColor: `${config.status.warning}10`
              }}
            >
              <Timer size={20} style={{ color: config.status.warning }} />
              <div className="flex flex-col text-sm">
                <span style={{ color: config.text.primary }}>
                  请在
                  <span
                    className="mx-1 font-semibold"
                    style={{ color: config.status.warning }}
                  >
                    {formatTime(countdown)}
                  </span>
                  内完成支付
                </span>
                <span style={{ color: config.text.secondary }}>
                  超时将自动取消
                </span>
              </div>
            </div>
          </div>

          {/* 主体 */}
          <div className="grid grid-cols-3 gap-14">

            {/* 左侧订单 */}
            <div className="col-span-2 border rounded-lg"
              style={{
                borderColor: config.border.light,
                backgroundColor: config.background.secondary
              }}
            >
              {orderData.items.map((item, index) => (
                <div
                  key={index}
                  className="px-6 py-5 flex justify-between items-center border-b"
                  style={{ borderColor: config.border.light }}
                >
                  <div className="flex items-center gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <div style={{ color: config.text.primary }}>
                        {item.product_name}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: config.text.secondary }}
                      >
                        数量 ×{item.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: config.text.primary }}>
                    ¥{item.total_price.toFixed(2)}
                  </div>
                </div>
              ))}

              <div
                className="px-6 py-4 flex justify-between font-semibold"
                style={{ color: config.text.primary }}
              >
                <span>合计</span>
                <span>¥{orderData.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* 右侧支付 */}
            <div className="border rounded-lg p-6 space-y-4"
              style={{
                borderColor: config.border.light,
                backgroundColor: config.background.secondary
              }}
            >

              {['third', 'balance'].map(type => {
                const isSelected = selectedPayment === type
                const label = type === 'third' ? '第三方支付' : '余额支付'
                const Icon = type === 'third' ? CreditCard : Wallet

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedPayment(type)}
                    className="w-full flex items-center justify-between px-4 py-3 border rounded transition"
                    style={{
                      borderColor: isSelected
                        ? config.status.info
                        : config.border.light,
                      backgroundColor: isSelected
                        ? `${config.status.info}10`
                        : config.background.surface,
                      color: isSelected
                        ? config.status.info
                        : config.text.primary
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      {label}
                    </div>

                    {/* {isSelected && (
                      <div className="flex items-center gap-1 text-sm">
                        <Check size={16} />
                        已选
                      </div>
                    )} */}
                  </button>
                )
              })}

              <button
                onClick={handlePay}
                disabled={!selectedPayment || paymentState === 'processing'}
                className="w-full py-3 rounded font-semibold mt-4"
                style={{
                  backgroundColor: config.status.info,
                  color: 'white',
                  opacity:
                    !selectedPayment || paymentState === 'processing'
                      ? 0.6
                      : 1
                }}
              >
                {paymentState === 'processing'
                  ? '处理中...'
                  : '确认支付'}
              </button>

              <button
                onClick={() => setShowCancelDialog(true)}
                className="w-full py-2 border rounded text-sm"
                style={{
                  borderColor: config.status.error,
                  color: config.status.error
                }}
              >
                取消订单
              </button>
            </div>

            <ConfirmDialog
              open={showCancelDialog}
              title="取消订单"
              message="确定要取消该订单吗？"
              confirmText="确定取消"
              cancelText="返回"
              type="danger"
              onConfirm={confirmCancel}
              onCancel={() => setShowCancelDialog(false)}
              loading={isCancelling}
            />
          </div>
        </div>
    </div>
  )
}
