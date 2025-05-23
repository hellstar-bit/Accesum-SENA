/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'sena-green': '#39A900', // Color principal del SENA
          'sena-dark': '#006F35',  // Variante oscura
          'sena-light': '#E6F2E2', // Variante clara
        }
      },
    },
    plugins: [],
  }