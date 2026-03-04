import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'
import { useCart, CartItem, getOptionText } from '@/hooks/cartContext'
import { useApi } from '@/hooks/useApi'

export interface OrderItem {
  product_id: number
  quantity: number
  options: {
    option_code: string
    values: string[]
  }[]
}

export interface SubmitResponse {
  result: {
    total_amount: string
    items: {
      product_id: number
      quantity: number
      unit_price: string
      total_price: string
    }[]
  }
  token: string
}

export interface ConfirmResponse {
  order_id: string
  expired_at: string
  result: {
    total_amount: string
  }
}

export interface CancelRequest {
  order_id: number
}

export interface PriceItemDetail {
  product_id: number
  quantity: number
  base_price: string
  options: Array<{
    option_code: string
    option_value: string
    extra_price: string
  }>
  item_amount: string
}

export interface PriceResult {
  items: PriceItemDetail[]
  subtotal: string
  total: string
  currency: string
  breakdown?: Record<string, string>
}

export const useOrder = () => {
  const navigate = useNavigate()
  const { error } = useToast()
  const { items, totalPrice } = useCart()
  const { post } = useApi()

  const submitOrder = useCallback(async () => {
    const orderItems: OrderItem[] = items.map(item => ({
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

    try {
      const response = await post('/orders/submit', { items: orderItems })
      return response as Promise<SubmitResponse>
    } catch (err: any) {
      throw new Error(err.message || '提交订单失败')
    }
  }, [items, post])

  const confirmOrder = useCallback(async (
    order: OrderItem[],
    result: SubmitResponse['result'],
    token: string
  ) => {
    try {
      const response = await post('/orders/confirm', { order: { items: order }, result, token })
      return response as Promise<ConfirmResponse>
    } catch (err: any) {
      throw new Error(err.message || '确认订单失败')
    }
  }, [post])

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      await post('/orders/cancel', { order_id: Number(orderId) })
    } catch (err: any) {
      throw new Error(err.message || '取消订单失败')
    }
  }, [post])

  const payWithBalance = useCallback(async (orderId: string) => {
    try {
      await post('/orders/pay/balance', { order_id: Number(orderId) })
    } catch (err: any) {
      throw new Error(err.message || '余额支付失败')
    }
  }, [post])

  return {
    submitOrder,
    confirmOrder,
    cancelOrder,
    payWithBalance,
    formatOptionText: (item: CartItem) => getOptionText(item.product, item.selectedOptions)
  }
}
