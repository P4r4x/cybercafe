import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { Avatar } from '@/components/ui/SmartImage'
import {
  Home,
  Search,
  BookOpen,
  ShoppingCart,
  User,
  Sun,
  Moon,
  ChevronRight,
  Pin,
  Coffee
} from 'lucide-react'

interface UserInfo {
  avatar: string
  username: string
  userId: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  path: string
  matchType?: 'exact' | 'prefix'
}

export const Sidebar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarPinned') === 'true'
    }
    return false
  })

  React.useEffect(() => {
    localStorage.setItem('sidebarPinned', String(isPinned))
  }, [isPinned])

  const isActive = (path: string, matchType: 'exact' | 'prefix' = 'prefix') => {
    if (matchType === 'exact') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const [userInfo] = useState<UserInfo>(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('cybercafe_user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          return {
            avatar: user.avatar || '/api/placeholder/40/40',
            username: user.username || 'CyberUser',
            userId: `ID: ${user.id || '2024001'}`
          }
        } catch (e) {}
      }
    }
    return {
      avatar: '/api/placeholder/40/40',
      username: 'CyberUser',
      userId: 'ID: 2024001'
    }
  })

  const navItems: NavItem[] = [
    { id: 'home', label: '主页', icon: Home, path: '/home', matchType: 'exact' },
    
    { id: 'search', label: '搜书', icon: Search, path: '/searchbook' },
    { id: 'bookshelf', label: '书架', icon: BookOpen, path: '/bookshelf' },

    { id: 'tea', label: '茶饮', icon: Coffee, path: '/products' },
    { id: 'orders', label: '订单', icon: ShoppingCart, path: '/orders' },
    { id: 'member', label: '会员中心', icon: User, path: '/member' }
  ]

  return (
    <div
      className="fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-out"
      style={{
        width: isExpanded ? 240 : 64,
        boxShadow: isExpanded
          ? '4px 0 20px rgba(0, 0, 0, 0.3)'
          : '2px 0 8px rgba(0, 0, 0, 0.1)',
        zIndex: isExpanded ? 50 : 40
      }}
      onMouseEnter={() => !isPinned && setIsExpanded(true)}
      onMouseLeave={() => !isPinned && setIsExpanded(false)}
    >
      <div className="relative h-full">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #431068 0%, #4C1D95 50%, #951D66 100%)'
              : 'linear-gradient(180deg, #FFE4D6 0%, #FFDCC9 50%, #FFE4D6 100%)',
            opacity: 1
          }}
        />

        <div className="h-full flex flex-col py-4 relative">
          <div className="px-4 mb-6">
            <div className="flex items-center space-x-3">
              <div
                className="flex-shrink-0 transition-transform duration-300"
                style={{
                  transform: isExpanded ? 'scale(1.2)' : 'scale(1)'
                }}
              >
                <Avatar
                  src={userInfo.avatar}
                  alt="用户头像"
                  width={40}
                  height={40}
                />
              </div>

              <div
                className="overflow-hidden transition-opacity duration-300"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  maxWidth: isExpanded ? 150 : 0,
                  transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)'
                }}
              >
                <div
                  className={`font-semibold text-sm truncate transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-orange-900'
                  }`}
                >
                  {userInfo.username}
                </div>
                <div
                  className={`text-xs truncate transition-colors duration-300 ${
                    isDark ? 'text-white/70' : 'text-orange-800/80'
                  }`}
                >
                  {userInfo.userId}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 mb-4">
            <div
              className="h-px transition-opacity duration-300"
              style={{
                background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(180, 120, 100, 0.3)',
                opacity: isExpanded ? 1 : 0.5
              }}
            />
          </div>

          <nav className="flex-1 px-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path, item.matchType)

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-300 hover:translate-x-1"
                      style={{
                        background: active
                          ? isDark
                            ? 'rgba(255,255,255,0.15)'
                            : 'rgba(255, 160, 120, 0.25)'
                          : 'transparent'
                      }}
                    >
                      <div className="flex-shrink-0">
                        <Icon
                          size={20}
                          className={`transition-colors duration-300 ${
                            active
                              ? isDark
                                ? 'text-white'
                                : 'text-orange-900'
                              : isDark
                              ? 'text-white/80'
                              : 'text-orange-800'
                          }`}
                        />
                      </div>

                      <div
                        className="ml-3 overflow-hidden transition-all duration-300 whitespace-nowrap"
                        style={{
                          opacity: isExpanded ? 1 : 0,
                          maxWidth: isExpanded ? 120 : 0,
                          transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)'
                        }}
                      >
                        <span
                          className={`text-sm font-medium transition-colors duration-300 ${
                            active
                              ? isDark
                                ? 'text-white'
                                : 'text-orange-900'
                              : isDark
                              ? 'text-white/80'
                              : 'text-orange-800'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {active && isExpanded && (
                        <ChevronRight
                          size={16}
                          className={`ml-auto transition-colors duration-300 ${
                            isDark ? 'text-white/60' : 'text-orange-700/60'
                          }`}
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="px-2 mt-auto space-y-2">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-300"
              style={{
                background: isPinned
                  ? isDark ? 'rgba(179, 136, 255, 0.25)' : 'rgba(255, 160, 120, 0.35)'
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 160, 120, 0.15)'
              }}
            >
              <div className="flex-shrink-0">
                <Pin 
                  size={20} 
                  className={`transition-colors duration-300 ${
                    isDark 
                      ? isPinned ? 'text-purple-300' : 'text-white/70'
                      : isPinned ? 'text-orange-600' : 'text-orange-800'
                  } ${isPinned ? 'fill-current' : ''}`}
                />
              </div>

              <div
                className="ml-3 overflow-hidden transition-all duration-300 whitespace-nowrap"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  maxWidth: isExpanded ? 120 : 0,
                  transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)'
                }}
              >
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isDark 
                      ? isPinned ? 'text-purple-200' : 'text-white/80'
                      : 'text-orange-800'
                  }`}
                >
                  {isPinned ? '已固定侧边栏' : '固定侧边栏'}
                </span>
              </div>
            </button>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-300"
              style={{
                background: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(255, 160, 120, 0.2)'
              }}
            >
              <div className="flex-shrink-0">
                {isDark ? (
                  <Sun size={20} className="text-white/90" />
                ) : (
                  <Moon size={20} className="text-orange-900" />
                )}
              </div>

              <div
                className="ml-3 overflow-hidden transition-all duration-300 whitespace-nowrap"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  maxWidth: isExpanded ? 120 : 0,
                  transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)'
                }}
              >
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-orange-900'
                  }`}
                >
                  {isDark ? '日间模式' : '夜间模式'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
