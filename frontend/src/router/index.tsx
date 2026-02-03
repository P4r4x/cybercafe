import { createBrowserRouter } from "react-router-dom"
import Login from "@/features/auth/pages/Login"
import Dashboard from "@/pages/Dashboard"
import MainLayout from "@/layouts/MainLayout"
import SearchBook from "@/pages/SearchBook"
import BookDetail from "@/pages/BookDetail"
import Bookshelf from "@/pages/Bookshelf"
import ShopMenu from "@/pages/ShopMenu"
import OrderPreview from "@/pages/OrderPreview"
import OrderPayment from "@/pages/OrderPayment"

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
  },
  {
    path: "/search_books/:id",
    element:
      <MainLayout>
        <BookDetail />
      </MainLayout>,
  },
  {
    path: "/bookshelf",
    element:
      <MainLayout>
        <Bookshelf />
      </MainLayout>,
  },
  {
    path: "/shop",
    element:
      <MainLayout>
        <ShopMenu />
      </MainLayout>,
  },
  {
    path: "/preview",
    element: (
      <MainLayout>
        <OrderPreview />
      </MainLayout>
    ),
  },
  {
    path: "/payment",
    element: (
      <MainLayout>
        <OrderPayment />
      </MainLayout>
    ),
  }
])
