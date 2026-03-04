import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { ProductDTO } from '@/types/product'

export interface CartItem {
  product: ProductDTO
  selectedOptions: Record<number, number[]>
  quantity: number
  totalPrice: number
  addedAt: number
}

export interface CartItemKey {
  productId: number
  optionSelections: string
}

export interface CartContextValue {
  items: CartItem[]
  totalCount: number
  totalPrice: number
  addItem: (product: ProductDTO, selections: Record<number, number[]>, quantity: number, totalPrice: number) => void
  removeItem: (productId: number, optionSelections: string) => void
  updateQuantity: (productId: number, optionSelections: string, quantity: number) => void
  clearCart: () => void
  getItemKey: (productId: number, selections: Record<number, number[]>) => string
}

const defaultContextValue: CartContextValue = {
  items: [],
  totalCount: 0,
  totalPrice: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getItemKey: () => '',
}

export const CartContext = createContext<CartContextValue>(defaultContextValue)

const CART_STORAGE_KEY = 'cybercafe_cart'

function generateOptionKey(selections: Record<number, number[]>): string {
  const sortedEntries = Object.entries(selections)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([optionId, indices]) => `${optionId}:${indices.sort((a, b) => a - b).join(',')}`)
    .join(';')
  return sortedEntries
}

export function getOptionText(
  product: ProductDTO,
  selections: Record<number, number[]>
): string {
  return product.options
    .filter(option => selections[option.id])
    .map(option => {
      const selectedIndices = selections[option.id] || []
      const selectedValues = selectedIndices
        .map(idx => option.values?.[idx]?.value)
        .filter(Boolean)
        .join('、')
      return selectedValues ? `${option.option_code}: ${selectedValues}` : ''
    })
    .filter(Boolean)
    .join(' | ')
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const getItemKey = (productId: number, selections: Record<number, number[]>): string => {
    return `${productId}_${generateOptionKey(selections)}`
  }

  const addItem = (
    product: ProductDTO,
    selections: Record<number, number[]>,
    quantity: number,
    totalPrice: number
  ) => {
    const key = getItemKey(product.id, selections)
    
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => getItemKey(item.product.id, item.selectedOptions) === key
      )
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          totalPrice: updated[existingIndex].totalPrice + totalPrice,
        }
        return updated
      }
      
      return [...prev, {
        product,
        selectedOptions: selections,
        quantity,
        totalPrice,
        addedAt: Date.now(),
      }]
    })
  }

  const removeItem = (productId: number, optionSelections: string) => {
    setItems(prev => prev.filter(item => {
      const key = getItemKey(item.product.id, item.selectedOptions)
      return key !== `${productId}_${optionSelections}`
    }))
  }

  const updateQuantity = (
    productId: number,
    optionSelections: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItem(productId, optionSelections)
      return
    }
    
    setItems(prev => prev.map(item => {
      const key = getItemKey(item.product.id, item.selectedOptions)
      if (key === `${productId}_${optionSelections}`) {
        const unitPrice = item.totalPrice / item.quantity
        return {
          ...item,
          quantity,
          totalPrice: unitPrice * quantity,
        }
      }
      return item
    }))
  }

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalCount = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const totalPrice = useMemo(() =>
    items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  )

  const value: CartContextValue = {
    items,
    totalCount,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemKey,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    return defaultContextValue
  }
  return context
}
