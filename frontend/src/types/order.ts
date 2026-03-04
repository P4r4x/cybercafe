export type OrderStatus = 'created' | 'paid' | 'canceled' | 'expired'

export interface OrderHistory {
  id: number
  user_id: string
  status: OrderStatus
  total_amount: string
  created_at: string
  expired_at: string
  items: OrderHistoryItem[]
}

export interface OrderHistoryItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  base_price: string
  options: OrderHistoryItemOption[]
}

export interface OrderHistoryItemOption {
  id: number
  option_code: string
  option_value: string
  extra_price: string
}

export interface HistoryResponse {
  history: OrderHistory[]
  total: number
  total_pages: number
}

export const statusLabels: Record<OrderStatus, string> = {
  created: '待支付',
  paid: '已支付',
  canceled: '已取消',
  expired: '已过期'
}
