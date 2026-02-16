import { useState, useEffect } from 'react'
/**
 * 图片工具函数
 * 用于获取用户头像、图书封面等图片，带有默认图片兜底逻辑
 */

// 默认图片路径
export const DEFAULT_IMAGES = {
  avatar: '/assets/default.png',
  bookCover: '/assets/default.png',
  fallback: '/assets/default.png'
} as const

// 图片类型
export type ImageType = keyof typeof DEFAULT_IMAGES

/**
 * 获取图片URL的封装函数
 * @param imageUrl 从后端获取的图片URL
 * @param type 图片类型，用于确定默认图片
 * @param preferDefault 是否优先使用默认图片（用于测试）
 * @returns 最终的图片URL
 */
export const getImageUrl = (
  imageUrl: string | undefined | null,
  type: ImageType = 'fallback',
  preferDefault: boolean = false
): string => {
  // 如果明确要求使用默认图片，直接返回
  if (preferDefault) {
    return DEFAULT_IMAGES[type]
  }

  // 如果有有效的图片URL，直接使用
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl
  }

  // 否则使用对应的默认图片
  return DEFAULT_IMAGES[type]
}

/**
 * 验证图片是否可访问
 * @param imageUrl 图片URL
 * @returns Promise<boolean> 图片是否可访问
 */
export const validateImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const img = new Image()
    return new Promise((resolve) => {
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = imageUrl
    })
  } catch {
    return false
  }
}

/**
 * 获取可访问的图片URL（带验证）
 * @param imageUrl 原始图片URL
 * @param type 图片类型
 * @param timeout 验证超时时间（毫秒）
 * @returns Promise<string> 可访问的图片URL
 */
export const getValidImageUrl = async (
  imageUrl: string | undefined | null,
  type: ImageType = 'fallback',
  timeout: number = 3000
): Promise<string> => {
  // 如果没有图片URL，直接返回默认图片
  if (!imageUrl || imageUrl.trim() === '') {
    return DEFAULT_IMAGES[type]
  }

  // 尝试验证原始图片
  try {
    const isValid = await Promise.race([
      validateImage(imageUrl),
      new Promise<boolean>((resolve) => 
        setTimeout(() => resolve(false), timeout)
      )
    ])

    return isValid ? imageUrl : DEFAULT_IMAGES[type]
  } catch {
    return DEFAULT_IMAGES[type]
  }
}

/**
 * React Hook：用于获取和管理图片URL
 * @param imageUrl 原始图片URL
 * @param type 图片类型
 * @returns {url, isValid, isLoading}
 */
export const useImage = (
  imageUrl: string | undefined | null,
  type: ImageType = 'fallback'
) => {
  const [url, setUrl] = useState<string>(DEFAULT_IMAGES[type])
  const [isValid, setIsValid] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      if (!imageUrl || imageUrl.trim() === '') {
        if (isMounted) {
          setUrl(DEFAULT_IMAGES[type])
          setIsValid(false)
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      
      try {
        const validUrl = await getValidImageUrl(imageUrl, type)
        if (isMounted) {
          setUrl(validUrl)
          setIsValid(validUrl === imageUrl)
        }
      } catch (error) {
        console.warn('Image loading failed:', error)
        if (isMounted) {
          setUrl(DEFAULT_IMAGES[type])
          setIsValid(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [imageUrl, type])

  return { url, isValid, isLoading }
}

/**
 * 为图片组件添加错误处理
 * @param onError 错误回调
 * @param type 图片类型
 * @returns 错误处理函数
 */
export const createImageErrorHandler = (
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void,
  type: ImageType = 'fallback'
) => {
  return (error: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('Image load failed, using default:', type)
    
    // 设置默认图片
    const img = error.currentTarget
    img.src = DEFAULT_IMAGES[type]
    
    // 调用自定义错误处理
    if (onError) {
      onError(error)
    }
  }
}

// CSS-in-JS 样式，用于图片加载状态
export const IMAGE_STYLES = {
  loading: {
    filter: 'blur(2px)',
    opacity: '0.7'
  },
  error: {
    filter: 'grayscale(100%)',
    opacity: '0.8'
  },
  loaded: {
    filter: 'none',
    opacity: '1'
  }
} as const