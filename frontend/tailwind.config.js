/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary brand — Deutsche Bank navy (theme-independent)
        brand: {
          DEFAULT: '#2f5aa8',
          50: '#eef3fb',
          100: '#d8e3f5',
          200: '#b3c7e9',
          300: '#85a3d8',
          400: '#557dc2',
          500: '#2f5aa8',
          600: '#234789',
          700: '#1c3970',
          800: '#182e59',
          900: '#132445',
        },
        // Secondary accent — signature gold (theme-independent)
        gold: {
          DEFAULT: '#c8a24a',
          50: '#fbf6e9',
          100: '#f4e8c4',
          200: '#ecd492',
          300: '#e0bd5e',
          400: '#d0a63c',
          500: '#b98a2f',
          600: '#9a6e27',
          700: '#7c5722',
          800: '#654620',
          900: '#543a1e',
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
        'gold-accent': 'rgb(var(--gold) / <alpha-value>)',
        ink: '#0b1120',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        glow: '0 0 0 1px rgba(47, 90, 168, 0.25), 0 12px 40px -12px rgba(47, 90, 168, 0.45)',
        'glow-gold': '0 0 0 1px rgba(200, 162, 74, 0.3), 0 12px 40px -12px rgba(200, 162, 74, 0.45)',
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
