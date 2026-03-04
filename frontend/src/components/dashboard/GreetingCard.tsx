import React, { useState, useEffect } from 'react'
import { useThemeConfig } from '@/hooks/useTheme'
import { Sun, Sunset, Moon, CloudMoon } from 'lucide-react'

interface GreetingData {
  greeting: string
  icon: React.ReactNode
  bgGradient: string
  textColor: string
}

export const GreetingCard: React.FC = () => {
  const { config } = useThemeConfig()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = (hour: number): GreetingData => {
    if (hour >= 6 && hour < 12) {
      return {
        greeting: '早上好',
        icon: <Sun className="w-8 h-8" />,
        bgGradient: 'from-amber-400 to-orange-500',
        textColor: '#78350F'
      }
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: '下午好',
        icon: <Sunset className="w-8 h-8" />,
        bgGradient: 'from-blue-400 to-cyan-500',
        textColor: '#1E40AF'
      }
    } else if (hour >= 18 && hour < 22) {
      return {
        greeting: '晚上好',
        icon: <CloudMoon className="w-8 h-8" />,
        bgGradient: 'from-purple-400 to-pink-500',
        textColor: '#6B21A8'
      }
    } else {
      return {
        greeting: '夜深了',
        icon: <Moon className="w-8 h-8" />,
        bgGradient: 'from-slate-600 to-slate-800',
        textColor: '#F1F5F9'
      }
    }
  }

  const hour = currentTime.getHours()
  const greetingData = getGreeting(hour)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }

  return (
    <div 
      className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
      style={{ 
        backgroundColor: config.background.surface,
        border: `1px solid ${config.border.light}`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className={`p-3 rounded-full bg-gradient-to-br ${greetingData.bgGradient} text-white shadow-md`}
          >
            {greetingData.icon}
          </div>
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: greetingData.textColor }}
            >
              {greetingData.greeting}，欢迎回来
            </h2>
            <p style={{ color: config.text.secondary }} className="text-sm mt-1">
              祝你阅读愉快
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div 
            className="text-3xl font-mono font-semibold"
            style={{ color: config.text.primary }}
          >
            {formatTime(currentTime)}
          </div>
          <div 
            className="text-sm mt-1"
            style={{ color: config.text.secondary }}
          >
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
    </div>
  )
}
