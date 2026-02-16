import React from 'react'
import { useThemeConfig } from '@/hooks/useTheme'

export const ThemeExample: React.FC = () => {
  const { config } = useThemeConfig()

  return (
    <div 
      className="p-6 rounded-lg"
      style={{ 
        backgroundColor: config.background.surface,
        border: `2px solid ${config.border.medium}`,
        boxShadow: `0 4px 6px ${config.shadow.medium}`
      }}
    >
      <h2 style={{ color: config.text.title }}>
        主题配置示例
      </h2>
      <p style={{ color: config.text.primary }}>
        使用 config.background.surface 背景色
      </p>
      <p style={{ color: config.text.secondary }}>
        使用 config.text.secondary 文字色
      </p>
      <div 
        className="mt-4 px-4 py-2 rounded"
        style={{ 
          background: config.gradient.primary,
          color: config.text.contrast 
        }}
      >
        渐变背景 + 高对比度文字
      </div>
    </div>
  )
}