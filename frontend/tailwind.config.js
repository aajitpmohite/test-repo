/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary brand — Deutsche Bank inspired indigo/blue (theme-independent)
        brand: {
          DEFAULT: '#4f6bff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4f6bff',
          600: '#4056e6',
          700: '#3342c4',
          800: '#2b389c',
          900: '#28347d',
        },
        // Semantic tokens — resolved from CSS variables so they flip with the theme.
        app: 'rgb(var(--app) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        inset: 'rgb(var(--inset) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        strong: 'rgb(var(--text-strong) / <alpha-value>)',
        body: 'rgb(var(--text-body) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        faint: 'rgb(var(--text-faint) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        ink: '#0b1120',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        glow: '0 0 0 1px rgba(79, 107, 255, 0.25), 0 12px 40px -12px rgba(79, 107, 255, 0.45)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
