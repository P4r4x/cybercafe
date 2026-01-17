import { useState } from "react"
import {
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  Repeat,
  Phone,
} from "lucide-react"
import { useToast } from "@/components/Toast"
import { useNavigate } from "react-router-dom"

const API_BASE = import.meta.env.VITE_API_BASE

type Mode = "login" | "register"
type LoginIdentity = "username" | "email"

interface SuccessResponse {
  message: "success"
  data?: string
}

interface ErrorResponse {
  error: string
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [loginIdentity, setLoginIdentity] =
    useState<LoginIdentity>("username")

  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const toast = useToast()
  const navigate = useNavigate()

  function validate(): boolean {
    setError(null)

    if (mode === "login") {
      if (loginIdentity === "username" && !username.trim()) {
        setError("请输入用户名")
        return false
      }

      if (loginIdentity === "email" && !email.trim()) {
        setError("请输入邮箱")
        return false
      }
    }

    if (mode === "register") {
      if (!username.trim() || !email.trim()) {
        setError("注册时用户名和邮箱均为必填")
        return false
      }

      if (!phone.trim()) {
        setError("请输入手机号")
        return false
      }

      if (!/^[0-9]+$/.test(phone)) {
        setError("手机号只能包含数字")
        return false
      }

      if (phone.length < 8 || phone.length > 16) {
        setError("手机号长度需在 8 到 16 位之间")
        return false
      }

      if (password !== confirmPassword) {
        setError("两次输入的密码不一致")
        return false
      }
    }

    if (password.length < 8) {
      setError("密码长度至少 8 位")
      return false
    }

    return true
  }

  async function handleSubmit(): Promise<void> {
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Record<string, string> = { password }

      if (mode === "login") {
        if (loginIdentity === "username") payload.username = username
        if (loginIdentity === "email") payload.email = email
      } else {
        payload.username = username
        payload.email = email
        payload.phone = phone
      }

      const res = await fetch(`${API_BASE}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 关键, 允许发送和接收cookie
        body: JSON.stringify(payload),
      })

      const data: SuccessResponse | ErrorResponse = await res.json()

      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "请求失败")
      }

      if (mode === "register" && data.data) {
        toast.show("success", `注册成功 🎉 用户ID：${data.data}`)
      } else {
        toast.show("success", "登录成功，欢迎回来 ✦")
        navigate("/dashboard")
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.show("error", e.message)
      } else {
        toast.show("error", "未知错误")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff1f2]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-extrabold tracking-wide text-pink-500">
          {mode === "login" ? "✦ Welcome Back ✦" : "✦ Create Your Story ✦"}
        </h1>

        <div className="space-y-4">
          {/* Login identity switch */}
          {mode === "login" && (
            <button
              type="button"
              onClick={() =>
                setLoginIdentity(prev =>
                  prev === "username" ? "email" : "username",
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white py-2 text-sm text-gray-600 hover:bg-pink-50"
            >
              <Repeat size={16} />
              使用{loginIdentity === "username" ? "邮箱" : "用户名"}登录
            </button>
          )}

          {/* Username */}
          {(mode === "register" ||
            (mode === "login" &&
              loginIdentity === "username")) && (
            <div className="relative">
              <User
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                className="w-full rounded-lg border px-10 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          )}

          {/* Email */}
          {(mode === "register" ||
            (mode === "login" &&
              loginIdentity === "email")) && (
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                className="w-full rounded-lg border px-10 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="邮箱"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          {/* Phone */}
          {mode === "register" && (
            <div className="relative">
              <Phone
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                className="w-full rounded-lg border px-10 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="手机号"
                value={phone}
                onChange={e => {
                  const v = e.target.value
                  if (/^[0-9]*$/.test(v)) {
                    setPhone(v)
                  }
                }}
              />
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <Lock
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <input
              type={showPwd ? "text" : "password"}
              className="w-full rounded-lg border px-10 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-2.5 text-gray-400"
            >
              {showPwd ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          {mode === "register" && (
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type={showConfirmPwd ? "text" : "password"}
                className="w-full rounded-lg border px-10 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={e =>
                  setConfirmPassword(e.target.value)
                }
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPwd(v => !v)
                }
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showConfirmPwd ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-pink-400 to-orange-400 py-2 font-semibold text-white hover:opacity-90"
          >
            {loading
              ? "提交中..."
              : mode === "login"
              ? "登录"
              : "注册"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === "login" ? (
            <span>
              还没有账号？{" "}
              <button
                className="text-pink-500"
                onClick={() => setMode("register")}
              >
                去注册
              </button>
            </span>
          ) : (
            <span>
              已有账号？{" "}
              <button
                className="text-orange-500"
                onClick={() => setMode("login")}
              >
                去登录
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
