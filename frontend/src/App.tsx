import { RouterProvider } from "react-router-dom"
import { router } from "@/router"
import { ThemeProvider } from "@/hooks/themeContext"
import { ToastProvider } from "@/components/ui"

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  )
}