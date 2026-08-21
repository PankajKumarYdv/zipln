/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        frost: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        accent: {
          DEFAULT: '#4f46e5',
          soft: '#818cf8',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 23, 42, 0.08)',
        'glass-lg': '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'hero-liquid-1': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(7%, -6%) scale(1.07)' },
          '66%': { transform: 'translate(-5%, 5%) scale(0.96)' },
        },
        'hero-liquid-2': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '40%': { transform: 'translate(-8%, 7%) scale(1.1)' },
          '70%': { transform: 'translate(5%, -4%) scale(0.94)' },
        },
        'hero-liquid-3': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%': { transform: 'translate(6%, 8%) scale(1.05)' },
        },
        'hero-liquid-4': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(-6%, -5%) scale(1.08)' },
          '75%': { transform: 'translate(4%, 3%) scale(0.92)' },
        },
        'hero-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'hero-liquid-1': 'hero-liquid-1 22s ease-in-out infinite',
        'hero-liquid-2': 'hero-liquid-2 28s ease-in-out infinite reverse',
        'hero-liquid-3': 'hero-liquid-3 25s ease-in-out infinite',
        'hero-liquid-4': 'hero-liquid-4 32s ease-in-out infinite reverse',
        'hero-shimmer': 'hero-shimmer 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
