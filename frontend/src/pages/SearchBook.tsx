import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { useLocation,useNavigate } from "react-router-dom"
import {
  getBookCoverUrl,
  handleImgError,
} from "@/utils/assets"
import { apiFetchJSON } from "@/utils/api"

type Book = {
  uuid: string | null
  id: string
  total: number
  remain: number
  title: string
  author: string
  publisher: string
  price: number
  has_ebook: boolean
}

type SearchSnapshot = {
  simpleMode: SimpleMode
  simpleKeyword: string
  advancedOpen: boolean
  author: string
  publisher: string
  priceMin: string
  priceMax: string
  hasRemain?: boolean
  hasEbook?: boolean
}


type SimpleMode = "title" | "author"

type DashboardSearchState = {
  type?: SimpleMode
  keyword?: string
}

export default function SearchBook() {
  /* ================= 路由状态 ================= */
  const location = useLocation()
  const dashboardState = location.state as DashboardSearchState | null

  const navigate = useNavigate()

  /**
   * 用 ref 控制：
   * Dashboard 触发的自动搜索，只允许执行一次
   */
  const autoSearchDoneRef = useRef(false)

  /* ================= 简单搜索 ================= */
  const [simpleMode, setSimpleMode] = useState<SimpleMode>("title")
  const [simpleKeyword, setSimpleKeyword] = useState("")

  /* ================= 高级搜索 ================= */
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [author, setAuthor] = useState("")
  const [publisher, setPublisher] = useState("")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [hasRemain, setHasRemain] = useState<boolean | undefined>(undefined)
  const [hasEbook, setHasEbook] = useState<boolean | undefined>(undefined)

  /* ================= 搜索快照 ================= */
  const buildSnapshot = (): SearchSnapshot => ({
    simpleMode,
    simpleKeyword,
    advancedOpen,
    author,
    publisher,
    priceMin,
    priceMax,
    hasRemain,
    hasEbook,
  })
  const syncUrl = () => {
    const snapshot = buildSnapshot()
    const encoded = encodeURIComponent(JSON.stringify(snapshot))
    navigate(`?q=${encoded}`, { replace: true })
  }


  /* ================= 结果 ================= */
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [books, setBooks] = useState<Book[]>([])

  /* ================= 搜索逻辑 ================= */
  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    syncUrl()

    const payload: Record<string, any> = {}

    if (!advancedOpen) {
      if (simpleKeyword.trim()) {
        if (simpleMode === "title") payload.title = simpleKeyword
        if (simpleMode === "author") payload.author = simpleKeyword
      }
    } else {
      if (simpleKeyword.trim()) payload.title = simpleKeyword
      if (author.trim()) payload.author = author
      if (publisher.trim()) payload.publisher = publisher
      if (priceMin) payload.price_min = priceMin
      if (priceMax) payload.price_max = priceMax
      if (hasRemain !== undefined) payload.has_remain = hasRemain
      if (hasEbook !== undefined) payload.has_ebook = hasEbook
    }

try {
      const data = await apiFetchJSON<{items: Book[]}>("/books/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      setBooks(Array.isArray(data.items) ? data.items : [])
    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
   * Dashboard → SearchBook 自动搜索 唯一入口
   * ===================================================== */
  useEffect(() => {
    if (autoSearchDoneRef.current) return
    if (!dashboardState?.keyword || !dashboardState?.type) return

    // 1 初始化搜索状态
    setAdvancedOpen(false)
    setSimpleMode(dashboardState.type)
    setSimpleKeyword(dashboardState.keyword)

    // 2 标记：允许下一次 effect 触发自动搜索
    autoSearchDoneRef.current = true
  }, [dashboardState])

  /**
   * 当 simpleKeyword / simpleMode 就绪后
   * 执行一次真正的搜索
   */
  useEffect(() => {
    if (!autoSearchDoneRef.current) return
    if (!simpleKeyword.trim()) return

    handleSearch()
  }, [simpleKeyword, simpleMode])

  /* 
  * 解析 URL 中的搜索快照 并初始化搜索状态
  *
  * 仅在组件挂载时执行一次, 出错直接忽略（防脏 URL）
  */
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get("q")
    if (!q) return

    try {
      const snapshot = JSON.parse(decodeURIComponent(q)) as SearchSnapshot

      setSimpleMode(snapshot.simpleMode)
      setSimpleKeyword(snapshot.simpleKeyword)
      setAdvancedOpen(snapshot.advancedOpen)
      setAuthor(snapshot.author)
      setPublisher(snapshot.publisher)
      setPriceMin(snapshot.priceMin)
      setPriceMax(snapshot.priceMax)
      setHasRemain(snapshot.hasRemain)
      setHasEbook(snapshot.hasEbook)

      autoSearchDoneRef.current = true
    } catch {}
  }, [])

  /*
  * 防止 Dashboard 状态覆盖 URL 状态
  */
  useEffect(() => {
    // 如果 URL 已有状态，说明是返回或刷新
    // 原则是 URL 优先，Dashboard 次之
    if (location.search) return

    if (autoSearchDoneRef.current) return
    if (!dashboardState?.keyword || !dashboardState?.type) return

    setAdvancedOpen(false)
    setSimpleMode(dashboardState.type)
    setSimpleKeyword(dashboardState.keyword)

    autoSearchDoneRef.current = true
  }, [dashboardState])


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
            onChange={(e) => setSimpleMode(e.target.value as SimpleMode)}
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
