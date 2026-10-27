/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b7c6',
          400: '#8390a4',
          500: '#627085',
          600: '#4c586b',
          700: '#3e4856',
          800: '#363e49',
          900: '#1f2530',
          950: '#12161d',
        },
        brand: {
          50: '#eef6f3',
          100: '#d5eae2',
          200: '#abd5c7',
          300: '#7bbaa6',
          400: '#4f9b85',
          500: '#347f6b',
          600: '#266555',
          700: '#205246',
          800: '#1c423a',
          900: '#183731',
        },
        gold: {
          400: '#c9a961',
          500: '#b3914b',
          600: '#96783c',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,22,29,0.04), 0 12px 32px -12px rgba(18,22,29,0.16)',
      },
    },
  },
  plugins: [],
};
