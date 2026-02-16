import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { CartButton, CartDrawer } from '@/components/cart'
import { CartProvider } from '@/hooks/cartContext'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <CartProvider>
      <div className="h-full relative">
        <Sidebar />
        
        <div className="h-full pl-16">
          <main className="h-full bg-transparent relative">
            {children}
          </main>
        </div>

        <CartButton onClick={() => setIsCartOpen(true)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </CartProvider>
  )
}
