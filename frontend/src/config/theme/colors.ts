export const colors = {
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

export const keyframes = {
  'grid-drift': {
    '0%': { transform: 'translate(0, 0) rotate(45deg)' },
    '100%': { transform: 'translate(-50px, -50px) rotate(45deg)' }
  },
  'float': {
    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
    '33%': { transform: 'translateY(-20px) translateX(10px)' },
    '66%': { transform: 'translateY(10px) translateX(-10px)' }
  },
  'float-delayed': {
    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
    '33%': { transform: 'translateY(15px) translateX(-15px)' },
    '66%': { transform: 'translateY(-10px) translateX(15px)' }
  },
  fadeIn: {
    '0%': {
      opacity: '0',
      transform: 'translateY(6px) scale(0.98)',
    },
    '100%': {
      opacity: '1',
      transform: 'translateY(0) scale(1)',
    },
  },
  fadeOut: {
    '0%': {
      opacity: '1',
      transform: 'translateY(0) scale(1)',
    },
    '100%': {
      opacity: '0',
      transform: 'translateY(-6px) scale(0.98)',
    },
  },
  'scaleIn': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' }
  },
  'scaleOut': {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '100%': { transform: 'scale(0.95)', opacity: '0' }
  }
}

export const animation = {
  'grid-drift': 'grid-drift 30s linear infinite',
  'float': 'float 20s ease-in-out infinite',
  'float-delayed': 'float-delayed 20s ease-in-out infinite',
  'fadeIn': 'fadeIn 0.3s ease-out',
  'fadeOut': 'fadeOut 0.3s ease-out'
}

export const backgroundImage = {
  'grid': 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
}

export const themeVars = {
  surface: 'var(--color-surface)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
  'text-primary': 'var(--color-text-primary)',
  'text-secondary': 'var(--color-text-secondary)',
  'text-muted': 'var(--color-text-muted)',
  'border-light': 'var(--color-border-light)',
  'border-medium': 'var(--color-border-medium)',
  accent: 'var(--color-accent)',
  'accent-light': 'var(--color-accent-light)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
}
