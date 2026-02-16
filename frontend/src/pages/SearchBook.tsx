import React, { useState, useEffect } from 'react'
import { Search, Filter, Book, User, Building, DollarSign, ChevronDown, ChevronUp, Package, Download } from 'lucide-react'
import { useThemeConfig, useTheme } from '@/hooks/useTheme'
import { useToast } from '@/components/ui'
import { useApi } from '@/hooks/useApi'
import { BookSearchResult } from '@/components/search/BookSearchResult'

type SearchMode = 'title' | 'author'

interface SearchFormData {
  title?: string
  author?: string
  publisher?: string
  price_min?: string
  price_max?: string
  has_remain?: boolean
  has_ebook?: boolean
}

interface SearchState {
  keyword: string
  mode: SearchMode
  isAdvanced: boolean
  formData: SearchFormData
}

export default function SearchBookPage() {
  const { config } = useThemeConfig()
  const { isDark } = useTheme()
  const { success, error } = useToast()
  const { post } = useApi()
  
  // 处理URL参数
  const [searchParams] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const keyword = params.get('keyword') || ''
    const mode = (params.get('mode') as SearchMode) || 'title'
    return { keyword, mode }
  })

  const [searchState, setSearchState] = useState<SearchState>({
    keyword: searchParams.keyword,
    mode: searchParams.mode,
    isAdvanced: false,
    formData: {
      title: searchParams.mode === 'title' ? searchParams.keyword : '',
      author: searchParams.mode === 'author' ? searchParams.keyword : '',
      publisher: '',
      price_min: '',
      price_max: '',
      has_remain: undefined,
      has_ebook: undefined
    }
  })

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // 如果有URL参数，自动搜索
  useEffect(() => {
    if (searchParams.keyword) {
      handleSearch()
    }
  }, [])

  const handleSimpleSearch = async () => {
    if (!searchState.keyword.trim()) {
      error('请输入搜索关键词')
      return
    }

    const searchData: SearchFormData = {}
    if (searchState.mode === 'title') {
      searchData.title = searchState.keyword
    } else {
      searchData.author = searchState.keyword
    }

    await performSearch(searchData)
  }

  const handleAdvancedSearch = async () => {
    // 验证至少有一个条件
    const hasCondition = Object.values(searchState.formData).some(value => 
      value !== undefined && value !== '' && value !== null
    )

    if (!hasCondition) {
      error('请至少填写一个搜索条件')
      return
    }

    // 清理空值
    const cleanData: SearchFormData = {}
    Object.entries(searchState.formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        cleanData[key as keyof SearchFormData] = value
      }
    })

    await performSearch(cleanData)
  }

  const performSearch = async (searchData: SearchFormData) => {
    setIsSearching(true)
    setHasSearched(true)

    try {
      const response = await post('/books/search', searchData)
      setSearchResults(response.items || [])
      
      if (response.items && response.items.length > 0) {
        success(`找到 ${response.items.length} 本图书`)
      } else {
        success('未找到符合条件的图书')
      }
    } catch (err: any) {
      console.error('Search error:', err)
      // useApi已经处理了错误提示
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    if (searchState.isAdvanced) {
      handleAdvancedSearch()
    } else {
      handleSimpleSearch()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const toggleAdvanced = () => {
    setSearchState(prev => ({
      ...prev,
      isAdvanced: !prev.isAdvanced
    }))
  }

  const updateFormData = (field: keyof SearchFormData, value: any) => {
    setSearchState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }))
  }

  const clearForm = () => {
    setSearchState(prev => ({
      ...prev,
      formData: {
        title: prev.mode === 'title' ? prev.keyword : '',
        author: prev.mode === 'author' ? prev.keyword : '',
        publisher: '',
        price_min: '',
        price_max: '',
        has_remain: undefined,
        has_ebook: undefined
      }
    }))
  }

  return (
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
          <Book className="w-8 h-8 mr-3" />
          图书搜索
        </h1>

        {/* 搜索区域 */}
        <div 
          className="rounded-xl shadow-lg p-6 mb-6"
          style={{ 
            backgroundColor: config.background.surface,
            border: `1px solid ${config.border.light}`
          }}
        >
          {/* 搜索栏行 - 包含简单搜索控件和搜索按钮 */}
          <div className="mb-4 flex gap-3">
            {/* 简单搜索区域 - 在高级搜索时禁用 */}
            <div className={`flex gap-3 flex-1 ${searchState.isAdvanced ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* 搜索模式切换 - 滑块效果 */}
              <div 
                className="relative rounded-lg overflow-hidden"
                style={{ 
                  backgroundColor: isDark ? 'rgba(236, 223, 255, 0.1)' : 'rgba(255, 194, 166, 0.2)',
                  border: `1px solid ${isDark ? 'rgba(236, 223, 255, 0.2)' : 'rgba(255, 177, 141, 0.3)'}`
                }}
              >
                {/* 滑块背景 */}
                <div 
                  className="absolute top-0 bottom-0 transition-all duration-300 ease-out rounded"
                  style={{
                    width: '50%',
                    height: '100%',
                    backgroundColor: isDark ? '#ecdfff' : '#ffb18d',
                    left: searchState.mode === 'title' ? '0' : '50%',
                    transform: `translateX(${searchState.mode === 'title' ? '0' : '0'})`,
                    transition: 'left 300ms ease-out, transform 300ms ease-out'
                  }}
                />
                
                {/* 选项按钮 */}
                <div className="relative flex">
                  <button
                    onClick={() => setSearchState(prev => ({ 
                      ...prev, 
                      mode: prev.mode === 'title' ? 'author' : 'title',
                      formData: {
                        ...prev.formData,
                        title: prev.mode === 'author' ? prev.keyword : prev.formData.title,
                        author: prev.mode === 'title' ? prev.keyword : prev.formData.author
                      }
                    }))}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 relative z-10`}
                    style={{
                      color: searchState.mode === 'title' 
                        ? (isDark ? '#3c0042' : 'white') 
                        : (isDark ? '#a991d4' : '#ffc2a6'),
                      transition: 'color 300ms ease-out'
                    }}
                    disabled={searchState.isAdvanced}
                  >
                    <Book className="w-4 h-4" />
                    标题
                  </button>
                  <button
                    onClick={() => setSearchState(prev => ({ 
                      ...prev, 
                      mode: prev.mode === 'title' ? 'author' : 'title',
                      formData: {
                        ...prev.formData,
                        title: prev.mode === 'author' ? prev.keyword : prev.formData.title,
                        author: prev.mode === 'title' ? prev.keyword : prev.formData.author
                      }
                    }))}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 relative z-10`}
                    style={{
                      color: searchState.mode === 'author' 
                        ? (isDark ? '#3c0042' : 'white') 
                        : (isDark ? '#a991d4' : '#ffc2a6'),
                      transition: 'color 300ms ease-out'
                    }}
                    disabled={searchState.isAdvanced}
                  >
                    <User className="w-4 h-4" />
                    作者
                  </button>
                </div>
              </div>

              {/* 搜索输入框 */}
              <input
                type="text"
                placeholder={searchState.mode === 'title' ? '请输入图书标题...' : '请输入作者名...'}
                value={searchState.keyword}
                onChange={(e) => setSearchState(prev => ({ ...prev, keyword: e.target.value }))}
                onKeyPress={handleKeyPress}
                disabled={searchState.isAdvanced}
                className="flex-1 px-4 py-2 rounded-lg border transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: config.background.input,
                  borderColor: config.border.medium,
                  color: config.text.primary
                }}
              />
            </div>

            {/* 搜索按钮 - 始终可点击 */}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] justify-center"
              style={{
                backgroundColor: isSearching 
                  ? (isDark ? '#d4c5f9' : '#ffc2a6') 
                  : (isDark ? '#ecdfff' : '#ffb18d'),
                color: isDark ? '#3c0042' : 'white'
              }}
            >
              <Search className="w-4 h-4" />
              {isSearching ? '搜索中...' : '搜索'}
            </button>
          </div>

          {/* 高级搜索切换 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleAdvanced}
              className="flex items-center gap-2 text-sm font-medium transition-colors duration-200"
              style={{ color: config.text.link }}
            >
              <Filter className="w-4 h-4" />
              高级搜索
              {searchState.isAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 高级搜索选项 */}
          {searchState.isAdvanced && (
            <div 
              className="mt-4 p-4 rounded-lg"
              style={{ 
                backgroundColor: config.background.secondary,
                border: `1px solid ${config.border.light}`
              }}
            >
              {/* 搜索分组标题 */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 
                    className="text-base font-semibold mb-1"
                    style={{ color: config.text.title }}
                  >
                    详细搜索条件
                  </h3>
                  <p style={{ color: config.text.muted, fontSize: '12px' }}>
                    填写任意数量的条件来精确搜索图书
                  </p>
                </div>
                <button
                  onClick={clearForm}
                  className="px-3 py-1.5 text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 hover:opacity-80"
                  style={{ 
                    backgroundColor: config.background.surface,
                    border: `1px solid ${config.border.light}`,
                    color: config.text.secondary
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清空条件
                </button>
              </div>

              {/* 搜索条件网格 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* 左列：基本信息 */}
                <div className="space-y-4">
                  {/* 图书标题 */}
                  <div>
                    <label 
                      className="flex items-center text-xs font-semibold mb-2"
                      style={{ color: config.text.primary }}
                    >
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: config.gradient.primary + '20',
                          color: config.gradient.primary
                        }}
                      >
                        <Book className="w-3 h-3" />
                      </div>
                      图书标题
                    </label>
                    <input
                      type="text"
                      placeholder="请输入图书标题关键词"
                      value={searchState.formData.title || ''}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-all duration-200 text-sm"
                      style={{
                        backgroundColor: config.background.surface,
                        borderColor: config.border.light,
                        color: config.text.primary
                      }}
                    />
                  </div>

                  {/* 作者 */}
                  <div>
                    <label 
                      className="flex items-center text-xs font-semibold mb-2"
                      style={{ color: config.text.primary }}
                    >
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: config.gradient.primary + '20',
                          color: config.gradient.primary
                        }}
                      >
                        <User className="w-3 h-3" />
                      </div>
                      作者
                    </label>
                    <input
                      type="text"
                      placeholder="请输入作者姓名"
                      value={searchState.formData.author || ''}
                      onChange={(e) => updateFormData('author', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-all duration-200 text-sm"
                      style={{
                        backgroundColor: config.background.surface,
                        borderColor: config.border.light,
                        color: config.text.primary
                      }}
                    />
                  </div>

                  {/* 出版社 */}
                  <div>
                    <label 
                      className="flex items-center text-xs font-semibold mb-2"
                      style={{ color: config.text.primary }}
                    >
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: config.gradient.primary + '20',
                          color: config.gradient.primary
                        }}
                      >
                        <Building className="w-3 h-3" />
                      </div>
                      出版社
                    </label>
                    <input
                      type="text"
                      placeholder="请输入出版社名称"
                      value={searchState.formData.publisher || ''}
                      onChange={(e) => updateFormData('publisher', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-all duration-200 text-sm"
                      style={{
                        backgroundColor: config.background.surface,
                        borderColor: config.border.light,
                        color: config.text.primary
                      }}
                    />
                  </div>
                </div>

                {/* 右列：价格和筛选 */}
                <div className="space-y-4">
                  {/* 价格区间 */}
                  <div>
                    <label 
                      className="flex items-center text-xs font-semibold mb-2"
                      style={{ color: config.text.primary }}
                    >
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center mr-2"
                        style={{ 
                          backgroundColor: config.gradient.primary + '20',
                          color: config.gradient.primary
                        }}
                      >
                        <DollarSign className="w-3 h-3" />
                      </div>
                      价格区间
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          placeholder="最低价格"
                          value={searchState.formData.price_min || ''}
                          onChange={(e) => updateFormData('price_min', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 pr-6 rounded-lg border transition-all duration-200 text-sm"
                          style={{
                            backgroundColor: config.background.surface,
                            borderColor: config.border.light,
                            color: config.text.primary
                          }}
                        />
                        <span 
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                          style={{ color: config.text.muted }}
                        >
                          ¥
                        </span>
                      </div>
                      <div 
                        className="px-1 text-xs"
                        style={{ color: config.text.secondary }}
                      >
                        至
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          placeholder="最高价格"
                          value={searchState.formData.price_max || ''}
                          onChange={(e) => updateFormData('price_max', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 pr-6 rounded-lg border transition-all duration-200 text-sm"
                          style={{
                            backgroundColor: config.background.surface,
                            borderColor: config.border.light,
                            color: config.text.primary
                          }}
                        />
                        <span 
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                          style={{ color: config.text.muted }}
                        >
                          ¥
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 筛选条件 */}
                  <div>
                    <label 
                      className="flex items-center text-xs font-semibold mb-3"
                      style={{ color: config.text.primary }}
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      筛选条件
                    </label>
                    
                    <div className="space-y-2">
                      {/* 库存状态复选框 */}
                      <div 
                        className="p-3 rounded-lg border transition-all duration-200 hover:border-opacity-60 cursor-pointer"
                        style={{ 
                          backgroundColor: config.background.surface,
                          borderColor: searchState.formData.has_remain === true 
                            ? config.gradient.primary 
                            : config.border.light
                        }}
                      >
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchState.formData.has_remain === true}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateFormData('has_remain', e.target.checked ? true : undefined)
                            }}
                            className="w-4 h-4 rounded border transition-all duration-200 mr-3"
                            style={{
                              accentColor: config.gradient.primary,
                              borderColor: config.border.medium
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div 
                              className="text-xs font-medium"
                              style={{ color: config.text.primary }}
                            >
                              仅显示有库存图书
                            </div>
                            <div 
                              className="text-xs opacity-75"
                              style={{ color: config.text.muted }}
                            >
                              过滤掉已售罄的图书
                            </div>
                          </div>
                          <Package className="w-4 h-4 flex-shrink-0" style={{ color: config.status.success }} />
                        </label>
                      </div>

                      {/* 电子书复选框 */}
                      <div 
                        className="p-3 rounded-lg border transition-all duration-200 hover:border-opacity-60 cursor-pointer"
                        style={{ 
                          backgroundColor: config.background.surface,
                          borderColor: searchState.formData.has_ebook === true 
                            ? config.gradient.primary 
                            : config.border.light
                        }}
                      >
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchState.formData.has_ebook === true}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateFormData('has_ebook', e.target.checked ? true : undefined)
                            }}
                            className="w-4 h-4 rounded border transition-all duration-200 mr-3"
                            style={{
                              accentColor: config.gradient.primary,
                              borderColor: config.border.medium
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div 
                              className="text-xs font-medium"
                              style={{ color: config.text.primary }}
                            >
                              仅显示有电子书版本
                            </div>
                            <div 
                              className="text-xs opacity-75"
                              style={{ color: config.text.muted }}
                            >
                              筛选支持电子书下载的图书
                            </div>
                          </div>
                          <Download className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        {hasSearched && (
          <BookSearchResult 
            results={searchResults} 
            isSearching={isSearching}
            config={config}
          />
        )}
      </div>
    </div>
  )
}