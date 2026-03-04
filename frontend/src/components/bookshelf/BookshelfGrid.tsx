import React, { useState, useEffect, useMemo } from 'react'
import { BookCard } from './BookCard'
import { BookshelfItemDTO, BookshelfResponse } from '@/types/bookshelf'
import { useThemeConfig } from '@/hooks/useTheme'
import { useApi } from '@/hooks/useApi'
import { Pagination } from '@/components/ui/Pagination'

interface BookshelfGridProps {
  onBookClick?: (book: BookshelfItemDTO) => void
}

// 与 BookCard 高度保持一致
const CARD_HEIGHT = 240

export const BookshelfGrid: React.FC<BookshelfGridProps> = ({ onBookClick }) => {
  const { config } = useThemeConfig()
  const { get } = useApi()

  const [displayedBooks, setDisplayedBooks] = useState<BookshelfItemDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize, setPageSize] = useState(6)

  const fetchBooks = async (pageNum: number, size: number) => {
    setLoading(true)
    setError(null)
    try {
      const data: BookshelfResponse = await get('/me/bookshelf', {
        page: String(pageNum),
        pageSize: String(size)
      })
      setDisplayedBooks(data.items)
      setTotalPages(data.pagination.totalPages)
      setTotalItems(data.pagination.total)
      setCurrentPage(data.pagination.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks(1, pageSize)
  }, [pageSize])

  const handlePageChange = (page: number) => {
    fetchBooks(page, pageSize)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    fetchBooks(currentPage, pageSize)
  }

  // 🔑 根据 pageSize 固定行数
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: config.text.primary }}
          >
            我的书架
          </h2>
          <p
            className="text-sm"
            style={{ color: config.text.secondary }}
          >
            共 {totalItems} 本书
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

      {/* Page size */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: config.text.secondary, fontSize: '14px' }}>
          每页显示
        </span>
        {[6, 9].map((size) => (
          <button
            key={size}
            onClick={() => handlePageSizeChange(size)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              pageSize === size ? '' : 'opacity-60 hover:opacity-100'
            }`}
            style={
              pageSize === size
                ? {
                    backgroundColor: config.gradient.primary,
                    color: 'white'
                  }
                : {
                    backgroundColor: config.background.secondary,
                    color: config.text.primary
                  }
            }
          >
            {size}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && displayedBooks.length === 0 ? (
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
      ) : displayedBooks.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="inline-block p-4 rounded-lg"
            style={{ backgroundColor: config.background.secondary }}
          >
            <div className="text-2xl mb-2">📚</div>
            <p style={{ color: config.text.secondary }}>书架还是空的</p>
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
            {displayedBooks.map((book) => (
              <BookCard
                key={book.book_id}
                book={book}
                onClick={onBookClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
