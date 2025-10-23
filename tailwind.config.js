/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0e27',
          darker: '#050810',
          blue: '#00d4ff',
          purple: '#9333ea',
          pink: '#ec4899',
        },
      },
    },
  },
  plugins: [],
}
