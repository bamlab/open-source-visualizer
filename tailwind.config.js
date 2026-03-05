/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#E63946',
        growth: '#22C55E',
        background: '#F8FAFC',
      },
    },
  },
  plugins: [],
}
