export interface ProductOptionValue {
  id: number
  option_id: number
  value: string
  extra_price: string | number
  created_at?: string
}

export interface ProductOption {
  id: number
  product_id: number
  option_code: string
  option_type: 'single' | 'multi'
  required: boolean
  values: ProductOptionValue[]
  created_at?: string
}

export interface ProductDTO {
  id: number
  name: string
  description: string
  base_price: string
  is_active: boolean
  image_url?: string
  options: ProductOption[]
}

export interface ProductsResponse {
  items: ProductDTO[]
  total: number
}

export interface CartItem {
  product: ProductDTO
  selectedOptions: Record<number, number[]>
  quantity: number
  totalPrice: number
}
