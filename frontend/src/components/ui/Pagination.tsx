import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeConfig } from '@/hooks/useTheme'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const { config, isDark } = useThemeConfig()

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        style={{
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`,
          color: config.text.primary
        }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`,
          color: config.text.primary
        }}
      >
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        style={{
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`,
          color: config.text.primary
        }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
