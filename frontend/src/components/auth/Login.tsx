import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Mail, User, Coffee, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'
import { useApi } from '@/hooks/useApi'

interface LoginProps {
  onSwitchToRegister: () => void
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { post } = useApi()
  const [isEmailMode, setIsEmailMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  // 打字机效果
  const fullText = 'Welcome To CyberCafe'
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
    
    // 前端预验证 - 对齐后端验证逻辑
    if (!formData.password) {
      error('密码不能为空')
      return
    }
    
    const field = isEmailMode ? formData.email : formData.username
    if (!field) {
      error(isEmailMode ? '请输入邮箱地址' : '请输入用户名')
      return
    }

    // 对齐后端username验证：字母、数字、下划线，长度3~18
    if (!isEmailMode) {
      const username = formData.username
      const usernameRegex = /^[a-zA-Z0-9_]+$/
      if (!usernameRegex.test(username)) {
        error('用户名只能包含字母、数字和下划线')
        return
      }
      
      if (username.length < 3 || username.length > 18) {
        error('用户名长度必须在3-18个字符之间')
        return
      }
    }

    // 对齐后端email验证：邮件格式
    if (isEmailMode) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(formData.email)) {
        error('邮箱格式不正确')
        return
      }
    }

    // 对齐后端password验证：至少8位字符，包含字母、数字、特殊字符，不做字符集限制
    if (formData.password.length < 8) {
      error('密码至少需要8位字符')
      return
    }

    setIsLoading(true)
    
    try {
      const loginData = {
        [isEmailMode ? 'email' : 'username']: field,
        password: formData.password
      }

      const data = await post('/login', loginData)
      
      // 保存用户信息和token
      if (data.user && data.token) {
        localStorage.setItem('cybercafe_user', JSON.stringify(data.user))
        localStorage.setItem('cybercafe_token', data.token)
      }
      
      success('登录成功, 欢迎回来 😊')
      
      // 取消延迟跳转
      navigate('/home')
      
    } catch (err: any) {
      console.error('Login error:', err)
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
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
          {displayedText}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="text-gray-500 mt-1 text-s">探索数字世界的无限可能</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username/Email Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            {isEmailMode ? '邮箱地址' : '用户名'}
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isEmailMode ? (
                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
              ) : (
                <User className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
              )}
            </div>
            <input
              type={isEmailMode ? 'email' : 'text'}
              name={isEmailMode ? 'email' : 'username'}
              placeholder={isEmailMode ? '请输入邮箱地址' : '请输入用户名'}
              value={isEmailMode ? formData.email : formData.username}
              onChange={handleInputChange}
              className="w-full pl-12 pr-12 py-2.5 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
              required
            />
            <button
              type="button"
              onClick={() => setIsEmailMode(!isEmailMode)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium text-xs hover:from-orange-500 hover:to-pink-500 transition-all duration-200 shadow-md hover:shadow-lg group/btn"
              title={`点击切换${isEmailMode ? '用户名' : '邮箱'}登录`}
            >
              {isEmailMode ? (
                <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              ) : (
                <Mail className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>
          </div>
        </div>

        {/* Password Input */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-gray-700 w-16 text-right">
            密码
          </span>
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Key className="w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-12 pr-12 py-2.5 border-2 border-orange-200 rounded-xl focus:border-pink-400 focus:outline-none transition-all duration-300 hover:border-orange-300 bg-orange-50/30 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-orange-500 border-orange-300 rounded focus:ring-orange-400 focus:ring-2 bg-orange-50/50 accent-orange-500"
            />
            <span className="ml-2 text-sm text-gray-600">记住我</span>
          </label>
          <button type="button" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
            忘记密码？
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden group text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="relative z-10 flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          还没有账号？
          <button
            onClick={onSwitchToRegister}
            className="ml-2 text-pink-500 hover:text-pink-600 font-semibold hover:underline transition-all duration-200"
          >
            立即注册
          </button>
        </p>
      </div>
    </div>
  )
}