import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetchJSON } from "@/utils/api"

// 导入拆分的组件
import SearchBar from "@/components/dashboard/SearchBar"
import UserProfileCard from "@/components/dashboard/UserProfileCard"
import BorrowQuotaCard from "@/components/dashboard/BorrowQuotaCard"
import WalletCard from "@/components/dashboard/WalletCard"
import DailyRecommendationCard from "@/components/dashboard/DailyRecommendationCard"
import QuickActions from "@/components/dashboard/QuickActions"
import BorrowRecordsModal, { type BorrowItem } from "@/components/dashboard/BorrowRecordsModal"
import CartWidget from "@/components/cart/CartWidget"

// 类型定义
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

// 默认数据
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

// 数据合并函数
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
  // 数据状态
  const [data, setData] = useState<DashboardData>(defaultDashboard)
  const [expAnim, setExpAnim] = useState(0)
  const [borrowAnim, setBorrowAnim] = useState(0)

  // 搜索状态
  const [searchType, setSearchType] = useState<"title" | "author">("title")
  const [keyword, setKeyword] = useState("")
  const navigate = useNavigate()

  // 借阅记录浮窗状态
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowItem[]>([])
  const [borrowFilter, setBorrowFilter] = useState<"all" | "returned" | "unreturned">("all")
  const [borrowLoading, setBorrowLoading] = useState(false)

  /* ================= 拉取 Dashboard 数据 ================= */
  useEffect(() => {
    apiFetchJSON<Partial<DashboardData>>("/me/dashboard")
      .then((res) => {
        if (!res) return
        // 注入后端数据
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

  /* ================= 打开借阅记录 ================= */
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

  /* ================= 搜索提交 ================= */
  const handleSearch = () => {
    if (!keyword.trim()) return

    navigate("/search_book", {
      state: {
        type: searchType, // ✅ 与 SearchBook.tsx 对齐
        keyword,
      },
    })
  }

  // 解构数据
  const { user, stats, wallet, coupon, dailyRecommendation } = data
  const borrowRemain = Math.max(0, stats.limit - stats.current)

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* 搜索栏 */}
      <SearchBar
        searchType={searchType}
        keyword={keyword}
        onSearchTypeChange={setSearchType}
        onKeywordChange={setKeyword}
        onSearch={handleSearch}
      />

      {/* 用户信息卡片 */}
      <UserProfileCard
        user={user}
        expAnim={expAnim}
      />

      {/* 借阅额度卡片 */}
      <BorrowQuotaCard
        borrowRemain={borrowRemain}
        stats={stats}
        borrowAnim={borrowAnim}
        onClick={openBorrowRecords}
      />

      {/* 钱包卡片 */}
      <WalletCard
        wallet={wallet}
        coupon={coupon}
      />

      {/* 今日推荐卡片 */}
      <DailyRecommendationCard
        dailyRecommendation={dailyRecommendation}
      />

      {/* 快捷操作 */}
      <QuickActions
        couponAvailableCount={coupon.availableCount}
      />

      {/* 借阅记录弹窗 */}
      <BorrowRecordsModal
        show={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        borrowRecords={borrowRecords}
        borrowFilter={borrowFilter}
        onFilterChange={setBorrowFilter}
        borrowLoading={borrowLoading}
      />
      <CartWidget />
    </div>
  )
}