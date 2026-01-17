// =============================
// src/layouts/MainLayout.tsx
// =============================
import { useState, ReactNode } from "react"
import {
  Home,
  BookOpen,
  Library,
  Crown,
  Coffee,
  MapPin,
} from "lucide-react"
import { useNavigate, useLocation, Outlet } from "react-router-dom"

type Props = {
  children?: ReactNode
}

const menu = [
  { name: "主页", icon: Home, path: "/dashboard" },

  { name: "电子书架", icon: Library, path: "/bookshelf" },
  { name: "实体书借阅", icon: BookOpen, path: "/borrow" },

  { name: "会员中心", icon: Crown, path: "/member" },

  { name: "座位预订", icon: MapPin, path: "/seats" },
  { name: "点单", icon: Coffee, path: "/order" },
]

export default function MainLayout({ children }: Props) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fdf6ee]">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`
          flex-shrink-0
          transition-all duration-300
          bg-[#ffedd5]
          shadow-lg
          ${expanded ? "w-48" : "w-16"}
        `}
      >
        <div className="flex h-full flex-col gap-1 p-3">
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
                  transition-colors
                  hover:bg-[#fed7aa]
                  ${active ? "bg-[#fed7aa] font-medium" : ""}
                `}
              >
                <item.icon size={20} />
                {expanded && (
                  <span className="whitespace-nowrap text-sm">
                    {item.name}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}
