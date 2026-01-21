import { createBrowserRouter } from "react-router-dom"
import Login from "@/features/auth/pages/Login"
import Dashboard from "@/pages/Dashboard"
import MainLayout from "@/layouts/MainLayout"
import SearchBook from "@/pages/SearchBook"

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
  },
  {
    path: "/search_book",
    element:
      <MainLayout>
        <SearchBook />
      </MainLayout>,
  }
])
