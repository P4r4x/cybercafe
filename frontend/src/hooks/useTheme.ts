import { useContext } from 'react'
import { ThemeContext } from './themeContext'
import { themeConfig } from '@/types/theme'

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeConfig() {
  const context = useContext(ThemeContext)
  if (!context) {
    return { config: themeConfig, isDark: false }
  }
  return { config: context.config, isDark: context.isDark }
}
