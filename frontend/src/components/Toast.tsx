import { createContext, useContext, useState, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  show: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function show(type: ToastType, message: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl backdrop-blur
                ${toastStyle[t.type]}`}
            >
              {iconMap[t.type]}
              <span className="text-sm font-medium">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

const toastStyle: Record<ToastType, string> = {
  success:
    "bg-gradient-to-r from-pink-300 to-orange-300 text-white",
  error:
    "bg-gradient-to-r from-rose-400 to-red-400 text-white",
  info:
    "bg-gradient-to-r from-orange-200 to-pink-200 text-gray-800",
}

const iconMap: Record<ToastType, JSX.Element> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
}
