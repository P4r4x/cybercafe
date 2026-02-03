import { useEffect, useState } from "react"
import ProductCard from "@/components/shop/ProductCard"
import ProductModal from "@/components/shop/ProductModal"
import CartWidget from "@/components/cart/CartWidget"
import { useToast } from "@/components/Toast"
import { LoadingToast } from "@/components/LoadingToast"
import { apiFetchJSON } from "@/utils/api"
import { useCart } from "@/context/CartContext"
import type { Product, CartItem } from "@/components/shared/PriceCalculator"

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
  
  
  const { addToCart, cartDetail } = useCart()

  useEffect(() => {
    apiFetchJSON<Product[]>("/products/all")
      .then((data) => setProducts(data))
      .catch((err) => {
        // 401 错误会自动跳转，不需要重复显示
        if (!err.message.includes('Unauthorized: redirecting to login')) {
          toast.show("error", err.message || "获取商品列表失败")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handleProductClick(product: Product) {
    setActiveProduct(product)
    setQuantity(1)
    setSelectedOptions({})
  }

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {products
          .filter((p) => p.is_active)
          .map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={handleProductClick}
            />
          ))}
      </div>

      {/* 选项弹窗 */}
      <ProductModal
        product={activeProduct}
        quantity={quantity}
        selectedOptions={selectedOptions}
        onQuantityIncrease={() => setQuantity((q) => q + 1)}
        onQuantityDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
        onToggleOption={toggleOption}
        onClose={() => setActiveProduct(null)}
        onAddToCart={addToCart}
      />

      {/* 购物车组件 */}
      <CartWidget />
    </div>
  )
}