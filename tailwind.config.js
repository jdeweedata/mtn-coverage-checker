/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'geist': ['Geist', 'system-ui', 'sans-serif'],
        'geist-mono': ['Geist Mono', 'monospace'],
      },
      colors: {
        'vercel-gray': {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        'vercel-blue': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      borderRadius: {
        'lg': '8px',
        'md': '6px',
        'sm': '4px',
      },
    },
  },
  plugins: [],
}