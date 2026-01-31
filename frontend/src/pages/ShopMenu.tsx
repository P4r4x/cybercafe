import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { getProductPicUrl, handleImgError } from "@/utils/assets"
import { useToast } from "@/components/Toast"
import { LoadingToast } from "@/components/LoadingToast"
import { apiFetchJSON } from "@/utils/api"

// ---------------- types ----------------
type Product = {
  id: number
  name: string
  base_price: string
  is_active: boolean
  options: Record<string, ProductOptionView>
}

type ProductOptionView = {
  type: "single" | "multi"
  required: boolean
  values: ProductOptionValueView[]
}

type ProductOptionValueView = {
  value: string
  extra_price: string
}

// ---------------- component ----------------
export default function ShopMenu() {
  const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const toast = useToast()

  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({})

useEffect(() => {
    apiFetchJSON<Product[]>("/products")
      .then((data) => setProducts(data))
      .catch((err) => {
        // 401 错误会自动跳转，不需要重复显示
        if (!err.message.includes('Unauthorized: redirecting to login')) {
          toast.show("error", err.message || "获取商品列表失败")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleOption(optionCode: string, value: string, type: "single" | "multi") {
    setSelectedOptions((prev) => {
      const current = prev[optionCode] ?? []

      if (type === "single") {
        return { ...prev, [optionCode]: [value] }
      }

      if (current.includes(value)) {
        return { ...prev, [optionCode]: current.filter((v) => v !== value) }
      }

      return { ...prev, [optionCode]: [...current, value] }
    })
  }

if (loading) {
    return <LoadingToast message="加载商品中…" variant="peach" />
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-4">
      {/* 商品网格 */}
      <div className="grid grid-cols-2 gap-4">
        {products
          .filter((p) => p.is_active)
          .map((p) => (
            <motion.div
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActiveProduct(p)
                setQuantity(1)
                setSelectedOptions({})
              }}
              className="rounded-2xl bg-white/80 shadow-sm backdrop-blur cursor-pointer"
            >
              <img
                src={getProductPicUrl(p.id)}
                onError={(e) => handleImgError(e, getProductPicUrl(null))}
                className="h-32 w-full rounded-t-2xl object-cover"
              />
              <div className="p-3">
                <div className="text-sm font-medium text-gray-800">{p.name}</div>
                <div className="mt-1 text-rose-500 font-semibold">
                  ¥ {p.base_price}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* 选项弹窗 */}
      <AnimatePresence>
        {activeProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 flex items-end"
            onClick={() => setActiveProduct(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-3xl bg-white p-5"
            >
              <div className="text-lg font-semibold text-gray-800 mb-3">
                {activeProduct.name}
              </div>

              {Object.entries(activeProduct.options).map(([code, opt]) => (
                <div key={code} className="mb-4">
                  <div className="mb-2 text-sm font-medium text-gray-600">
                    {code}
                    {opt.required && <span className="text-pink-400 ml-1">*</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((v) => {
                      const selected = selectedOptions[code]?.includes(v.value)
                      return (
                        <button
                          key={v.value}
                          onClick={() => toggleOption(code, v.value, opt.type)}
                          className={
                            "px-3 py-1 rounded-full text-sm border " +
                            (selected
                              ? "bg-pink-100 border-pink-400 text-pink-600"
                              : "bg-white border-gray-300 text-gray-600")
                          }
                        >
                          {v.value}
                          {Number(v.extra_price) > 0 && (
                            <span className="ml-1 text-xs text-rose-400">
                              +¥{v.extra_price}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* 数量 */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="w-8 text-center">{quantity}</div>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="h-8 w-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={() => setActiveProduct(null)}
                  className="rounded-xl bg-rose-400 px-6 py-2 text-white font-medium"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 购物车入口占位 */}
      <div className="fixed bottom-4 right-4 z-30">
        <button className="flex items-center gap-2 rounded-full bg-pink-400 px-4 py-3 text-white shadow-lg">
          <ShoppingCart size={18} />
          购物车
        </button>
      </div>
    </div>
  )
}
