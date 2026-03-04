import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/cartContext'
import { useThemeConfig } from '@/hooks/useTheme'

interface CartButtonProps {
  onClick: () => void
}

export const CartButton: React.FC<CartButtonProps> = ({ onClick }) => {
  const { totalCount } = useCart()
  const { config } = useThemeConfig()

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 group rounded-2xl"
      style={{
        background: config.gradient.primary,
        boxShadow: config.shadow.lg,
      }}
    >
      <div className="relative p-4 rounded-full">
        <ShoppingCart 
          size={24} 
          className="text-white transition-transform group-hover:scale-110" 
        />
        
        {totalCount > 0 && (
          <div
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center text-xs font-bold text-white animate-bounce"
            style={{
              backgroundColor: config.status.error,
              transform: 'scale(1)',
            }}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </div>
        )}
      </div>
    </button>
  )
}
