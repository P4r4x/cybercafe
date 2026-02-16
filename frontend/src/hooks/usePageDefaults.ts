import { useTheme, useThemeConfig } from '@/hooks/useTheme'
import { useToast } from '@/components/ui/ToastProvider'
import { useApi } from '@/hooks/useApi'


export const usePageDefaults = () => ({
  config: useThemeConfig().config,
  isDark: useTheme().isDark,
  toast: useToast(),
  api: useApi(),
})