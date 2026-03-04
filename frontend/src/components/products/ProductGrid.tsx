import React, { useState, useEffect, useMemo } from 'react'
import { ProductCard } from './ProductCard'
import { ProductDTO, ProductsResponse } from '@/types/product'
import { useThemeConfig } from '@/hooks/useTheme'
import { useApi } from '@/hooks/useApi'
import { Pagination } from '@/components/ui/Pagination'

interface ProductGridProps {
  onProductClick?: (product: ProductDTO) => void
}

const CARD_HEIGHT = 240

export const ProductGrid: React.FC<ProductGridProps> = ({ onProductClick }) => {
  const { config } = useThemeConfig()
  const { get } = useApi()

  const [displayedProducts, setDisplayedProducts] = useState<ProductDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(6)

  const fetchProducts = async (pageNum: number, size: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<any>('/products/all')
      
      let items: any[] = []
      
      if (Array.isArray(data)) {
        items = data
      } else if (data && Array.isArray(data.items)) {
        items = data.items
      } else if (data && Array.isArray(data.data)) {
        items = data.data
      }
      
      const activeProducts = items.filter((p: any) => p.is_active === true)
      setDisplayedProducts(activeProducts)
      setTotalItems(activeProducts.length)
      setTotalPages(Math.ceil(activeProducts.length / size))
      setCurrentPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(1, pageSize)
  }, [])

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    fetchProducts(1, size)
  }

  const handleRefresh = () => {
    fetchProducts(currentPage, pageSize)
  }

  const gridRowsClass = useMemo(() => {
    if (pageSize === 6) return 'grid-rows-2'
    if (pageSize === 9) return 'grid-rows-3'
    return ''
  }, [pageSize])

  if (error) {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`
        }}
      >
        <div className="text-center py-12">
          <div
            className="inline-block p-4 rounded-lg"
            style={{ backgroundColor: config.background.secondary }}
          >
            <div className="text-2xl mb-2">😞</div>
            <p style={{ color: config.text.secondary }}>{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: config.status.info, color: 'white' }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: config.text.primary }}
          >
            商品列表
          </h2>
          <p
            className="text-sm"
            style={{ color: config.text.secondary }}
          >
            共 {totalItems} 件商品
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: config.background.secondary }}
        >
          🔄
        </button>
      </div>

      {loading && displayedProducts.length === 0 ? (
        <div
          className={`
            grid
            grid-cols-2
            md:grid-cols-3
            ${gridRowsClass}
            gap-4
          `}
          style={{ gridAutoRows: `${CARD_HEIGHT}px` }}
        >
          {Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg"
              style={{ backgroundColor: config.background.secondary }}
            />
          ))}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="inline-block p-4 rounded-lg"
            style={{ backgroundColor: config.background.secondary }}
          >
            <div className="text-2xl mb-2">😶‍🌫️</div>
            <p style={{ color: config.text.secondary }}>暂无商品</p>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`
              grid
              grid-cols-2
              md:grid-cols-3
              ${gridRowsClass}
              gap-4
              mb-6
            `}
            style={{ gridAutoRows: `${CARD_HEIGHT}px` }}
          >
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={onProductClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={() => {}}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
