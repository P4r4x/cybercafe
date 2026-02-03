import { useEffect, useState } from "react"
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom"
import { motion } from "framer-motion"
import { BookOpen, Eye, ArrowLeft } from "lucide-react"
import { getBookCoverUrl, handleImgError } from "@/utils/assets"
import { useToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { LoadingToast } from "@/components/LoadingToast"
import { useBook } from "@/hooks"
import type { Book } from "@/types"

// ---------------- page ----------------
export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const confirm = useConfirm()

  // 使用新的 hook 管理所有图书相关状态和操作
  const {
    book,
    loading,
    borrowing,
    inShelf,
    shelfLoading,
    handleShelfToggle,
    handleBorrow,
  } = useBook(id)

  // ---------- back ----------
  function handleBack() {
    const from = (location.state as any)?.from
    if (from) {
      navigate(from)
    } else {
      navigate(-1)
    }
  }

  if (loading) {
    return <LoadingToast message="" variant="sakura" />
  }
  if (!book) return <div className="p-8 text-gray-500">未找到书籍</div>

  const { intro, genre, field, award, words, summary } = book.extra || {}

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* back button */}
      <motion.button
        onClick={handleBack}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="
          mb-6 inline-flex items-center gap-2
          rounded-full px-4 py-2 text-sm
          border border-pink-200
          text-gray-700
          hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100
          transition
        "
      >
        <ArrowLeft size={16} /> 返回
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        {/* cover + buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <img
            src={getBookCoverUrl(book.id)}
            onError={e => handleImgError(e, getBookCoverUrl(null))}
            className="w-full rounded-xl shadow"
          />

          {/* 电子书预览 */}
          <button
            disabled={!book.has_ebook}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
              ${book.has_ebook ? "bg-rose-400 text-white hover:bg-rose-500" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
            `}
          >
            <Eye size={16} /> 预览电子书
          </button>

          {/* 加入/移除书架 */}
          <button
            onClick={handleShelfToggle}
            disabled={shelfLoading}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
              ${inShelf ? "bg-gray-400 text-white hover:bg-gray-500" : "bg-[#C65A3A] text-white hover:bg-[#B14E32]"}
            `}
          >
            {inShelf ? "已在书架" : "+ 加入书架"}
          </button>

          {/* 借阅 */}
          <button
            disabled={book.remain <= 0 || borrowing}
            onClick={handleBorrow}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
              ${book.remain > 0 ? "bg-pink-400 text-white hover:bg-pink-500" : "bg-gray-200 text-gray-400 cursor-not-allowed"}
            `}
          >
            <BookOpen size={16} /> 借阅
          </button>
        </motion.div>

        {/* info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-6"
        >
          <div>
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            <p className="text-gray-500 mt-1">{book.author}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <InfoItem label="出版社" value={book.publisher} />
            <InfoItem label="定价" value={`¥ ${book.price}`} />
            <InfoItem label="电子书" value={book.has_ebook ? "有" : "无"} />
            <InfoItem label="库存" value={`${book.remain} / ${book.total}`} />
            <InfoItem label="录入时间" value={new Date(book.created_at).toLocaleDateString()} />
          </div>

          {intro && <Section title="介绍" content={intro} />}
          {summary && <Section title="引言 / 梗概" content={summary} />}
          {genre && <Section title="风格" content={genre} />}
          {field && <Section title="领域" content={field} />}
          {award && <Section title="奖项" content={award} />}
          {words && <Section title="字数统计" content={words} />}
        </motion.div>
      </div>
    </div>
  )
}

// ---------------- components ----------------
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{content}</p>
    </div>
  )
}