/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f5f7fb', 100: '#e9edf5', 200: '#d0d8e8', 300: '#a9b6d1',
          400: '#7c8db3', 500: '#586b97', 600: '#41527a', 700: '#33405f',
          800: '#1d2a48', 900: '#111b33', 950: '#0a1224',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,18,36,.04), 0 4px 16px rgba(10,18,36,.05)',
        lift: '0 8px 30px rgba(10,18,36,.10)',
      },
      keyframes: {
        rise: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        toastIn: { '0%': { opacity: 0, transform: 'translateX(12px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        rise: 'rise .35s ease-out both',
        toast: 'toastIn .25s ease-out both',
      },
    },
  },
  plugins: [],
}
