import React, { useState } from 'react'
import { useThemeConfig } from '@/hooks/useTheme'
import { Avatar } from '@/components/ui/SmartImage'
import { User, Star, Wallet } from 'lucide-react'

interface UserInfo {
  uid: string
  username: string
  level: number
  exp: number
  exp_required: number
  balance: string
  avatar?: string
}

interface AccountProfileProps {
  userInfo: UserInfo
}

export const AccountProfile: React.FC<AccountProfileProps> = ({ userInfo }) => {
  const { config } = useThemeConfig()
  const [showBalance, setShowBalance] = useState(false)
  const [showExpDetails, setShowExpDetails] = useState(false)

  const expProgress = (userInfo.exp / userInfo.exp_required) * 100
  
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    return num.toFixed(2)
  }

  return (
    <div 
      className="p-6 rounded-xl shadow-lg"
      style={{ 
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
    >
      <div className="flex flex-col items-center mb-6">
        <Avatar
          src={userInfo.avatar}
          alt="用户头像"
          width={80}
          height={80}
          className="mb-4"
        />

        <div className="text-center">
          <p className="text-sm mb-1" style={{ color: config.text.secondary }}>
            UID: {userInfo.uid}
          </p>
          <h3 style={{ color: config.text.title }} className="text-xl font-semibold">
            {userInfo.username}
          </h3>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <span className="font-medium" style={{ color: config.text.primary }}>
              Lv.{userInfo.level}
            </span>
          </div>
          <span 
            className="text-sm px-2 py-1 rounded-md"
            style={{ 
              backgroundColor: config.background.input,
              color: config.text.secondary
            }}
          >
            经验值
          </span>
        </div>

        <div 
          className="relative"
          onMouseEnter={() => setShowExpDetails(true)}
          onMouseLeave={() => setShowExpDetails(false)}
        >
          <div className="mb-2">
            <div 
              className="w-full h-3 rounded-full overflow-hidden cursor-help transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: config.background.input }}
            >
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min(expProgress, 100)}%`,
                  backgroundColor: '#48BB78'
                }}
              />
            </div>
          </div>

          <div 
            className="text-center text-sm font-mono transition-opacity duration-200"
            style={{ 
              color: config.text.secondary,
              opacity: showExpDetails ? 0 : 1
            }}
          >
            {Math.round(expProgress)}%
          </div>

          {showExpDetails && (
            <div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap"
              style={{ 
                backgroundColor: config.background.surface,
                border: `1px solid ${config.border.light}`
              }}
            >
              <div className="text-sm text-center">
                <p style={{ color: config.text.secondary }} className="mb-1">
                  当前经验 / 升级所需
                </p>
                <p 
                  className="font-mono font-bold"
                  style={{ color: config.text.primary }}
                >
                  {userInfo.exp} / {userInfo.exp_required}
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: '#48BB78' }}
                >
                  还需 {Math.max(0, userInfo.exp_required - userInfo.exp)} 经验升级
                </p>
              </div>
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2"
                style={{ backgroundColor: config.background.surface }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          onMouseEnter={() => setShowBalance(true)}
          onMouseLeave={() => setShowBalance(false)}
          className="w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:shadow-md"
          style={{ 
            backgroundColor: config.background.input,
            border: `1px solid ${config.border.light}`
          }}
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5" style={{ color: config.text.secondary }} />
            <span style={{ color: config.text.primary }} className="font-medium">
              账户余额
            </span>
          </div>
          <span style={{ color: config.text.contrast }} className="font-mono">
            ¥{formatBalance(userInfo.balance)}
          </span>
        </button>

        {showBalance && (
          <div 
            className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-lg shadow-lg z-10"
            style={{ 
              backgroundColor: config.background.surface,
              border: `1px solid ${config.border.light}`
            }}
          >
            <div className="text-sm">
              <p style={{ color: config.text.secondary }} className="mb-1">
                可用余额
              </p>
              <p 
                className="text-lg font-bold"
                style={{ color: '#48BB78' }}
              >
                ¥{formatBalance(userInfo.balance)}
              </p>
            </div>
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2"
              style={{ backgroundColor: config.background.surface }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
