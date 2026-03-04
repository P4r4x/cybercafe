import { useState, useEffect, useRef, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { OrderHistory } from '@/types/order'

interface UnpaidResponse {
  orders: OrderHistory[]
}

export const useUnpaidOrders = () => {
  const { get } = useApi()
  const getRef = useRef(get)
  getRef.current = get

  const [unpaidOrders, setUnpaidOrders] = useState<OrderHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchUnpaidOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getRef.current<UnpaidResponse>('/orders/unpaid')
        setUnpaidOrders(response.orders || [])
      } catch (err: any) {
        setError(err.message || '获取未支付订单失败')
      } finally {
        setLoading(false)
      }
    }
    fetchUnpaidOrders()
  }, [refreshKey])

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return {
    unpaidOrders,
    loading,
    error,
    refetch
  }
}
