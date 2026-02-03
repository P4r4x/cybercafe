// =============================
// src/layouts/MainLayout.tsx
// =============================
import { useState, ReactNode } from "react"
import {
  Home,
  Library,
  Crown,
  Coffee,
  MapPin,
  Search,
  LogOut,
  User,
} from "lucide-react"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { useDashboard } from "@/hooks"
import { LoadingToast } from "@/components/LoadingToast"
import { apiFetch } from "@/utils/api"
import CartWidget from "@/components/cart/CartWidget"
import PaymentWidget from "@/components/payment/PaymentWidget"

type Props = {
  children?: ReactNode
}

const menu = [
  { name: "主页", icon: Home, path: "/dashboard" },

  { name: "搜书", icon: Search, path: "/search_book" },
  { name: "书架", icon: Library, path: "/bookshelf" },
  { name: "茶饮", icon: Coffee, path: "/shop" },

  { name: "会员中心", icon: Crown, path: "/member" },

  { name: "座位预订", icon: MapPin, path: "/seats" },
  
]

export default function MainLayout({ children }: Props) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: dashboardData, loading } = useDashboard()

  const handleLogout = async () => {
    const res = await apiFetch("/logout", { method: "GET" })
    if (res.ok) {
      // 短暂延时以确保后端处理完成
        setTimeout(() => {
          navigate('/')
          }, 100)
      console.log('logout success')
    }
  }

  if (loading) {
    return <LoadingToast message="加载中..." variant="sakura" />
  }

  return (
    <div className="flex h-screen w-screen overflow-y-auto bg-[#fdf6ee]">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`
          flex-shrink-0
          transition-all duration-300 ease-in-out
          bg-[#ffedd5]
          shadow-lg
          ${expanded ? "w-48" : "w-16"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* 菜单项 */}
          <div className="flex-1 flex flex-col gap-1 p-3">
            {menu.map(item => {
              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/")

            return (
              <div
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`
                  flex cursor-pointer items-center gap-3
                  rounded-lg px-3 py-2
                  text-gray-700
                  transition-all duration-300 ease-in-out
                  hover:bg-[#fed7aa]
                  ${active ? "bg-[#fed7aa] font-medium" : ""}
                `}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span 
                  className={`
                    whitespace-nowrap text-sm
                    transition-all duration-300 ease-out
                    ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                  `}
                >
                  {item.name}
                </span>
              </div>
            )
            })}
          </div>

          {/* 用户信息区域 */}
          <div className="border-t border-[#fed7aa] p-3">
            {dashboardData.user.uid !== "guest" ? (
              <div className="space-y-1">
                {/* 用户信息 - 菜单项样式 */}
                <div
                  className={`
                    flex cursor-pointer items-center gap-3
                    rounded-lg px-3 py-2
                    text-gray-700
                    transition-all duration-300 ease-in-out
                    hover:bg-[#fed7aa]
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={dashboardData.user.avatar}
                      alt="用户头像"
                      className={`
                        rounded-full object-cover border-2 border-white shadow-sm
                        transition-all duration-300 ease-out transform
                        ${expanded ? "w-10 h-10 scale-100" : "w-6 h-6 scale-100"}
                      `}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${dashboardData.user.username}`
                      }}
                    />
                  </div>
                  <div 
                    className={`
                      flex flex-col min-w-0 overflow-hidden
                      transition-all duration-300 ease-out
                      ${expanded ? "opacity-100 max-w-32 translate-x-0" : "opacity-0 max-w-0 -translate-x-2"}
                    `}
                  >
                    <div className="text-sm font-medium text-gray-800 truncate whitespace-nowrap">
                      {dashboardData.user.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate whitespace-nowrap">
                      ID: {dashboardData.user.uid}
                    </div>
                  </div>
                </div>

                {/* 退出登录按钮 */}
                <button
                  onClick={handleLogout}
                  className={`
                    flex items-center gap-3 w-full
                    rounded-lg px-3 py-2
                    text-sm text-gray-700
                    transition-all duration-300 ease-in-out
                    hover:bg-red-50 hover:text-red-600
                  `}
                  title="退出登录"
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  <span 
                    className={`
                      whitespace-nowrap transition-all duration-300 ease-out
                      ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                    `}
                  >
                    退出登录
                  </span>
                </button>
              </div>
            ) : (
              /* 未登录状态 - 菜单项样式 */
              <div
                className={`
                  flex cursor-pointer items-center gap-3
                  rounded-lg px-3 py-2
                  text-gray-700
                  transition-all duration-300 ease-in-out
                  hover:bg-[#fed7aa]
                `}
                onClick={() => navigate('/login')}
              >
                <div className={`
                  rounded-full bg-gray-200 flex items-center justify-center
                  transition-all duration-300 ease-out transform
                  ${expanded ? "w-10 h-10 scale-100" : "w-6 h-6 scale-100"}
                `}>
                  <User size={16} className="text-gray-500 transition-all duration-200" />
                </div>
                <span 
                  className={`
                    whitespace-nowrap text-sm text-gray-600
                    transition-all duration-300 ease-out
                    ${expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
                  `}
                >
                  未登录
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-6">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* 全局悬浮组件 */}
      <CartWidget />
      <PaymentWidget />
    </div>
  )
}
