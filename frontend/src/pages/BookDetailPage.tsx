import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useThemeConfig, useTheme } from '@/hooks/useTheme'
import { useToast } from '@/components/ui'
import { useApi } from '@/hooks/useApi'
import { BookCover, ImagePlaceholder } from '@/components/ui/SmartImage'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BookDetailSkeleton } from '@/components/ui/BookDetailSkeleton'
import {
  Book,
  ArrowLeft,
  Package,
  Library,
  Eye
} from 'lucide-react'

/* =======================
 * 类型定义
 * ======================= */

interface BookDetail {
  uuid: string
  id: string
  total: number
  remain: number
  title: string
  author: string
  publisher: string
  price: string
  has_ebook: boolean
  extra: {
    era?: string
    genre?: string
    intro?: string
    keyword?: string
    wordcount?: number
    cover_url?: string
  }
  created_at: string
}

interface BookshelfItem {
  BookID: string
  Title: string
  Author: string
}

/** 按钮语义类型 */
type ActionButtonType = 'preview' | 'shelf' | 'borrow'

/** 操作按钮结构 */
interface ActionButton {
  key: string
  text: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  type: ActionButtonType
}

/* =======================
 * 页面组件
 * ======================= */

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { config } = useThemeConfig()
  const { isDark } = useTheme()
  const { success, error } = useToast()
  const { get, post } = useApi()
  const { confirm, DialogComponent } = useConfirmDialog()

  const [bookDetail, setBookDetail] = useState<BookDetail | null>(null)
  const [bookshelf, setBookshelf] = useState<BookshelfItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInBookshelf, setIsInBookshelf] = useState(false)
  const [isBorrowing, setIsBorrowing] = useState(false)
  const [isAddingToShelf, setIsAddingToShelf] = useState(false)

  /* =======================
   * 数据加载
   * ======================= */

  const fetchBookDetail = async () => {
    if (!id) return
    try {
      const res = await get(`/books/${id}`)
      setBookDetail(Array.isArray(res) ? res[0] : null)
    } catch {
      error('获取图书详情失败')
      navigate('/searchbook')
    }
  }

  const fetchBookshelf = async () => {
    try {
      const res = await get('/me/bookshelf')
      // 后端返回 BookshelfResponse 格式，需要提取 items 数组
      setBookshelf((res?.items) || [])
    } catch {}
  }

  // 检查指定书籍是否在书架中 - 使用新的专用接口
  const checkBookInShelf = async (bookId: string) => {
    if (!bookId) return false
    
    try {
      const response = await get(`/books/has/${bookId}`)
      // 新接口返回格式: {"message": true/false}
      return response?.message === true
    } catch (err: any) {
      console.error('检查书架状态失败:', err)
      return false
    }
  }

  /* =======================
   * 行为处理
   * ======================= */

  const toggleBookshelf = async () => {
    if (!id || !bookDetail) return

    // 如果已经在书架中，需要确认移除
    if (isInBookshelf) {
      const confirmed = await confirm({
        title: '移除书架',
        message: `确定要将《${bookDetail.title}》从你的书架中移除吗？`,
        confirmText: '确认移除',
        cancelText: '取消',
        type: 'warning',
        onConfirm: async () => {
          await performRemoveFromShelf()
        }
      })
    } else {
      // 加入书架不需要确认，直接执行
      await performAddToShelf()
    }
  }

  // 执行加入书架操作
  const performAddToShelf = async () => {
    if (!id || !bookDetail) return
    
    setIsAddingToShelf(true)
    
    try {
      // 添加到书架 - 乐观更新
      await get(`/books/add/${id}`)
      
      // 立即更新状态实现即时反馈
      setIsInBookshelf(true)
      if (bookDetail && id) {
        setBookshelf(prev => [...prev, {
          BookID: id,
          Title: bookDetail.title,
          Author: bookDetail.author
        }])
      }
      
      success('已加入书架')
      
      // 操作完成后，使用新接口重新确认状态
      const hasBook = await checkBookInShelf(id)
      setIsInBookshelf(hasBook)
      
    } catch (err: any) {
      console.error('加入书架失败:', err)
      error(err.message || '操作失败，请重试')
      
      // 操作失败时，使用新接口重新获取准确状态
      const hasBook = await checkBookInShelf(id)
      setIsInBookshelf(hasBook)
    } finally {
      setIsAddingToShelf(false)
    }
  }

  // 执行从书架移除操作
  const performRemoveFromShelf = async () => {
    if (!id) return
    
    setIsAddingToShelf(true)
    
    try {
      // 从书架移除 - 乐观更新 - 软删除
      await get(`/books/remove/${id}`)
      
      // 立即更新状态实现即时反馈
      setIsInBookshelf(false)
      setBookshelf(prev => prev.filter(item => item.book_id !== id))
      
      success('已从书架移除')
      
      // 操作完成后，使用新接口重新确认状态
      const hasBook = await checkBookInShelf(id)
      setIsInBookshelf(hasBook)
      
    } catch (err: any) {
      console.error('移除书架失败:', err)
      error(err.message || '操作失败，请重试')
      
      // 操作失败时，使用新接口重新获取准确状态
      const hasBook = await checkBookInShelf(id)
      setIsInBookshelf(hasBook)
    } finally {
      setIsAddingToShelf(false)
    }
  }

  const borrowBook = async () => {
    if (!id || !bookDetail) return
    if (bookDetail.remain <= 0) return error('库存不足')

    const confirmed = await confirm({
      title: '借阅确认',
      message: `确定要借阅《${bookDetail.title}》吗？借阅后请在7天内归还。`,
      confirmText: '确认借阅',
      cancelText: '再想想',
      type: 'primary',
      onConfirm: async () => {
        setIsBorrowing(true)
        try {
          await post('/books/borrow', { id, amount: 1 })
          success('借阅成功')
          fetchBookDetail()
        } catch {
          error('借阅失败')
        } finally {
          setIsBorrowing(false)
        }
      }
    })
  }

  /* =======================
   * 生命周期
   * ======================= */

  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true)
      
      try {
        // 并行获取书籍详情和检查书架状态
        await Promise.all([
          fetchBookDetail(),
          fetchBookshelf()
        ])
        
        // 使用新的专用接口检查书架状态
        if (id) {
          const hasBook = await checkBookInShelf(id)
          setIsInBookshelf(hasBook)
        }
      } catch (err) {
        console.error('页面初始化失败:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    initPage()
  }, [id])

  // 保留原有的书架状态同步作为备用
  useEffect(() => {
    if (bookshelf.length > 0 && id) {
      const hasBook = bookshelf.some(b => b.book_id === id)
      setIsInBookshelf(hasBook)
    }
  }, [bookshelf, id])

  if (isLoading) return <BookDetailSkeleton />

  if (!bookDetail) return null

  // 构建带前缀的标签
  const buildTag = (prefix: string, value: string) => `${prefix}: ${value}`
  
  // 获取时代和风格标签
  const tags = [
    bookDetail.extra?.era ? buildTag('时代', bookDetail.extra.era) : null,
    bookDetail.extra?.genre ? buildTag('风格', bookDetail.extra.genre) : null
  ].filter(Boolean)

  /* =======================
   * 按钮配色（穷尽式）
   * ======================= */

  const getButtonStyle = (type: ActionButtonType) => {
    if (isDark) {
      switch (type) {
        case 'preview':
          return { background: '#2A2A3A', color: '#DADAF0' }
        case 'shelf':
          return isInBookshelf
            ? { background: '#1F3D2B', color: '#9BE5C3' }
            : { background: '#2E4A7D', color: '#CFE0FF' }
        case 'borrow':
          return { background: '#6A1E55', color: '#FFD6EC' }
        default: {
          const _exhaustive: never = type
          return _exhaustive
        }
      }
    } else {
      switch (type) {
        case 'preview':
          return { background: '#FFEDED', color: '#8B5A5A' }
        case 'shelf':
          return isInBookshelf
            ? { background: '#E6F4EA', color: '#256D3A' }
            : { background: '#E8F0FF', color: '#2B4DBA' }
        case 'borrow':
          return { background: '#FFE1EC', color: '#9B1C4D' }
        default: {
          const _exhaustive: never = type
          return _exhaustive
        }
      }
    }
  }

  /* =======================
   * 操作按钮定义
   * ======================= */

  const actionButtons: ActionButton[] = [
    {
      key: 'preview',
      text: '在线阅读',
      icon: <Eye className="w-4 h-4" />,
      onClick: () =>
        bookDetail.has_ebook
          ? success('功能开发中')
          : error('暂无电子版'),
      type: 'preview'
    },
    {
      key: 'shelf',
      text: isAddingToShelf 
        ? (isInBookshelf ? '移除中…' : '添加中…')
        : (isInBookshelf ? '从书架移除' : '加入书架'),
      icon: isAddingToShelf 
        ? <div className="animate-spin w-4 h-4 border-2 rounded-full" style={{ 
            borderTopColor: 'currentColor', 
            borderRightColor: 'transparent',
            borderBottomColor: 'currentColor',
            borderLeftColor: 'transparent'
          }} />
        : <Library className="w-4 h-4" />,
      onClick: toggleBookshelf,
      disabled: isAddingToShelf,
      type: 'shelf'
    },
    {
      key: 'borrow',
      text:
        bookDetail.remain > 0
          ? isBorrowing
            ? '借阅中…'
            : '借阅'
          : '无库存',
      icon: <Package className="w-4 h-4" />,
      onClick: borrowBook,
      disabled: isBorrowing || bookDetail.remain <= 0,
      type: 'borrow'
    }
  ]

  /* =======================
   * 渲染
   * ======================= */

  return (
    <div 
      className="flex flex-col items-center justify-start min-h-screen pt-8 pb-8"
      style={{
        background: isDark 
          ? 'linear-gradient(180deg, #1A1A2E 0%, #2D1068 50%, #1A1A2E 100%)'
          : 'linear-gradient(180deg, #FFF8F3 0%, #FFE8DA 50%, #FFF8F3 100%)'
      }}
    >
        <div className="max-w-4xl w-full px-6">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:-translate-x-1"
            style={{
              background: isDark ? '#441074' : '#FFBABA',
              color: config.text.secondary
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            返回上一页
          </button>

          <div
            className="rounded-xl p-8"
            style={{
              background: config.background.surface,
              border: `1px solid ${config.border.light}`
            }}
          >
            <div className="flex gap-10">
              {/* 左侧 */}
              <div className="flex flex-col items-center w-56">
                <div
                  className="w-48 h-72 rounded-lg overflow-hidden mb-6"
                  style={{ background: config.background.secondary }}
                >
                  {bookDetail.extra?.cover_url ? (
                    <BookCover
                      src={bookDetail.extra.cover_url}
                      alt={bookDetail.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      width="100%"
                      height="100%"
                      text="暂无封面"
                      icon={<Book className="w-16 h-16 opacity-40" />}
                    />
                  )}
                </div>

                <div className="w-full space-y-3">
                  {actionButtons.map(btn => (
                    <button
                      key={btn.key}
                      onClick={btn.onClick}
                      disabled={btn.disabled}
                      className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50"
                      style={getButtonStyle(btn.type)}
                    >
                      {btn.icon}
                      {btn.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* 右侧 */}
              <div className="flex-1">
                <h1
                  className="text-3xl font-bold mb-1"
                  style={{ color: config.text.title }}
                >
                  {bookDetail.title}
                </h1>

                <div
                  className="text-sm mb-6"
                  style={{ color: config.text.secondary }}
                >
                  {bookDetail.author} · {bookDetail.publisher}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: config.background.secondary,
                        color: config.text.secondary
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 分割线 */}
                {bookDetail.extra?.intro && tags.length > 0 && (
                  <div 
                    className="w-full h-px mb-6"
                    style={{ backgroundColor: config.border.light }}
                  />
                )}

                {/* 简介部分 */}
                {bookDetail.extra?.intro && (
                  <div className="space-y-2">
                    <h4 
                      className="text-sm font-medium"
                      style={{ color: config.text.secondary }}
                    >
                      简介:
                    </h4>
                    <p
                      className="leading-relaxed"
                      style={{ color: config.text.primary }}
                    >
                      {bookDetail.extra.intro}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* 确认弹窗 */}
        <DialogComponent />
      </div>
  )
}
