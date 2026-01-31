// src/utils/assets.ts

import defaultBookCover from "@/assets/defaults/book-cover.png"
import defaultAvatar from "@/assets/defaults/avatar.png"
import defaultProductPic from "@/assets/defaults/product-pic.png"

// ---------- env ----------
const ASSETS_BASE =
  import.meta.env.VITE_ASSETS_BASE ?? ""

const BOOK_COVER_PATH =
  import.meta.env.VITE_BOOK_COVER_PATH ?? "covers"

const USER_AVATAR_PATH =
  import.meta.env.VITE_USER_AVATAR_PATH ?? "avatars"

// ---------- URL 构造 ----------
export function getBookCoverUrl(
  bookId?: string | number | null
): string {
  if (!bookId || !ASSETS_BASE) {
    return defaultBookCover
  }

  return `${ASSETS_BASE}/${BOOK_COVER_PATH}/${bookId}.png`
}

export function getUserAvatarUrl(
  userId?: string | number | null
): string {
  if (!userId || !ASSETS_BASE) {
    return defaultAvatar
  }

  return `${ASSETS_BASE}/${USER_AVATAR_PATH}/${userId}.png`
}

export function getProductPicUrl(
  productId?: string | number | null
): string {
  if (!productId || !ASSETS_BASE) {
    return defaultProductPic
  }

  return `${ASSETS_BASE}/${USER_AVATAR_PATH}/${productId}.png`
}

// ---------- img onError 兜底处理 ----------
export function handleImgError(
  e: React.SyntheticEvent<HTMLImageElement>,
  fallback: string
) {
  const img = e.currentTarget
  if (img.src !== fallback) {
    img.src = fallback
  }
}

/*
用例:
import {
  getBookCoverUrl,
  getUserAvatarUrl,
  handleImgError,
} from "@/utils/assets"

<img
  src={getBookCoverUrl(book.id)}
  onError={(e) =>
    handleImgError(e, getBookCoverUrl(null))
  }
/>

<img
  src={getUserAvatarUrl(user.userid)}
  onError={(e) =>
    handleImgError(e, getUserAvatarUrl(null))
  }
/>
*/