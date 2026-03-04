import React from 'react'
import { BookshelfItemDTO } from '@/types/bookshelf'
import { useThemeConfig } from '@/hooks/useTheme'
import { BookCover } from '@/components/ui/SmartImage'

interface BookCardProps {
  book: BookshelfItemDTO
  onClick?: (book: BookshelfItemDTO) => void
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const { config } = useThemeConfig()

  return (
    <div
      className="
        h-[220px]
        p-3
        rounded-lg
        cursor-pointer
        transition-all
        duration-200
        hover:shadow-lg
        flex
        gap-3
        overflow-hidden
      "
      style={{
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
      onClick={() => onClick?.(book)}
    >
      {/* 左侧封面：3 / 4 */}
      <div className="h-full aspect-[3/4] rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: config.background.secondary }}>
        <BookCover
          src={book.cover_url}
          alt={book.title}
          width="100%"
          height="100%"
          className="w-full h-full object-contain"
          fallback={
            <img
              src="/assets/default.png"
              alt={book.title}
              className="w-full h-full object-contain"
            />
          }
        />
      </div>

      {/* 右侧信息区 */}
      <div className="flex flex-col justify-between min-w-0 flex-1">
        {/* 标题 */}
        <h3
          className="
            font-semibold
            text-sm
            leading-snug
            line-clamp-2
          "
          style={{ color: config.text.primary }}
        >
          {book.title}
        </h3>

        {/* 作者 */}
        <p
          className="
            text-xs
            truncate
          "
          style={{ color: config.text.secondary }}
        >
          {book.author}
        </p>
      </div>
    </div>
  )
}
