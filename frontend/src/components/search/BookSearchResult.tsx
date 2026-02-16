import React from 'react'
import { Book, User, Building, Package, Download, ExternalLink } from 'lucide-react'
import { BookCover } from '@/components/ui/SmartImage'
import { useTheme } from '@/hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { formatPrice } from '@/utils/price'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  price: string
  remain: number
  has_ebook: boolean
  created_at: string
  cover_url?: string // 图书封面URL（可选）
}

interface BookSearchResultProps {
  results: Book[]
  isSearching: boolean
  config: any
}

export const BookSearchResult: React.FC<BookSearchResultProps> = ({ results, isSearching, config }) => {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  

  const getStockStatus = (remain: number) => {
    if (remain > 0) {
      return {
        text: `有库存 (${remain}本)`,
        color: config.status.success,
        bgColor: '#10b98110'
      }
    } else {
      return {
        text: '无库存',
        color: config.status.error,
        bgColor: '#ef444410'
      }
    }
  }

  if (isSearching) {
    return (
      <div 
        className="rounded-xl p-8 text-center"
        style={{ 
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`
        }}
      >
        <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-4" 
          style={{ 
            borderTopColor: config.gradient.primary,
            borderRightColor: 'transparent',
            borderBottomColor: config.gradient.primary,
            borderLeftColor: 'transparent'
          }}
        />
        <p style={{ color: config.text.secondary }}>正在搜索图书...</p>
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <div 
        className="rounded-xl p-8 text-center"
        style={{ 
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`
        }}
      >
        <Book className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: config.text.muted }} />
        <h3 style={{ color: config.text.secondary }} className="text-lg font-medium mb-2">
          未找到符合条件的图书
        </h3>
        <p style={{ color: config.text.muted }}>
          请尝试调整搜索条件或关键词
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* 搜索结果统计 */}
      <div 
        className="rounded-lg p-4 mb-4 flex items-center justify-between"
        style={{ 
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`
        }}
      >
        <div className="flex items-center">
          <Book className="w-5 h-5 mr-2" style={{ color: config.text.secondary }} />
          <span style={{ color: config.text.secondary }}>
            找到 <strong style={{ color: config.text.primary }}>{results.length}</strong> 本图书
          </span>
        </div>
      </div>

      {/* 图书列表 - 横向卡片布局 */}
      <div className="space-y-4">
        {results.map((book) => {
          const stockStatus = getStockStatus(book.remain)
          
          return (
            <div
              key={book.id}
              className="rounded-xl p-5 transition-all duration-200 hover:shadow-lg border"
              style={{
                backgroundColor: config.background.surface,
                borderColor: config.border.light,
                maxHeight: '200px' // 固定限高
              }}
            >
              {/* 横向布局：封面 + 内容区 */}
              <div className="flex gap-5 h-full">
                {/* 左侧：封面 (9:16 比例) */}
                <div 
                  className="flex-shrink-0 rounded-lg overflow-hidden"
                  style={{ width: '112px', height: '160px' }} // 9:16 比例
                >
                  <BookCover
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    fallback={
                      <img
                        src="/assets/default.png"
                        alt={book.title}
                        className="w-full h-full object-contain"
                      />
                    }
                  />
                </div>

                {/* 中间：书籍信息 */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* 第一排：标题 */}
                  <div className="mb-2">
                    <h3 
                      className="font-bold text-lg line-clamp-2 leading-tight"
                      style={{ color: config.text.title }}
                    >
                      {book.title || '未知标题'}
                    </h3>
                  </div>

                  {/* 第二排：出版社（更小字体） */}
                  <div className="text-xs mb-1 flex items-center" style={{ color: config.text.secondary }}>
                    <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate" title={book.publisher}>
                      {book.publisher || '未知出版社'}
                    </span>
                  </div>

                  {/* 第三排：作者 */}
                  <div className="text-sm mb-2 flex items-center" style={{ color: config.text.secondary }}>
                    <User className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate" title={book.author}>
                      {book.author || '未知作者'}
                    </span>
                  </div>

                  {/* 第四排：标签 */}
                  <div className="flex flex-wrap gap-2">
                    {/* 库存状态 */}
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{
                        backgroundColor: stockStatus.bgColor,
                        color: stockStatus.color
                      }}
                    >
                      <Package className="w-3 h-3" />
                      {book.remain > 0 ? `库存${book.remain}` : '无库存'}
                    </div>

                    {/* 电子书标签 - 独特颜色 */}
                    {book.has_ebook && (
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: isDark ? '#7c3aed20' : '#7c3aed15',
                          color: isDark ? '#a78bfa' : '#7c3aed'
                        }}
                      >
                        <Download className="w-3 h-3" />
                        电子书
                      </div>
                    )}
                  </div>
                </div>

                {/* 右侧：详情按钮（居中） + 价格（右下角） */}
                <div className="flex items-center min-w-fit ml-4 relative">
                  {/* 详情按钮 - 高度居中 */}
                  <button
                    onClick={() => navigate(`/book-detail/${book.id}`)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
                    style={{
                      backgroundColor: isDark ? '#ecdfff' : '#ffb18d',
                      color: isDark ? '#3c0042' : 'white'
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    详情
                  </button>
                  
                  {/* 价格 - 右下角 */}
                  <div className="absolute bottom-0 right-0 font-bold text-lg"
                    style={{ color: config.price.primary }}>
                    {formatPrice(book.price)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      
    </div>
  )
}