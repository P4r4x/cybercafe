import React, { useState } from 'react'
import { Login, Register } from '@/components/auth'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)

  const switchToRegister = () => setIsLogin(false)
  const switchToLogin = () => setIsLogin(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-25 to-rose-25 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 animate-grid-drift"
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(244, 143, 177, 0.1) 1px, transparent 1px),
              linear-gradient(-45deg, rgba(244, 143, 177, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            width: '200%',
            height: '200%'
          }}
        ></div>
      </div>

      {/* Background decoration with sakura colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full opacity-25 blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-200 to-rose-200 rounded-full opacity-25 blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-rose-150 to-pink-150 rounded-full opacity-15 blur-2xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tr from-pink-150 to-rose-150 rounded-full opacity-15 blur-2xl animate-float-delayed"></div>
      </div>

      {/* Main content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Login/Register Card - 雪樱色主题 */}
          <div className="bg-gradient-to-br from-white to-rose-50/30 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-rose-100/50 animate-fade-in">
            {isLogin ? (
              <Login key="login" onSwitchToRegister={switchToRegister} />
            ) : (
              <Register key="register" onSwitchToLogin={switchToLogin} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}