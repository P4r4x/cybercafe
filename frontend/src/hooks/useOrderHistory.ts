import { useState, useEffect, useRef, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { OrderHistory, HistoryResponse } from '@/types/order'

export const useOrderHistory = (page: number = 1) => {
  const { get } = useApi()
  const getRef = useRef(get)
  getRef.current = get

  const [orders, setOrders] = useState<OrderHistory[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getRef.current<HistoryResponse>('/orders/history', { page: String(page) })
        setOrders(response.history || [])
        setTotalPages(response.total_pages || 0)
      } catch (err: any) {
        setError(err.message || '获取订单失败')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [page, refreshKey])

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return {
    orders,
    totalPages,
    loading,
    error,
    refetch
  }
}
