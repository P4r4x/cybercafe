import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  darkMode: 'data-theme',
  theme: {
    extend: {
      colors: {
        rose: {
          25: '#FFF1F5',
          50: '#FDF2F8',
          100: '#FCE7F3',
          150: '#FBCFE8',
          200: '#F9A8D4',
        },
        pink: {
          25: '#FDF2F8',
          50: '#FDF2F8',
          100: '#FCE7F3',
          150: '#FBCFE8',
          200: '#F9A8D4',
        }
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
        }
      },
      animation: {
        'grid-drift': 'grid-drift 30s linear infinite',
        'float': 'float 20s ease-in-out infinite',
        'float-delayed': 'float-delayed 20s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config
