import React from 'react'
import { Skeleton, SkeletonText, SkeletonRect } from '@/components/ui/Skeleton'

export const BookDetailSkeleton: React.FC = () => {
  return (
    <div 
      className="flex flex-col items-center justify-start min-h-screen pt-8 pb-8"
      style={{
        background: 'linear-gradient(180deg, #FFF8F3 0%, #FFE8DA 50%, #FFF8F3 100%)'
      }}
    >
      <div className="max-w-4xl w-full px-6">
        {/* 返回按钮占位 */}
        <div className="mb-6">
          <Skeleton className="w-24 h-8 rounded-full" />
        </div>

        <div
          className="rounded-xl p-8"
          style={{
            background: '#FFF8F3',
            border: '1px solid #FFE4D6'
          }}
        >
          <div className="flex gap-10">
            {/* 左侧 */}
            <div className="flex flex-col items-center w-56">
              {/* 封面占位 */}
              <Skeleton className="w-48 h-72 rounded-lg mb-6" />

              {/* 按钮占位 */}
              <div className="w-full space-y-3">
                <Skeleton className="w-full h-11 rounded-full" />
                <Skeleton className="w-full h-11 rounded-full" />
                <Skeleton className="w-full h-11 rounded-full" />
              </div>
            </div>

            {/* 右侧 */}
            <div className="flex-1">
              {/* 标题 */}
              <Skeleton className="w-3/4 h-9 rounded mb-2" />

              {/* 作者 */}
              <Skeleton className="w-1/2 h-5 rounded mb-6" />

              {/* 标签 */}
              <div className="flex gap-2 mb-6">
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>

              {/* 分割线 */}
              <SkeletonRect className="w-full h-px mb-6" />

              {/* 简介 */}
              <div className="space-y-2">
                <Skeleton className="w-16 h-4 rounded" />
                <SkeletonText lines={4} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
