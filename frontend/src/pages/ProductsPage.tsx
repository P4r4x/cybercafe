import React, { useState } from 'react'
import { ProductGrid, ProductOptionModal } from '@/components/products'
import { ProductDTO } from '@/types/product'
import { useThemeConfig } from '@/hooks/useTheme'
import { Coffee } from 'lucide-react'

export default function ProductsPage() {
  const { config } = useThemeConfig()
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null)

  const handleProductClick = (product: ProductDTO) => {
    setSelectedProduct(product)
  }

  return (
    <>
      <div
        className="flex flex-col items-center justify-start min-h-screen pt-8 pb-8"
        style={{
          backgroundColor: config.background.surface
        }}
      >
        <div className="max-w-6xl w-full px-6">
          <h1
            className="text-3xl font-bold mb-6 flex items-center"
            style={{ color: config.text.title }}
          >
            <Coffee className="w-8 h-8 mr-3" />
            商品列表
          </h1>
          <ProductGrid onProductClick={handleProductClick} />
        </div>
      </div>

      <ProductOptionModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        />
      </>
  )
}
