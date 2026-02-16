import React, { useState } from 'react'
import { useThemeConfig } from '@/hooks/useTheme'
import { useApi } from '@/hooks/useApi'
import { Book, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface BorrowRecord {
  book_id: string
  title: string
  borrow_at: string
  due_at: string
  return_at?: string
}

interface BorrowStats {
  current: number
  limit: number
}

interface BorrowRecordCardProps {
  stats: BorrowStats
}

export const BorrowRecordCard: React.FC<BorrowRecordCardProps> = ({ stats }) => {
  const { config } = useThemeConfig()
  const { get } = useApi()
  const [showRecords, setShowRecords] = useState(false)
  const [records, setRecords] = useState<BorrowRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'unreturned' | 'returned'>('all')
  const [isLoading, setIsLoading] = useState(false)

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const data = await get<{records: BorrowRecord[]}>('/me/recent_book_records')
      setRecords(data.records || [])
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowRecords = () => {
    setShowRecords(true)
    fetchRecords()
  }

  const remaining = stats.limit - stats.current
  const remainingPercent = (remaining / stats.limit) * 100

  const filteredRecords = records.filter(record => {
    if (filter === 'unreturned') return !record.return_at
    if (filter === 'returned') return !!record.return_at
    return true
  })

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date()
  }

  const isDueSoon = (dueAt: string) => {
    const due = new Date(dueAt)
    const now = new Date()
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 3 && diffDays > 0
  }

  const getRecordTextColor = (record: BorrowRecord) => {
    if (!record.return_at) {
      if (isOverdue(record.due_at)) return '#EF4444'
      if (isDueSoon(record.due_at)) return '#F59E0B'
      return config.text.contrast
    }
    return config.text.muted
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  return (
    <>
      <div 
        className="p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
        style={{ 
          backgroundColor: config.background.surface,
          border: `1px solid ${config.border.light}`
        }}
        onClick={handleShowRecords}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 
            className="font-semibold flex items-center gap-2"
            style={{ color: config.text.primary }}
          >
            <Book className="w-5 h-5" />
            借阅记录
          </h3>
          <span 
            className="text-sm px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: config.background.input,
              color: config.text.secondary
            }}
          >
            {stats.current}/{stats.limit}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: config.text.secondary }}>剩余额度</span>
            <span style={{ color: config.text.contrast }}>{remaining}/{stats.limit}</span>
          </div>
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: config.background.input }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${remainingPercent}%`,
                backgroundColor: remainingPercent > 3 ? '#48BB78' : remainingPercent > 0 ? '#F59E0B' : '#EF4444'
              }}
            />
          </div>
        </div>

        <p style={{ color: config.text.secondary }} className="text-sm">
          点击查看借阅记录
        </p>
      </div>

      {showRecords && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            className="w-full max-w-2xl max-h-[80vh] m-4 rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: config.background.surface }}
          >
            <div 
              className="p-6 border-b flex justify-between items-center"
              style={{ borderColor: config.border.light }}
            >
              <h2 style={{ color: config.text.title }} className="text-xl font-semibold">
                借阅记录
              </h2>
              <button
                onClick={() => setShowRecords(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span style={{ color: config.text.secondary }}>✕</span>
              </button>
            </div>

            <div className="p-6 pb-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ 
                    backgroundColor: filter === 'all' ? '#4299E1' : config.background.input 
                  }}
                >
                  全部 ({records.length})
                </button>
                <button
                  onClick={() => setFilter('unreturned')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unreturned' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ 
                    backgroundColor: filter === 'unreturned' ? '#EF4444' : config.background.input 
                  }}
                >
                  未归还 ({records.filter(r => !r.return_at).length})
                </button>
                <button
                  onClick={() => setFilter('returned')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'returned' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ 
                    backgroundColor: filter === 'returned' ? '#48BB78' : config.background.input 
                  }}
                >
                  已归还 ({records.filter(r => r.return_at).length})
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <div className="text-center py-8">
                  <span style={{ color: config.text.secondary }}>加载中...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <span style={{ color: config.text.secondary }}>暂无记录</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <div 
                      key={record.book_id}
                      className="p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: config.background.input,
                        borderColor: config.border.light
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 
                          className="font-medium"
                          style={{ color: config.text.primary }}
                        >
                          {record.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs">
                          {!record.return_at && isOverdue(record.due_at) && (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span style={{ color: '#EF4444' }}>已过期</span>
                            </>
                          )}
                          {!record.return_at && isDueSoon(record.due_at) && (
                            <>
                              <Clock className="w-3 h-3" />
                              <span style={{ color: '#F59E0B' }}>即将到期</span>
                            </>
                          )}
                          {record.return_at && (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span style={{ color: config.text.muted }}>已归还</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span style={{ color: config.text.secondary }}>
                          借阅: {formatDate(record.borrow_at)}
                        </span>
                        <span style={{ color: getRecordTextColor(record) }}>
                          {record.return_at 
                            ? `归还: ${formatDate(record.return_at)}`
                            : `到期: ${formatDate(record.due_at)}`
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
