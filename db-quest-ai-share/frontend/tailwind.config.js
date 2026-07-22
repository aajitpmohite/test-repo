/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4f6bff',
          600: '#2f4bdb',
          700: '#1f36b0',
          800: '#152a8a',
          900: '#0c1c5e',
          950: '#070f36',
        },
        ink: '#0a0f2c',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(10,15,44,0.08), 0 8px 24px -12px rgba(10,15,44,0.18)',
      },
    },
  },
  plugins: [],
}
