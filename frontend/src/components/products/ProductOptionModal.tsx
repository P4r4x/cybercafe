import React, { useState, useMemo, useEffect } from 'react'
import { ProductDTO } from '@/types/product'
import { useThemeConfig } from '@/hooks/useTheme'
import { useCart } from '@/hooks/cartContext'

const parsePrice = (priceStr: string | number): number => {
  if (!priceStr) return 0
  const strValue = typeof priceStr === 'number' ? String(priceStr) : priceStr
  const cleaned = strValue.replace(/%!f\(string=/g, '').replace(/\)/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

interface ProductOptionModalProps {
  product: ProductDTO | null
  onClose: () => void
}

export const ProductOptionModal: React.FC<ProductOptionModalProps> = ({
  product,
  onClose
}) => {
  const { config } = useThemeConfig()
  const { addItem } = useCart()
  const [selections, setSelections] = useState<Record<number, number[]>>({})
  const [quantity, setQuantity] = useState(1)
  const [isExiting, setIsExiting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const totalPrice = useMemo(() => {
    if (!product) return 0
    let price = parsePrice(product.base_price)
    Object.entries(selections).forEach(([optionId, selectedIndices]) => {
      selectedIndices.forEach(idx => {
        const option = product.options.find(o => o.id === Number(optionId))
        if (option && option.values && option.values[idx]) {
          price += parsePrice(option.values[idx].extra_price)
        }
      })
    })
    return price * quantity
  }, [product, selections, quantity])

  const handleSelect = (optionId: number, valueIndex: number, type: 'single' | 'multiple') => {
    setSelections(prev => {
      const newSelections = { ...prev }
      if (type === 'single') {
        newSelections[optionId] = [valueIndex]
      } else {
        const current = newSelections[optionId] || []
        if (current.includes(valueIndex)) {
          newSelections[optionId] = current.filter(i => i !== valueIndex)
        } else {
          newSelections[optionId] = [...current, valueIndex]
        }
        if (newSelections[optionId].length === 0) {
          delete newSelections[optionId]
        }
      }
      return newSelections
    })
  }

  const isSelected = (optionId: number, valueIndex: number) => {
    return selections[optionId]?.includes(valueIndex) || false
  }

  const isOptionComplete = (optionId: number, required: boolean, type: 'single' | 'multiple' | 'multi') => {
    const selected = selections[optionId] || []
    if (!required && selected.length === 0) return true
    if (type === 'single') return selected.length === 1
    return selected.length > 0
  }

  // 当product改变时，重置状态并从下方升起
  useEffect(() => {
    if (product) {
      setIsExiting(false)
      // 下一帧执行动画
      requestAnimationFrame(() => {
        setIsOpen(true)
      })
    }
  }, [product])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const canConfirm = useMemo(() => {
    if (!product) return false
    return product.options.every(option =>
      isOptionComplete(option.id, option.required, option.option_type)
    )
  }, [product, selections])

  if (!product) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end transition-colors duration-300 ease-out pointer-events-auto"
      style={{
        backgroundColor: isOpen && !isExiting ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
        pointerEvents: isOpen && !isExiting ? 'auto' : 'none'
      }}
      onClick={handleClose}
    >
      <div
        className={`w-full max-h-[80vh] rounded-t-2xl overflow-hidden transition-transform duration-300 ease-out ${
          isOpen && !isExiting ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ backgroundColor: config.background.surface }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex gap-4" style={{ borderColor: config.border.light }}>
          <img
            src="/assets/default.png"
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg" style={{ color: config.text.primary }}>
              {product.name}
            </h3>
            <p className="text-sm mt-1 line-clamp-2" style={{ color: config.text.secondary }}>
              {product.description}
            </p>
            <div className="font-medium mt-2" style={{ color: config.price.primary }}>
              ¥{parsePrice(product.base_price).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[40vh]">
          {product.options.map((option) => (
            <div key={option.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium" style={{ color: config.text.primary }}>
                  {option.option_code}
                </h4>
                {option.required && <span className="text-red-500">*</span>}
                {!isOptionComplete(option.id, option.required, option.option_type) && (
                  <span className="text-xs" style={{ color: config.text.secondary }}>
                    (必选)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!option.values || option.values.length === 0 ? (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: config.background.secondary }}
                  >
                    <span style={{ color: config.text.secondary }}>暂无可选规格</span>
                  </div>
                ) : (
                  option.values.map((value, idx) => (
                    <div
                      key={idx}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                        ${isSelected(option.id, idx) ? '' : 'hover:opacity-80'}
                      `}
                      style={{
                        backgroundColor: isSelected(option.id, idx)
                          ? `${config.status.info}20`
                          : config.background.secondary,
                        border: isSelected(option.id, idx)
                          ? `1px solid ${config.status.info}`
                          : `1px solid transparent`
                      }}
                      onClick={() => handleSelect(option.id, idx, option.option_type === 'single' ? 'single' : 'multiple')}
                    >
                      <span style={{ color: config.text.primary }}>{value.value}</span>
                      {parsePrice(value.extra_price) > 0 && (
                        <span className="text-xs" style={{ color: config.text.secondary }}>
                          +¥{parsePrice(value.extra_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-4" style={{ borderColor: config.border.light }}>
          <div className="flex items-center gap-3">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:opacity-80"
              style={{
                backgroundColor: config.background.secondary,
                color: config.text.primary
              }}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <span className="font-medium text-lg w-8 text-center" style={{ color: config.text.primary }}>
              {quantity}
            </span>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:opacity-80"
              style={{
                backgroundColor: config.background.secondary,
                color: config.text.primary
              }}
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>

          <button
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${canConfirm ? '' : 'opacity-50 cursor-not-allowed'}
            `}
            style={{
              backgroundColor: canConfirm ? config.status.info : config.background.secondary,
              color: 'white'
            }}
            onClick={() => {
              if (canConfirm && product) {
                addItem(product, selections, quantity, totalPrice)
                handleClose()
              }
            }}
            disabled={!canConfirm}
          >
            加入购物车 ¥{totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}
