import React from 'react'

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
)

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={i === lines - 1 ? 'w-3/4 h-4' : 'w-full h-4'} />
    ))}
  </div>
)

export const SkeletonCircle: React.FC<{ size?: string }> = ({ size = 'w-12 h-12' }) => (
  <Skeleton className={`${size} rounded-full`} />
)

export const SkeletonRect: React.FC<{ width?: string; height?: string; className?: string }> = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <Skeleton className={`${width} ${height} ${className}`} />
)
