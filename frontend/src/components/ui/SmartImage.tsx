import React, { useState } from 'react'
import { getImageUrl, createImageErrorHandler, useImage, ImageType } from '@/utils/image'
import { useThemeConfig } from '@/hooks/useTheme'

interface ImageProps {
  // 图片相关属性
  src?: string | null
  type?: ImageType
  alt?: string
  
  // 尺寸和样式
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
  
  // 行为控制
  preferDefault?: boolean
  showLoadingState?: boolean
  
  // 事件处理
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
  
  // 占位符
  placeholder?: string
  fallbackText?: string
  fallback?: React.ReactNode
}

/**
 * 智能图片组件，自动处理默认图片兜底逻辑
 */
export const SmartImage: React.FC<ImageProps> = ({
  src,
  type = 'fallback',
  alt = '',
  width,
  height,
  className = '',
  style = {},
  preferDefault = false,
  showLoadingState = true,
  onLoad,
  onError,
  placeholder,
  fallbackText,
  fallback
}) => {
  const { config } = useThemeConfig()
  const { url, isLoading } = useImage(src, type)
  const [imageError, setImageError] = useState(false)

  // 如果没有提供图片URL且要求显示占位符
  if (!src && placeholder) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{
          width,
          height,
          backgroundColor: config.background.secondary,
          border: `1px solid ${config.border.light}`,
          borderRadius: '8px',
          color: config.text.muted,
          fontSize: '14px',
          ...style
        }}
      >
        {placeholder}
      </div>
    )
  }

  // 如果没有图片URL但有fallback组件，直接显示fallback
  if (!src && fallback) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          width,
          height,
          backgroundColor: config.background.secondary,
          ...style
        }}
      >
        {fallback}
      </div>
    )
  }

  // 如果图片加载失败且有fallback组件，显示fallback
  if (imageError && fallback) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          width,
          height,
          backgroundColor: config.background.secondary,
          ...style
        }}
      >
        {fallback}
      </div>
    )
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true)
    if (onError) {
      onError(e)
    }
  }

  return (
    <div className="relative inline-block">
      {isLoading && showLoadingState && (
        <div 
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{
            backgroundColor: config.background.secondary,
            color: config.text.muted
          }}
        >
          <div 
            className="animate-spin w-4 h-4 border-2 rounded-full" 
            style={{ 
              borderTopColor: config.gradient.primary,
              borderRightColor: 'transparent',
              borderBottomColor: config.gradient.primary,
              borderLeftColor: 'transparent'
            }}
          />
        </div>
      )}
      
      <img
        src={url}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        style={{
          objectFit: 'cover',
          ...style
        }}
        onLoad={onLoad}
        onError={handleImageError}
      />
    </div>
  )
}

/**
 * 用户头像组件
 */
export const Avatar: React.FC<Omit<ImageProps, 'type'>> = (props) => {
  return (
    <SmartImage
      {...props}
      type="avatar"
      className={`rounded-full object-cover ${props.className || ''}`}
    />
  )
}

/**
 * 图书封面组件
 */
export const BookCover: React.FC<Omit<ImageProps, 'type'>> = (props) => {
  return (
    <SmartImage
      {...props}
      type="bookCover"
      className={`rounded-lg shadow-md ${props.className || ''}`}
    />
  )
}

/**
 * 通用占位符组件
 */
export const ImagePlaceholder: React.FC<{
  width?: string | number
  height?: string | number
  className?: string
  text?: string
  icon?: React.ReactNode
}> = ({ 
  width = '100%', 
  height = '200px', 
  className = '',
  text = '暂无图片',
  icon
}) => {
  const { config } = useThemeConfig()

  return (
    <div 
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        width,
        height,
        backgroundColor: config.background.secondary,
        border: `1px dashed ${config.border.light}`,
        borderRadius: '8px',
        color: config.text.muted
      }}
    >
      {icon && (
        <div className="mb-2" style={{ fontSize: '24px' }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: '12px' }}>
        {text}
      </div>
    </div>
  )
}

/**
 * 便捷的图片获取Hook
 * 直接返回最终可用的图片URL
 */
export const useImageUrl = (
  src: string | undefined | null,
  type: ImageType = 'fallback'
) => {
  const { url } = useImage(src, type)
  return url
}

export default SmartImage