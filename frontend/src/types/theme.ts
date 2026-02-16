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
  }
  gradient: {
    primary: string
    secondary: string
  }
  window: string
}

export interface ThemeColors {
  card: string
  border: string
  secondary: string
  primary: string
  title: string
  input: string
  contrast: string
  muted: string
  link: string
  window: string
  peach: Record<string, string>
  orange: Record<string, string>
  sakura: Record<string, string>
  night: Record<string, string>
  deepBlue: Record<string, string>
  violet: Record<string, string>
  coral: Record<string, string>
  lavender: Record<string, string>
  rose: Record<string, string>
  sky: Record<string, string>
}

export const themeConfig: ThemeConfig = {
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
  },
  gradient: {
    primary: 'linear-gradient(135deg, #FF6B61 0%, #FF8A9B 100%)',
    secondary: 'linear-gradient(135deg, #FFF8F3 0%, #FFE8DA 100%)',
  },
  window: '#FFF8F3',
}

export const themeColors: ThemeColors = {
  card: '#FFF8F3',
  border: '#FFE4D6',
  secondary: '#5A6478',
  primary: '#FF6B61',
  title: '#1A1A2E',
  input: '#FFE8DA',
  contrast: '#1A1A2E',
  muted: '#9AA4B2',
  link: '#FF6B61',
  window: '#FFF8F3',
  peach: {
    50: '#FFF8F3',
    100: '#FFF0E6',
    150: '#FFE8DA',
    200: '#FFE4D6',
    250: '#FFDCC9',
    300: '#FFCBB3',
    350: '#FFBA90',
    400: '#FFB088',
    450: '#FFA570',
    500: '#FF9460',
  },
  orange: {
    50: '#FFF5EB',
    100: '#FFE5D6',
    150: '#FFD8C0',
    200: '#FFCDB2',
    250: '#FFC299',
    300: '#FFB088',
    350: '#FF9D6B',
    400: '#FF8C42',
    450: '#FF7B26',
    500: '#E67329',
  },
  sakura: {
    50: '#FFF5F7',
    100: '#FFE8EC',
    150: '#FFD8E2',
    200: '#FFC9D4',
    250: '#FFB5C1',
    300: '#FFA6B8',
    350: '#FF97A8',
    400: '#FF8A9B',
    450: '#FF7D8E',
    500: '#E86A82',
  },
  night: {
    50: '#F5F7FA',
    100: '#E8EBF2',
    150: '#DDE1E8',
    200: '#D0D5DD',
    250: '#C4C9D2',
    300: '#9AA4B2',
    350: '#7A8494',
    400: '#5A6478',
    500: '#3D4556',
    600: '#2D3344',
    700: '#1F2230',
    800: '#1A1A2E',
    850: '#141428',
    900: '#0F0F1A',
  },
  deepBlue: {
    50: '#E8F0F8',
    100: '#C4D4E8',
    150: '#A8C0DC',
    200: '#A5BEE8',
    250: '#8AB0E0',
    300: '#7E9FE0',
    350: '#5E7FD8',
    800: '#16213E',
    850: '#111830',
    900: '#0F1528',
  },
  violet: {
    50: '#F5F0FF',
    100: '#EDE3FF',
    150: '#E0D0FF',
    200: '#D4BFFF',
    250: '#C4A0FF',
    300: '#B388FF',
    350: '#A06BFF',
    400: '#9D67FF',
    450: '#8E4EFF',
    500: '#7B2CBF',
    550: '#6B1FA0',
    600: '#5A189A',
    650: '#4F1485',
    700: '#480B82',
  },
  coral: {
    50: '#FFF0EC',
    100: '#FFDCD4',
    200: '#FFC4B8',
    300: '#FFA68C',
    400: '#FF8066',
    500: '#E86A50',
  },
  lavender: {
    50: '#F8F5FF',
    100: '#EFE5FF',
    200: '#DCC5FF',
    300: '#C4A0FF',
    400: '#A880FF',
    500: '#8B5CF6',
  },
  rose: {
    50: '#FFF1F5',
    100: '#FFE4E9',
    200: '#FFC9D4',
    300: '#FFA6B8',
    400: '#FF8A9B',
    500: '#F43F5E',
  },
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
  },
}
