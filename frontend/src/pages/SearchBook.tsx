import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { useLocation,useNavigate } from "react-router-dom"
import {
  getBookCoverUrl,
  handleImgError,
} from "@/utils/assets"
import { useSearchBook } from "@/hooks"
import type { BookListItem } from "@/types"

export default function SearchBook() {
  /* ================= 路由状态 ================= */
  const location = useLocation()
  const navigate = useNavigate()
  const dashboardState = location.state as any

  // 使用新的 hook 管理所有搜索相关状态和操作
  const {
    // 简单搜索状态
    simpleMode,
    simpleKeyword,
    setSimpleMode,
    setSimpleKeyword,
    
    // 高级搜索状态
    advancedOpen,
    author,
    publisher,
    priceMin,
    priceMax,
    hasRemain,
    hasEbook,
    setAdvancedOpen,
    setAuthor,
    setPublisher,
    setPriceMin,
    setPriceMax,
    setHasRemain,
    setHasEbook,
    
    // 搜索结果
    books,
    loading,
    searched,
    
    // 操作方法
    handleSearch,
    resetSearch,
  } = useSearchBook({ dashboardState })

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#fdf6ee] p-8">
      {/* ================= 搜索卡片 ================= */}
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        {/* ---------- 简单搜索 ---------- */}
        <div className="flex items-center gap-3">
          <select
            value={simpleMode}
            disabled={advancedOpen}
            onChange={(e) => setSimpleMode(e.target.value as any)}
            className={`
              rounded-xl border px-3 py-2 text-sm
              focus:outline-none
              ${
                advancedOpen
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                  : "bg-white border-rose-200 focus:border-rose-400"
              }
            `}
          >
            <option value="title">书名</option>
            <option value="author">作者</option>
          </select>

          <input
            value={simpleKeyword}
            onChange={(e) => setSimpleKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={simpleMode === "title" ? "输入书名" : "输入作者名"}
            className="flex-1 rounded-xl border border-rose-200 px-4 py-2 text-sm
                       focus:border-rose-400 focus:outline-none"
          />

          <button
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-xl bg-rose-400 px-5 py-2
                       text-white hover:bg-rose-500 transition"
          >
            <Search size={16} />
            搜索
          </button>
        </div>

        {/* ---------- 高级搜索开关 ---------- */}
        <div
          onClick={() => {
            const next = !advancedOpen
            setAdvancedOpen(next)
            if (next) setSimpleMode("title")
          }}
          className="mt-4 flex cursor-pointer items-center gap-1 text-sm text-rose-500"
        >
          {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          高级搜索
        </div>

        {/* ---------- 高级搜索区域 ---------- */}
        {advancedOpen && (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-[#fff7ed] p-4 md:grid-cols-2">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="作者（精确匹配）"
              className="rounded-lg border px-3 py-2 text-sm"
            />

            <input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="出版社（精确匹配）"
              className="rounded-lg border px-3 py-2 text-sm"
            />

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="最低价格"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="最高价格"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasRemain ?? false}
                onChange={(e) =>
                  setHasRemain(e.target.checked ? true : undefined)
                }
              />
              仅显示有库存
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasEbook ?? false}
                onChange={(e) =>
                  setHasEbook(e.target.checked ? true : undefined)
                }
              />
              仅显示有电子书
            </label>
          </div>
        )}
      </div>

      {/* ================= 搜索结果 ================= */}
      <div className="mx-auto mt-8 max-w-4xl">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-rose-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-rose-400 border-t-transparent"></div>
            <span>搜索中…</span>
          </div>
        )}

        {!loading && searched && books.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">
            没有符合条件的图书
          </div>
        )}

        <div className="space-y-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow"
            >
              <div className="relative h-24 w-16 flex-shrink-0">
                <img
                  src={getBookCoverUrl(book.id)}
                  onError={(e) =>
                    handleImgError(e, getBookCoverUrl(null))
                  }
                  className="h-full w-full rounded object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="text-lg font-semibold text-rose-500">
                  {book.title}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {book.author} · {book.publisher}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  库存余量：{book.remain}
                </div>

                {book.has_ebook && (
                  <span className="mt-2 inline-block rounded bg-rose-100 px-2 py-1 text-xs text-rose-600">
                    电子书
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-rose-500">
                  ¥{book.price}
                </div>
              </div>

              <div>
                <a
                  href={`/search_books/${book.id}`}
                  className="rounded-lg border border-rose-300 px-4 py-2 text-sm
                             text-rose-500 transition hover:bg-rose-50"
                >
                  详情
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}