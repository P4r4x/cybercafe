import React, { useState } from 'react'
import { Search, Book, User } from 'lucide-react'
import { useThemeConfig, useTheme } from '@/hooks/useTheme'
import { useNavigate } from 'react-router-dom'

interface MiniSearchProps {
  className?: string
}

export const MiniSearch: React.FC<MiniSearchProps> = ({ className = '' }) => {
  const { config } = useThemeConfig()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [searchMode, setSearchMode] = useState<'title' | 'author'>('title')
  const [keyword, setKeyword] = useState('')

  const handleSearch = () => {
    if (!keyword.trim()) return

    // 跳转到搜索页面并携带参数
    const params = new URLSearchParams({
      keyword: keyword.trim(),
      mode: searchMode
    })

    navigate(`/searchbook?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const toggleMode = () => {
    setSearchMode(prev => prev === 'title' ? 'author' : 'title')
  }

  return (
    <div
      className={`flex items-stretch ${className}`}
      style={{
        height: '40px',
        backgroundColor: config.background.surface,
        boxShadow: `
          inset 0 0 0 1px rgba(255, 177, 141, 0.25),
          0 4px 12px rgba(255, 177, 141, 0.15)
        `,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {/* 搜索模式切换 - 滑块效果 */}
      <div
        className="relative flex h-full"
        style={{
          backgroundColor: isDark ? 'rgba(236, 223, 255, 0.1)' : 'rgba(255, 194, 166, 0.2)',
          // borderRight: '1px solid rgba(255, 177, 141, 0.3)'
        }}
      >
        {/* 滑块背景 */}
        <div
          className="absolute inset-0 transition-all duration-300 ease-out"
          style={{
            width: '50%',
            backgroundColor: isDark ? '#ecdfff' : '#ffb18d',
            left: searchMode === 'title' ? '0' : '50%',
            borderRadius: '8px'
          }}
        />

        {/* 选项按钮 */}
        <div className="relative flex h-full">
          <button
            onClick={toggleMode}
            className="h-full px-3 text-xs font-medium flex items-center gap-1 whitespace-nowrap relative z-10 transition-colors duration-300"
            style={{
              color: searchMode === 'title' 
                ? (isDark ? '#3c0042' : 'white') 
                : (isDark ? '#a991d4' : '#ffc2a6')
            }}
            title="切换到标题搜索"
          >
            <Book className="w-3 h-3" />
            标题
          </button>
          <button
            onClick={toggleMode}
            className="h-full px-3 text-xs font-medium flex items-center gap-1 whitespace-nowrap relative z-10 transition-colors duration-300"
            style={{
              color: searchMode === 'author' 
                ? (isDark ? '#3c0042' : 'white') 
                : (isDark ? '#a991d4' : '#ffc2a6')
            }}
            title="切换到作者搜索"
          >
            <User className="w-3 h-3" />
            作者
          </button>
        </div>
      </div>

      {/* 搜索输入框 */}
      <input
        type="text"
        placeholder={searchMode === 'title' ? '图书标题...' : '作者名...'}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 h-full px-3 text-sm border-0 outline-none bg-transparent min-w-0"
        style={{ color: config.text.primary }}
      />

      {/* 搜索按钮 */}
      <button
        onClick={handleSearch}
        className="h-full px-4 transition-all duration-200 flex items-center justify-center"
        style={{
          backgroundColor: isDark ? '#ecdfff' : '#ffb18d',
          color: isDark ? '#3c0042' : 'white'
        }}
        title="搜索"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  )
}
