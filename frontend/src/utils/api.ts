const API_BASE = import.meta.env.VITE_API_BASE

/**
 * apiFetch 使用示例（底层封装，返回 Response）
 *
 * ```ts
 * import { apiFetch } from '@/utils/api'
 *
 * // GET 请求（自行处理 json / text）
 * const res = await apiFetch('/products')
 * const products = await res.json()
 *
 * // POST 请求（自行处理返回值）
 * const res = await apiFetch('/orders/submit', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(orderRequest),
 * })
 *
 * if (res.ok) {
 *   console.log('submit success')
 * }
 * ```
 *
 * 实际项目改写示例：
 * 
 * 【ShopMenu.tsx - 商品列表】
 * ```ts
 * // 改动前（CORS问题）
 * fetch(`${API_BASE}/products`, { credentials: "include" })
 *   .then(res => res.json())
 *   .then(data => setProducts(data))
 * 
 * // 改动后（自动处理CORS/401）
 * apiFetchJSON<Product[]>("/products")
 *   .then(data => setProducts(data))
 *   .catch(err => {
 *     if (!err.message.includes('Unauthorized: redirecting to login')) {
 *       toast.show("error", err.message || "获取商品列表失败")
 *     }
 *   })
 * ```
 * 
 * 【Login.tsx - 登录注册】
 * ```ts
 * // 改动前（复杂错误处理）
 * const res = await fetch(`${API_BASE}/${mode}`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   credentials: "include",
 *   body: JSON.stringify(payload),
 * })
 * const data = await res.json()
 * if (!res.ok || "error" in data) {
 *   throw new Error("error" in data ? data.error : "请求失败")
 * }
 *
 * // 改动后（简洁类型安全）
 * const data = await apiFetchJSON<SuccessResponse>(`/${mode}`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify(payload),
 * })
 * // apiFetchJSON 已确保 res.ok，直接使用 data
 * ```
 *
 * 【BookDetail.tsx - 书籍操作】
 * ```ts
 * // 改动前（重复的错误处理）
 * const res = await fetch(`${API_BASE}/books/borrow`, {
 *   method: "POST", headers: { "Content-Type": "application/json" },
 *   credentials: "include", body: JSON.stringify({ id: book.id, amount: 1 }),
 * })
 * const data = await res.json()
 * if (!res.ok) throw new Error(data?.error || "借阅失败")
 *
 * // 改动后（一键搞定）
 * await apiFetchJSON("/books/borrow", {
 *   method: "POST", headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ id: book.id, amount: 1 }),
 * })
 * ```
 *
 * 行为说明：
 * - 自动拼接 API_BASE
 * - 自动携带 cookie（credentials: include）
 * - 401 时自动跳转 /login（并抛错中断后续逻辑）
 * - 非 2xx 状态直接抛出 Error
 * - 类型安全的泛型支持（推荐使用 apiFetchJSON）
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    ...options,
  })

  if (res.status === 401) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized: redirecting to login')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API Error ${res.status}: ${text}`)
  }

  return res
}


/**
 * 基于 apiFetch 的 JSON 快捷封装
 *
 * 使用示例：
 * ```ts
 * import { apiFetchJSON } from '@/utils/api'
 *
 * // GET JSON（最常用）
 * const products = await apiFetchJSON<Product[]>('/products')
 *
 * // POST JSON（提交订单）
 * const result = await apiFetchJSON<OrderResult>('/orders/submit', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(orderRequest),
 * })
 *
 * // 类型安全示例（已改写的页面）
 * const products = await apiFetchJSON<Product[]>("/products")           // ShopMenu
 * const dashboard = await apiFetchJSON<Partial<DashboardData>>("/me/dashboard")  // Dashboard
 * const bookList = await apiFetchJSON<Book[]>("/books/${id}")              // BookDetail
 * const searchResult = await apiFetchJSON<{items: Book[]}>("/books/search") // SearchBook
 * ```
 *
 * 行为说明：
 * - 内部调用 apiFetch
 * - 自动处理 401 登录跳转
 * - 自动校验 res.ok
 * - 自动执行 res.json()
 * - 泛型 T 用于约束返回数据结构（推荐使用）
 * 
 * 优势对比：
 * - ✅ 统一错误处理：自动处理401跳转，避免CORS问题
 * - ✅ 代码简化：无需手动写 credentials、res.ok、res.json()
 * - ✅ 类型安全：泛型约束返回值，避免any类型
 * - ✅ 统一风格：所有API调用保持一致的代码风格
 */
export async function apiFetchJSON<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(url, options)
  return res.json() as Promise<T>
}
