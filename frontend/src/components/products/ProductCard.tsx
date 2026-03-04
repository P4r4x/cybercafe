import React from 'react'
import { ProductDTO } from '@/types/product'
import { useThemeConfig } from '@/hooks/useTheme'

interface ProductCardProps {
  product: ProductDTO
  onClick?: (product: ProductDTO) => void
}

const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0
  const cleaned = priceStr.replace(/%!f\(string=/g, '').replace(/\)/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { config } = useThemeConfig()

  return (
    <div
      className="
        h-[220px]
        p-3
        rounded-xl
        cursor-pointer
        transition-all
        duration-200
        hover:shadow-lg
        hover:-translate-y-1
        flex
        gap-4
        overflow-hidden
      "
      style={{
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
      onClick={() => onClick?.(product)}
    >
      {/* 商品封面 */}
      <div
        className="
          h-full
          aspect-[3/4]
          rounded-lg
          overflow-hidden
          flex-shrink-0
          flex
          items-center
          justify-center
        "
        style={{
          backgroundColor: config.background.secondary
        }}
      >
        <img
          src="/assets/default.png"
          alt={product.name}
          className="
            w-full
            h-full
            object-contain
          "
        />
      </div>

      {/* 信息区 */}
      <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
        <div className="space-y-1">
          <h3
            className="
              font-semibold
              text-sm
              leading-snug
              line-clamp-2
            "
            style={{ color: config.text.primary }}
          >
            {product.name}
          </h3>

          <p
            className="
              text-xs
              line-clamp-2
            "
            style={{ color: config.text.secondary }}
          >
            {product.description}
          </p>
        </div>

        <div
          className="
            text-xl
            font-semibold
            self-end
          "
          style={{ color: config.price?.primary || '#E86A50' }}
        >
          ¥{parsePrice(product.base_price).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
