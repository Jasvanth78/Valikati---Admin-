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
          dark: '#0a0a0a',
          gold: '#d4af37',
          'gold-light': '#f1c40f',
          'gold-dark': '#996515',
          card: '#1a1a1a',
        }
      },
      backgroundImage: {
        'astrology-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #996515 100%)',
      }
    },
  },
  plugins: [],
}
