import { createBrowserRouter, Navigate } from "react-router-dom"
import Login from "@/pages/Login"
import Home from "@/pages/Home"
import SearchBook from "@/pages/SearchBook"
import ToastDemo from "@/pages/ToastDemo"
import ImageUsageExamples from "@/components/ImageUsageExamples"

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
    path: "/home",
    element: <Home />,
  },
  {
    path: "/searchbook",
    element: <SearchBook />,
  },
  {
    path: "/toast-demo",
    element: <ToastDemo />,
  },
  {
    path: "/image-examples",
    element: <ImageUsageExamples />,
  },
])
