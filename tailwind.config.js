/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        astrology: {
          dark: '#f5f7f8',
          gold: '#147d70',
          'gold-light': '#199686',
          'gold-dark': '#106658',
          card: '#ffffff',
        }
      },
      backgroundImage: {
        'astrology-gradient': 'linear-gradient(135deg, #f5f7f8 0%, #ffffff 100%)',
        'gold-gradient': 'linear-gradient(135deg, #147d70 0%, #106658 100%)',
      }
    },
  },
  plugins: [],
}
