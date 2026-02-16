import React from 'react'
import { useThemeConfig } from '@/hooks/useTheme'
import { BookshelfGrid } from '@/components/bookshelf'
import { BookshelfItemDTO } from '@/types/bookshelf'
import { useNavigate } from 'react-router-dom'

export default function BookshelfPage() {
  const { config } = useThemeConfig()
  const navigate = useNavigate()

  const handleBookClick = (book: BookshelfItemDTO) => {
    navigate(`/book-detail/${book.BookID}`)
  }

  return (
    <div 
      className="flex flex-col items-center justify-start min-h-screen pt-8 pb-8"
      style={{
        backgroundColor: config.background.surface
      }}
    >
      <div className="max-w-6xl w-full px-6">
        <BookshelfGrid onBookClick={handleBookClick} />
      </div>
    </div>
  )
}
