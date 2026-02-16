import React, { useState, useEffect } from 'react'
import { useThemeConfig } from '@/hooks/useTheme'
import { BorrowRecordCard } from './BorrowRecordCard'
import { AccountProfile } from './AccountProfile'
import { GreetingCard } from '@/components/dashboard/GreetingCard'
import { useApi } from '@/hooks/useApi'

// 用户信息接口
interface UserInfo {
  uid: string
  username: string
  level: number
  exp: number
  exp_required: number
  balance: string
  avatar?: string // 用户头像URL（可选）
}

// 借阅统计接口
interface BorrowStats {
  current: number
  limit: number
}

// Dashboard数据接口
interface DashboardData {
  user: UserInfo
  stats: BorrowStats
}

export const Dashboard: React.FC = () => {
  const { config } = useThemeConfig()
  const { get } = useApi()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 获取Dashboard数据
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const data = await get<DashboardData>('/me/dashboard')
      
      // 为演示目的，添加测试头像（实际使用时移除）
      if (data.user && !data.user.avatar) {
        data.user.avatar = 'https://picsum.photos/seed/user123/200/200.jpg'
      }
      
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // useApi已经处理了错误提示和401跳转
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span style={{ color: config.text.secondary }}>加载中...</span>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-8">
        <span style={{ color: config.text.secondary }}>无法加载用户信息</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* 欢迎卡片 */}
      <GreetingCard />

      {/* 借阅记录 */}
      <BorrowRecordCard stats={dashboardData.stats} />

      {/* 账户简介 */}
      <AccountProfile userInfo={dashboardData.user} />


    </div>
  )
}