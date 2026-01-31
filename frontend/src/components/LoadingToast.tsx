import { motion } from "framer-motion"

export function LoadingToast({ 
  message, 
  variant = "sakura"
}: { 
  message: string
  variant?: "sakura" | "peach" | "white-peach" | "coral"
}) {
  const variants = {
    sakura: "from-pink-300 to-rose-300",      // 樱花粉
    peach: "from-orange-300 to-pink-300",     // 蜜桃橙
    "white-peach": "from-pink-200 to-orange-200", // 白桃色  
    coral: "from-rose-300 to-pink-300"       // 珊瑚色
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl backdrop-blur bg-gradient-to-r ${variants[variant]} text-white`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span className="text-sm font-medium">{message}</span>
      </motion.div>
    </div>
  )
}