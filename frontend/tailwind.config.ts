import type { Config } from 'tailwindcss'
import { colors, animation, backgroundImage, themeVars } from './src/config/theme/colors'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ...colors,
        ...themeVars,
      },
      keyframes: {
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
      },
      animation,
      backgroundImage
    }
  },
  plugins: []
} satisfies Config
