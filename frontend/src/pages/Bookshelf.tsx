import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getBookCoverUrl, handleImgError } from "@/utils/assets"
import { apiFetchJSON } from "@/utils/api"
import CartWidget from "@/components/cart/CartWidget"

const PAGE_SIZE = 6

type Publisher = {
  String: string
  Valid: boolean
}

type BookItem = {
  ID: string
  UUID: string
  Title: string
  Author: string
  Publisher: Publisher
  Price: string
}

type Resp = {
  list: BookItem[]
  page: number
  page_size: number
  total: number
}

export default function Bookshelf() {
  const navigate = useNavigate()
  const [list, setList] = useState<BookItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [direction, setDirection] = useState<"left" | "right">("right")

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    fetchList()
  }, [page])

async function fetchList() {
    try {
      const data = await apiFetchJSON<Resp>(`/me/bookshelf?page=${page}&page_size=${PAGE_SIZE}`)
      setList(data.list)
      setTotal(data.total)
    } catch (err) {
      // 401 会自动跳转，其他错误静默处理
      if (err instanceof Error && !err.message.includes('Unauthorized: redirecting to login')) {
        console.warn("fetch bookshelf failed:", err)
      }
    }
  }

  function prevPage() {
    if (page <= 1) return
    setDirection("left")
    setPage(p => p - 1)
  }

  function nextPage() {
    if (page >= totalPages) return
    setDirection("right")
    setPage(p => p + 1)
  }

  const placeholders = Array.from({
    length: Math.max(0, PAGE_SIZE - list.length),
  })

  return (
    <div className="p-6 h-[calc(100vh-40px)] bg-gray-50 flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        我的书架
      </h2>

      {/* 书架 */}
      <div
        key={page}
        className={`
          grid grid-cols-3 gap-6 flex-1
          transition-all duration-150
          ${direction === "right" ? "translate-x-1 opacity-95" : ""}
          ${direction === "left" ? "-translate-x-1 opacity-95" : ""}
        `}
      >
        {list.map(book => (
          <div
            key={book.UUID}
            onClick={() =>
              navigate(`/search_books/${book.ID}`)
            }
            className="
              group flex h-[180px] cursor-pointer
              rounded-xl bg-white
              border border-rose-100
              shadow-sm
            "
          >
            {/* 封面 */}
            <div
              className="
                w-28 h-full overflow-hidden rounded-l-xl
                bg-gray-100
              "
            >
              <img
                src={getBookCoverUrl(book.ID)}
                onError={e =>
                  handleImgError(e, getBookCoverUrl(null))
                }
                className="
                  w-full h-full object-cover
                  transform scale-100
                  group-hover:scale-[1.05]
                  transition-transform duration-150
                "
              />
            </div>

            {/* 信息 */}
            <div
              className="
                flex flex-col justify-between p-3 flex-1
                transform translate-y-0
                group-hover:-translate-y-[1px]
                transition-transform duration-150
              "
            >
              <div>
                <div className="text-lg font-medium text-gray-800 truncate">
                  {book.Title}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {book.Author}
                </div>
                {book.Publisher?.Valid && (
                  <div className="text-xs text-gray-400 truncate">
                    {book.Publisher.String}
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-gray-500">
                ¥ {book.Price}
              </div>
            </div>
          </div>
        ))}

        {/* 占位 */}
        {placeholders.map((_, i) => (
          <div
            key={i}
            className="
              flex h-[180px] rounded-xl
              bg-rose-50/60
              border border-dashed border-rose-200
            "
          >
            <div className="w-28 bg-rose-100/40 rounded-l-xl" />
          </div>
        ))}
      </div>

      {/* 分页 */}
      <div className="mt-4 h-12 flex items-center justify-center gap-6">
        <button
          onClick={prevPage}
          disabled={page <= 1}
          className="
            w-9 h-9 rounded-full border
            flex items-center justify-center
            text-gray-500
            hover:bg-rose-100 hover:text-rose-500
            disabled:opacity-30
            transition-colors
          "
        >
          <ChevronLeft size={18} />
        </button>

        <div className="px-4 py-1 rounded-full bg-rose-100 text-rose-700 text-sm">
          第 <span className="font-semibold">{page}</span> /{" "}
          {totalPages} 页
        </div>

        <button
          onClick={nextPage}
          disabled={page >= totalPages}
          className="
            w-9 h-9 rounded-full border
            flex items-center justify-center
            text-gray-500
            hover:bg-rose-100 hover:text-rose-500
            disabled:opacity-30
            transition-colors
          "
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <CartWidget />
    </div>
  )
}
