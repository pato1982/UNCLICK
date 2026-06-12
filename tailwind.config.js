/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      'sm': '700px',
      'md': '1101px',
    },
    extend: {
      colors: {
        "primary": "#3B1969",
        "primary-light": "#5B3A8A",
        "accent": "#E5B800",
        "background-light": "#F5F4F7",
        "background-dark": "#1a1220",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
