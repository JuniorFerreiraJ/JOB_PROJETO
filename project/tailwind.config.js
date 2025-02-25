/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FFD700',    // Amarelo
        secondary: '#1A1A1A',  // Preto
        accent: '#4A4A4A',     // Cinza Chumbo
      },
    },
  },
  plugins: [],
};