import { Outlet } from 'react-router-dom'
import { MainLayout } from '@/components/ui/MainLayout'

export const AppLayout = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}
