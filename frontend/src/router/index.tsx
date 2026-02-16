import { createBrowserRouter, Navigate } from "react-router-dom"
import Login from "@/pages/Login"
import Home from "@/pages/Home"
import SearchBook from "@/pages/SearchBook"
import BookDetailPage from "@/pages/BookDetailPage"
import BookshelfPage from "@/pages/BookshelfPage"
import ProductsPage from "@/pages/ProductsPage"
import PaymentPage from "@/pages/PaymentPage"
import ImageUsageExamples from "@/components/examples/ImageUsageExamples"
import { AppLayout } from "./AppLayout"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/searchbook",
        element: <SearchBook />,
      },
      {
        path: "/bookshelf",
        element: <BookshelfPage />,
      },
      {
        path: "/book-detail/:id",
        element: <BookDetailPage />,
      },
      {
        path: "/products",
        element: <ProductsPage />,
      },
      {
        path: "/payment",
        element: <PaymentPage />,
      },
      {
        path: "/image-examples",
        element: <ImageUsageExamples />,
      },
    ],
  },
])
