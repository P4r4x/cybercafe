import React from 'react'
import { useThemeConfig } from '@/hooks/useTheme'

export const OrderSkeleton: React.FC = () => {
  const { config, isDark } = useThemeConfig()
  const skeletonBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  return (
    <div
      className="rounded-xl p-4 mb-3 animate-pulse"
      style={{
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: skeletonBg }} />
          <div className="w-20 h-4 rounded" style={{ backgroundColor: skeletonBg }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: skeletonBg }} />
          <div className="w-24 h-3 rounded" style={{ backgroundColor: skeletonBg }} />
          <div className="w-12 h-5 rounded-full" style={{ backgroundColor: skeletonBg }} />
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-24 h-4 rounded" style={{ backgroundColor: skeletonBg }} />
              <div className="w-6 h-3 rounded" style={{ backgroundColor: skeletonBg }} />
            </div>
            <div className="w-12 h-4 rounded" style={{ backgroundColor: skeletonBg }} />
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: config.border.light }}
      >
        <div className="w-20 h-5 rounded" style={{ backgroundColor: skeletonBg }} />
        <div className="flex gap-2">
          <div className="w-16 h-8 rounded-lg" style={{ backgroundColor: skeletonBg }} />
          <div className="w-16 h-8 rounded-lg" style={{ backgroundColor: skeletonBg }} />
        </div>
      </div>
    </div>
  )
}

export const OrderListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <OrderSkeleton key={i} />
      ))}
    </>
  )
}
