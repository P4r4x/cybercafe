import { RouterProvider } from "react-router-dom"
import { router } from "@/router"
import { ToastProvider } from "@/components/Toast"
import { CartProvider } from "@/context/CartContext"
import { OrderPaymentProvider } from "@/context/OrderPaymentContext"

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <OrderPaymentProvider>
          <RouterProvider router={router} />
        </OrderPaymentProvider>
      </CartProvider>
    </ToastProvider>
  )
}