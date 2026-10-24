/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Indian Government Digital-Services Design Palette
        gov: {
          navy: '#17324D',
          'navy-dark': '#0F2133',
          green: '#16733B',
          'green-hover': '#105C2E',
          'green-light': '#EDF6EF',
          bg: '#F5F7F8',
          card: '#FFFFFF',
          text: '#202B36',
          'text-secondary': '#596775',
          border: '#D7DEE5',
          saffron: '#D97735',
        },
        civic: {
          50: '#edf6ef',   // subtle green background
          100: '#d7eada',
          200: '#b4d7ba',
          300: '#8ac093',
          400: '#5da76c',
          500: '#16733B',  // primary government green
          600: '#16733B',  // government green
          700: '#105C2E',  // dark green hover
          800: '#17324D',  // primary navy
          900: '#0f2133',  // dark navy
          950: '#0a1724',
        },
        navy: {
          800: '#17324D',
          900: '#0f2133',
          950: '#0a1724',
        },
      },
    },
  },
  plugins: [],
};
