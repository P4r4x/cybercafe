import { createBrowserRouter } from "react-router-dom"
import Login from "@/features/auth/pages/Login"
import Dashboard from "@/pages/Dashboard"
import MainLayout from "@/layouts/MainLayout"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element:
      <MainLayout>
        <Dashboard />
      </MainLayout>,
  }
])
