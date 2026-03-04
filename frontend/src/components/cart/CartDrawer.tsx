import React, { useState, useEffect } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart, getOptionText } from '@/hooks/cartContext'
import { useThemeConfig } from '@/hooks/useTheme'
import { OrderConfirmModal } from '@/components/order/OrderConfirmModal'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0
  const cleaned = priceStr.replace(/%!f\(string=/g, '').replace(/\)/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, totalPrice, totalCount, removeItem, updateQuantity, clearCart } = useCart()
  const { config } = useThemeConfig()
  const navigate = useNavigate()
  const [isExiting, setIsExiting] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsEntering(true)
      })
    } else {
      setIsEntering(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
      setIsExiting(false)
      setIsEntering(false)
    }, 300)
  }

  const handleCheckout = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmSuccess = (data: { orderId: number; expiredAt: string }) => {
    const orderData = {
      orderId: data.orderId,
      expiredAt: data.expiredAt,
      items: items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        image_url: item.product.image_url,
        quantity: item.quantity,
        unit_price: item.totalPrice / item.quantity,
        total_price: item.totalPrice,
        options: Object.entries(item.selectedOptions)
          .map(([optionId, indices]) => {
            const option = item.product.options.find(o => o.id === Number(optionId))
            return {
              option_code: option?.option_code || '',
              values: indices.map(idx => option?.values?.[idx]?.value || '').filter(Boolean)
            }
          })
          .filter(opt => opt.option_code && opt.values.length > 0)
      })),
      totalAmount: totalPrice
    }
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData))
    clearCart()
    navigate('/payment')
  }

  if (!isOpen && !isEntering && !isExiting) return null

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-40 transition-colors duration-300 ease-out pointer-events-auto"
        style={{
          backgroundColor: isEntering && !isExiting ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
          pointerEvents: isEntering && !isExiting ? 'auto' : 'none',
        }}
        onClick={handleClose}
      />
      
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transition-transform duration-300 ease-out ${
          isExiting ? 'translate-x-full' : isEntering ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: config.background.surface }}
      >
        <div className="h-full flex flex-col">
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: config.border.light }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} style={{ color: config.text.primary }} />
              <h2
                className="text-lg font-semibold"
                style={{ color: config.text.primary }}
              >
                购物车
              </h2>
              <span
                className="text-sm px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: config.background.secondary,
                  color: config.text.secondary,
                }}
              >
                {totalCount}件
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full transition-colors hover:opacity-80"
              style={{ backgroundColor: config.background.secondary }}
            >
              <X size={20} style={{ color: config.text.primary }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag size={64} style={{ color: config.text.muted, opacity: 0.5 }} />
                <p
                  className="mt-4 text-lg"
                  style={{ color: config.text.secondary }}
                >
                  购物车空空如也
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: config.text.muted }}
                >
                  快去添加喜欢的商品吧
                </p>
              </div>
            ) : (
              items.map((item, index) => {
                const optionKey = Object.entries(item.selectedOptions)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([optionId, indices]) => `${optionId}:${indices.sort((a, b) => a - b).join(',')}`)
                  .join(';')

                return (
                  <div
                    key={`${item.product.id}_${optionKey}_${index}`}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: config.background.secondary }}
                  >
                    <img
                      src={item.product.image_url || '/assets/default.png'}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-medium text-sm line-clamp-2"
                        style={{ color: config.text.primary }}
                      >
                        {item.product.name}
                      </h3>
                      
                      <p
                        className="text-xs mt-1 line-clamp-1"
                        style={{ color: config.text.secondary }}
                      >
                        {getOptionText(item.product, item.selectedOptions)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: config.price.primary }}
                        >
                          ¥{item.totalPrice.toFixed(2)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, optionKey, item.quantity - 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: config.background.tertiary,
                              color: config.text.primary,
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          
                          <span
                            className="w-6 text-center text-sm font-medium"
                            style={{ color: config.text.primary }}
                          >
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.product.id, optionKey, item.quantity + 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: config.background.tertiary,
                              color: config.text.primary,
                            }}
                          >
                            <Plus size={14} />
                          </button>
                          
                          <button
                            onClick={() => removeItem(item.product.id, optionKey)}
                            className="ml-1 p-1.5 rounded-lg transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: `${config.status.error}20`,
                              color: config.status.error,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {items.length > 0 && (
            <div
              className="p-4 border-t space-y-4"
              style={{ borderColor: config.border.light }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-base"
                  style={{ color: config.text.secondary }}
                >
                  合计
                </span>
                <div
                  className="text-2xl font-bold"
                  style={{ color: config.price.primary }}
                >
                  ¥{totalPrice.toFixed(2)}
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl font-semibold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: config.status.info,
                  color: 'white',
                }}
              >
                结算
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <OrderConfirmModal
          onClose={() => setShowConfirmModal(false)}
          onSuccess={handleConfirmSuccess}
        />
      )}
    </>
  )
}
