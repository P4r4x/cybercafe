import React from 'react'
import { useThemeConfig } from '@/hooks/useTheme'
import { Dashboard } from '@/components/dashboard'
import { MiniSearch } from '@/components/search/MiniSearch'

import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const { config } = useThemeConfig()
  const navigate = useNavigate()

  return (
    <>
      {/* 页面背景容器 */}
      <div className="relative min-h-screen bg-[#ffe5e0] dark:bg-[#3c0042] overflow-hidden">
        {/* 运动网格背景 */}
        <div className="pointer-events-none absolute inset-0 bg-moving-grid" />

        {/* 页面内容 */}
        <div className="relative z-10">
          <div className="max-w-6xl mx-auto p-6 pb-8">
            {/* 顶部标题和搜索栏 */}
            <div className="flex items-center justify-between mb-6">
              <h1
                className={`text-3xl font-bold transition-colors duration-300`}
                style={{ color: config.text.title }}
              >
                CyberCafe 主页
              </h1>

              {/* 迷你搜索组件 */}
              <div className="w-96 hidden md:block">
                <MiniSearch />
              </div>
            </div>

            {/* Dashboard区域 */}
            <div className="mb-8">
              <Dashboard />
            </div>

            {/* 其他功能区域 */}
            <div
              className="p-6 rounded-xl shadow-lg"
              style={{
                backgroundColor: config.background.surface,
                border: `1px solid ${config.border.light}`
              }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: config.text.primary }}
              >
                快捷功能
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: config.background.secondary }}
                  onClick={() => navigate('/home')}
                >
                  <div className="text-2xl mb-2">🏠</div>
                  <p style={{ color: config.text.secondary }}>主页</p>
                </div>
                <div
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: config.background.secondary }}
                  onClick={() => navigate('/searchbook')}
                >
                  <div className="text-2xl mb-2">🔍</div>
                  <p style={{ color: config.text.secondary }}>搜书</p>
                </div>
                <div
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: config.background.secondary }}
                  onClick={() => navigate('/bookshelf')}
                >
                  <div className="text-2xl mb-2">📚</div>
                  <p style={{ color: config.text.secondary }}>书架</p>
                </div>
                <div
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: config.background.secondary }}
                >
                  <div className="text-2xl mb-2">🛒</div>
                  <p style={{ color: config.text.secondary }}>订单</p>
                </div>
                <div
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: config.background.secondary }}
                >
                  <div className="text-2xl mb-2">👤</div>
                  <p style={{ color: config.text.secondary }}>会员中心</p>
                </div>
                <div
                  className="p-4 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: config.background.secondary }}
                  onClick={() => navigate('/image-examples')}
                >
                  <div className="text-2xl mb-2">🖼️</div>
                  <p style={{ color: config.text.secondary }}>图片示例</p>
                </div>
              </div>
            </div>

            {/* 移动端搜索栏 */}
            <div className="md:hidden mt-6">
              <MiniSearch />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
