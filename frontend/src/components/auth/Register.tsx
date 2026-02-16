import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Mail, User, Phone, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'
import { useApi } from '@/hooks/useApi'

interface RegisterProps {
  onSwitchToLogin: () => void
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { post } = useApi()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // 打字机效果
  const fullText = 'Create Your Story'
  useEffect(() => {
    let currentIndex = 0
    let isDeleting = false
    setDisplayedText('')
    
    const typeInterval = setInterval(() => {
      if (!isDeleting) {
        // 打字阶段
        if (currentIndex <= fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex))
          currentIndex++
        } else {
          // 打完字后暂停一下，然后开始删除
          setTimeout(() => {
            isDeleting = true
          }, 2000)
        }
      } else {
        // 删除阶段
        if (currentIndex >= 0) {
          setDisplayedText(fullText.slice(0, currentIndex))
          currentIndex--
        } else {
          // 删除完后重新开始打字
          isDeleting = false
          currentIndex = 0
        }
      }
    }, isDeleting ? 50 : 100) // 删除速度更快

    return () => clearInterval(typeInterval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 前端预验证 - 对齐后端验证规则
    if (!formData.username) {
      error('请输入用户名')
      return
    }
    
    if (formData.username.length < 3) {
      error('用户名至少需要3个字符')
      return
    }
    
    if (formData.username.length > 18) {
      error('用户名不能超过18个字符')
      return
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      error('用户名只能包含字母、数字和下划线')
      return
    }
    
    if (!formData.email) {
      error('请输入邮箱地址')
      return
    }
    
    // 使用后端相同的邮箱验证正则
    const emailRegex = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/;
    if (!emailRegex.test(formData.email)) {
      error('请输入有效的邮箱地址')
      return
    }
    
    // 手机号验证（可选）
    if (formData.phone) {
      const cleanedPhone = formData.phone.replace(/[^\d]/g, '')
      if (cleanedPhone.length < 8 || cleanedPhone.length > 16) {
        error('手机号必须是8-16位数字')
        return
      }
      if (!/^\d+$/.test(cleanedPhone)) {
        error('手机号只能包含数字')
        return
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      error('两次输入的密码不一致')
      return
    }
    
    if (formData.password.length < 8) {
      error('密码至少需要8位字符')
      return
    }

    setIsLoading(true)

    try {
      const registerData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password
      }

      await post('/register', registerData)
      
      success('注册成功！请登录您的账号')
      
      // 注册成功后切换到登录页面
      setTimeout(() => {
        onSwitchToLogin()
      }, 1500)
      
    } catch (err: any) {
      console.error('Registration error:', err)
      // useApi已经处理了错误提示和401跳转
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo and Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full mb-3 shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
          {displayedText}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="text-gray-500 mt-1 text-s">开启你的数字生活新篇章</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Username Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            用户名 *
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input
              type="text"
              name="username"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full pl-12 py-2 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
              required
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            邮箱地址 *
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="请输入邮箱地址"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-12 py-2 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
              required
            />
          </div>
        </div>

        {/* Phone Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            手机号
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input
              type="tel"
              name="phone"
              placeholder="请输入手机号（可选）"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full pl-12 py-2 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            密码 *
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-12 pr-12 py-2 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            确认密码 *
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full pl-12 pr-12 py-2 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start px-20">
          <input
            type="checkbox"
            className="w-3 h-3 text-orange-500 border-orange-300 rounded focus:ring-orange-400 focus:ring-2 mt-0.5 bg-orange-50/50 accent-orange-500"
            required
          />
          <label className="ml-2 text-xs text-gray-600">
            我已阅读并同意
            <a href="#" className="text-pink-500 hover:text-pink-600 font-medium">服务条款</a>
            和
            <a href="#" className="text-pink-500 hover:text-pink-600 font-medium">隐私政策</a>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden group text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="relative z-10 flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                注册中...
              </>
            ) : (
              '创建账号'
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">或</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-4">
          已有账号？
          <button
            onClick={onSwitchToLogin}
            className="ml-2 text-pink-500 hover:text-pink-600 font-semibold hover:underline transition-all duration-200"
          >
            立即登录
          </button>
        </p>
      </div>
    </div>
  )
}