import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingCart,
  BookOpen,
  Crown,
  Ticket,
  Coffee,
  Search,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { apiFetchJSON } from "@/utils/api"

type DashboardData = {
  user: {
    uid: string
    username: string
    avatar: string
    bio: string
    level: number
    exp: number
    exp_required: number
    balance: number
  }
  stats: {
    current: number
    limit: number
  }
  wallet: { balance: number }
  coupon: { availableCount: number }
  dailyRecommendation: { bookId: string; title: string }
}

type BorrowItem = {
  book_id: string
  title: string
  borrow_at: string 
  due_at: string
  return_at?: string
}

const defaultDashboard: DashboardData = {
  user: {
    uid: "guest",
    username: "访客",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=guest",
    bio: "保持阅读，持续进化",
    level: 1,
    exp: 0,
    exp_required: 100,
    balance: 0,
  },
  stats: {
    current: 0,
    limit: 0,
  },
  wallet: { balance: 0 },
  coupon: { availableCount: 0 },
  dailyRecommendation: { bookId: "", title: "暂无推荐" },
}

function mergeDashboard(
  base: DashboardData,
  patch: Partial<DashboardData>
): DashboardData {
  const merged = {
    ...base,
    ...patch,
    user: { ...base.user, ...patch.user },
    stats: { ...base.stats, ...patch.stats },
    wallet: { ...base.wallet, ...patch.wallet },
    coupon: { ...base.coupon, ...patch.coupon },
    dailyRecommendation: {
      ...base.dailyRecommendation,
      ...patch.dailyRecommendation,
    },
  }
  merged.wallet.balance = merged.user.balance ?? merged.wallet.balance
  return merged
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(defaultDashboard)
  const [expAnim, setExpAnim] = useState(0)
  const [borrowAnim, setBorrowAnim] = useState(0)

  /* ================= 搜索 ================= */
  const [searchType, setSearchType] = useState<"title" | "author">("title")
  const [keyword, setKeyword] = useState("")

  const navigate = useNavigate()

  /* ================= 借阅记录浮窗 ================= */
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowItem[]>([])
  const [borrowFilter, setBorrowFilter] = useState<"all" | "returned" | "unreturned">("all")
  const [borrowLoading, setBorrowLoading] = useState(false)

  /* ================= 拉取 Dashboard 数据 ================= */
useEffect(() => {
    apiFetchJSON<Partial<DashboardData>>("/me/dashboard")
      .then((res) => {
        if (!res) return
        setData((prev) => mergeDashboard(prev, res))
      })
      .catch((err) => {
        // 401 会自动跳转，其他错误静默处理
        if (!err.message.includes('Unauthorized: redirecting to login')) {
          console.warn("dashboard fallback:", err)
        }
      })
  }, [])

  /* ================= 动画：经验 & 借阅额度 ================= */
  useEffect(() => {
    const maxExp = data.user.exp_required || 1
    const expTarget = Math.min(
      100,
      Math.round((data.user.exp / maxExp) * 100)
    )

    const borrowRemain = Math.max(
      0,
      data.stats.limit - data.stats.current
    )

    let expStart = 0
    const expInterval = setInterval(() => {
      expStart += 2
      if (expStart >= expTarget) {
        setExpAnim(expTarget)
        clearInterval(expInterval)
      } else {
        setExpAnim(expStart)
      }
    }, 15)

    let borrowStart = 0
    const borrowInterval = setInterval(() => {
      borrowStart += 1
      if (borrowStart >= borrowRemain) {
        setBorrowAnim(borrowRemain)
        clearInterval(borrowInterval)
      } else {
        setBorrowAnim(borrowStart)
      }
    }, 25)

    return () => {
      clearInterval(expInterval)
      clearInterval(borrowInterval)
    }
  }, [data])

  /* =====================================================
   * 点击借阅额度, 拉取历史记录
   * ===================================================== */

  const openBorrowRecords = async () => {
    setShowBorrowModal(true)

    if (borrowRecords.length > 0) return // 已加载不重复请求

    setBorrowLoading(true)
    try {
const data = await apiFetchJSON<{records: any[]}>("/me/recent_book_records")
      setBorrowRecords(data.records || [])
    } catch (e) {
      console.warn("fetch borrow records failed:", e)
    } finally {
      setBorrowLoading(false)
    }
  }


  /* =====================================================
   * 搜索提交（Dashboard → SearchBook）
   * ===================================================== */
  const handleSearch = () => {
    if (!keyword.trim()) return

    navigate("/search_book", {
      state: {
        type: searchType, // ✅ 与 SearchBook.tsx 对齐
        keyword,
      },
    })
  }

  const { user, stats, wallet, coupon, dailyRecommendation } = data
  const borrowRemain = Math.max(0, stats.limit - stats.current)


  /* ================= 借阅记录工具函数 ================= */
  const isNearlyDue = (item: BorrowItem) => {
    if (item.return_at) return false
      const due = new Date(item.due_at).getTime()
      const now = Date.now()
      const remainDays = (due - now) / (1000 * 60 * 60 * 24)
    return remainDays <= 3
  }

  const getOverdueDays = (item: BorrowItem) => {
    if (item.return_at) return 0

    const due = new Date(item.due_at).getTime()
    const now = Date.now()

    if (now <= due) return 0

    return Math.ceil((now - due) / (1000 * 60 * 60 * 24))
  }

  const isOverdue = (item: BorrowItem) => {
    return !item.return_at && getOverdueDays(item) > 0
  }

  /* ================= 借阅记录派生数据 ================= */
  const filteredRecords = borrowRecords
    .filter((r) => {
      if (borrowFilter === "returned") return !!r.return_at
      if (borrowFilter === "unreturned") return !r.return_at
      return true
    })
    .sort(
      (a, b) =>
        new Date(b.borrow_at).getTime() -
        new Date(a.borrow_at).getTime()
    )

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* ===== 搜书栏 ===== */}
      <motion.div
        className="col-span-12 flex justify-end"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow max-w-md w-full">
          {/* 搜索类型 */}
          <div className="flex rounded-lg overflow-hidden border text-xs">
            {["title", "author"].map((t) => (
              <button
                key={t}
                onClick={() => setSearchType(t as any)}
className={`px-2 py-1 transition ${
                  searchType === t
                    ? "bg-gradient-to-r from-pink-300 to-rose-300 text-white"
                    : "bg-white text-gray-500 hover:bg-pink-50"
                }`}
              >
                {t === "title" ? "书名" : "作者"}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <div className="relative flex-1">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜书…"
              className="w-full rounded-lg border px-3 py-1.5 pr-8 text-xs
                         focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
className="rounded-lg bg-gradient-to-r from-pink-400 to-rose-400
                       px-3 py-1.5 text-xs text-white hover:opacity-90"
          >
            搜索
          </button>
        </div>
      </motion.div>

      {/* ================= 用户信息 ================= */}
      <motion.div
        className="col-span-5 row-span-2 rounded-2xl bg-white p-6 shadow
                   transition-transform transform hover:scale-105 hover:-translate-y-1"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <img src={user.avatar} className="h-16 w-16 rounded-full border" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{user.username}</span>
            <span className="text-xs text-gray-400">UID: {user.uid}</span>
            <span className="text-sm text-gray-500">{user.bio}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2">
<Crown className="text-rose-400" size={16} />
            <span className="font-medium text-rose-500">
              {["白银", "黄金", "铂金", "钻石", "至尊"][user.level - 1] || "会员"}
            </span>
          </div>

          <div
            className="mt-2 h-2 w-full rounded-full bg-pink-100 relative group"
            title={`${user.exp}/${user.exp_required} XP`}
          >
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-pink-300 to-rose-300"
              initial={{ width: 0 }}
              animate={{ width: `${expAnim}%` }}
              transition={{ duration: 1.2 }}
            />
            <span className="absolute right-0 -top-6 text-xs text-gray-500
                             opacity-0 group-hover:opacity-100 transition-opacity">
              {user.exp}/{user.exp_required}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ================= 借阅额度 ================= */}
      <motion.div
        onClick={openBorrowRecords} // 点击打开浮窗
        className="col-span-4 row-span-1 rounded-2xl bg-white p-6 shadow
           cursor-pointer group
           transition-all duration-200
           hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 text-pink-500">
          <BookOpen />
          <span className="font-semibold">借阅额度</span>
        </div>

        <div className="mt-4 text-2xl font-bold">
          <AnimatePresence>
            <motion.span
              key={borrowAnim}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              {borrowRemain}/{stats.limit}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="mt-1 text-xs text-gray-400 opacity-0
                group-hover:opacity-100 transition-opacity">
          点击查看借阅记录
        </div>
      </motion.div>

      {/* ================= 钱包 ================= */}
      <motion.div
        className="col-span-3 row-span-2 rounded-2xl bg-white p-6 shadow
                   transition-transform transform hover:scale-105 hover:-translate-y-1"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
<div className="flex items-center gap-2 text-rose-400">
            <Ticket />
            <span className="font-semibold">余额</span>
          </div>
          <span className="text-lg font-bold">¥{wallet.balance}</span>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          可用优惠券: {coupon.availableCount} 张
        </div>
      </motion.div>

      {/* ================= 今日推荐 ================= */}
      <motion.div
        className="col-span-7 row-span-1 rounded-2xl bg-white p-6 shadow
                   transition-transform transform hover:scale-105 hover:-translate-y-1"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 text-rose-400">
          <BookOpen />
          <span className="font-semibold">今日推荐</span>
        </div>

        <div className="mt-6 text-center text-lg font-medium">
          {dailyRecommendation.title}
        </div>

        <div className="mt-2 text-center text-sm text-gray-400">
          点击查看详情
        </div>
      </motion.div>

      {/* ================= 快捷入口 ================= */}
      <motion.div
        className="col-span-12 rounded-2xl bg-white p-4 shadow
                   transition-transform transform hover:-translate-y-1"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="mb-2 text-sm font-semibold text-gray-500">快捷操作</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              icon: ShoppingCart,
              label: `购物车 (${coupon.availableCount})`,
              color: "bg-pink-50 text-pink-500 hover:bg-pink-100",
            },
            {
              icon: BookOpen,
              label: "电子书架",
              color: "bg-rose-50 text-rose-500 hover:bg-rose-100",
            },
            {
              icon: Coffee,
              label: "点单",
              color: "bg-green-50 text-green-600 hover:bg-green-100",
            },
            {
              icon: Crown,
              label: "会员中心",
              color: "bg-yellow-50 text-yellow-500 hover:bg-yellow-100",
            },
          ].map((btn, idx) => (
            <motion.button
              key={idx}
              className={`flex flex-col items-center gap-1 rounded-xl py-3
                          transition-transform ${btn.color}`}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <btn.icon />
              <span className="text-xs">{btn.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ================= 借阅记录浮窗 ================= */}
      <AnimatePresence>
        {showBorrowModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-[520px] rounded-2xl bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* ===== Header ===== */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-lg">借阅记录</span>
                <button
                  onClick={() => setShowBorrowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* ===== Filter ===== */}
              <div className="flex gap-2 mb-4 text-xs">
                {[
                  ["all", "全部"],
                  ["unreturned", "未归还"],
                  ["returned", "已归还"],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setBorrowFilter(k as any)}
                    className={`px-3 py-1 rounded-full border transition ${
                      borrowFilter === k
                        ? "bg-pink-400 text-white border-pink-400"
                        : "text-gray-500 hover:bg-pink-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ===== List ===== */}
              <div className="max-h-[360px] overflow-y-auto space-y-3">
{borrowLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                    <span></span>
                  </div>
                )}

                {!borrowLoading && filteredRecords.length === 0 && (
                  <div className="text-center text-sm text-gray-400">
                    暂无记录
                  </div>
                )}

                {filteredRecords.map((r) => (
                  <div
                    key={r.book_id + r.borrow_at}
                    className={`rounded-lg border p-3 text-sm ${
                      isOverdue(r)
                        ? "border-red-400 bg-red-100"
                        : isNearlyDue(r)
                        ? "border-red-300 bg-red-50"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="font-medium">{r.title}</div>
                    <div className="mt-1 text-xs text-gray-500 flex justify-between items-center">
                      <span>
                        借阅：{new Date(r.borrow_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`font-medium ${
                          isOverdue(r)
                            ? "text-red-600"
                            : r.return_at
                            ? "text-green-500"
                            : isNearlyDue(r)
                            ? "text-red-500"
                            : "text-rose-500"
                        }`}
                      >
                        {isOverdue(r)
                          ? `已逾期 ${getOverdueDays(r)} 天`
                          : r.return_at
                          ? `归还于 ${new Date(r.return_at).toLocaleDateString()}`
                          : `到期于 ${new Date(r.due_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
