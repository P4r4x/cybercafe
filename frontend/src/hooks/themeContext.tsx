import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ThemeConfig {
  text: {
    title: string
    primary: string
    secondary: string
    muted: string
    contrast: string
    link: string
  }
  background: {
    surface: string
    secondary: string
    tertiary: string
    input: string
    gradient: string
  }
  border: {
    light: string
    medium: string
  }
  shadow: {
    sm: string
    md: string
    lg: string
    medium: string
  }
  status: {
    info: string
    success: string
    warning: string
    error: string
  }
  price: {
    primary: string
    light: string
  }
  gradient: {
    primary: string
    secondary: string
  }
  window: string
}

const lightTheme: ThemeConfig = {
  text: {
    title: '#FF6B61',
    primary: '#1A1A2E',
    secondary: '#5A6478',
    muted: '#9AA4B2',
    contrast: '#1A1A2E',
    link: '#FF6B61',
  },
  background: {
    surface: '#FFF8F3',
    secondary: '#FFE8DA',
    tertiary: '#FFD0BA',
    input: '#FFE8DA',
    gradient: 'linear-gradient(135deg, #FFF8F3 0%, #FFE8DA 100%)',
  },
  border: {
    light: '#FFE4D6',
    medium: '#FFD0BA',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  status: {
    info: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  price: {
    primary: '#E86A50',
    light: '#FF8066',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #FF6B61 0%, #FF8A9B 100%)',
    secondary: 'linear-gradient(135deg, #FFF8F3 0%, #FFE8DA 100%)',
  },
  window: '#FFF8F3',
}

const darkTheme: ThemeConfig = {
  text: {
    title: '#B388FF',
    primary: '#E8EBF2',
    secondary: '#9AA4B2',
    muted: '#7A8494',
    contrast: '#E8EBF2',
    link: '#B388FF',
  },
  background: {
    surface: '#0F1528',
    secondary: '#1A1A2E',
    tertiary: '#2D3344',
    input: '#2D3344',
    gradient: 'linear-gradient(135deg, #0F1528 0%, #1A1A2E 50%, #2D1068 100%)',
  },
  border: {
    light: '#3D4556',
    medium: '#4A5568',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.4)',
  },
  status: {
    info: '#38BDF8',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  price: {
    primary: '#FFB088',
    light: '#FFCBB3',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #B388FF 0%, #7B2CBF 100%)',
    secondary: 'linear-gradient(135deg, #0F1528 0%, #2D1068 100%)',
  },
  window: '#0F1528',
}

export interface ThemeContextValue {
  config: ThemeConfig
  isDark: boolean
  toggleTheme: () => void
}

const defaultContextValue: ThemeContextValue = {
  config: lightTheme,
  isDark: false,
  toggleTheme: () => {},
}

export const ThemeContext = createContext<ThemeContextValue>(defaultContextValue)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.setAttribute('data-theme', 'light')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const value: ThemeContextValue = {
    config: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeConfig() {
  const context = useContext(ThemeContext)
  if (!context) {
    return { config: lightTheme, isDark: false }
  }
  return { config: context.config, isDark: context.isDark }
}

export function useTheme() {
  return useContext(ThemeContext)
}
