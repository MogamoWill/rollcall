/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#b8d4ff",
          300: "#85b5ff",
          400: "#4d8fff",
          500: "#1a6bff",
          600: "#0052e0",
          700: "#003db3",
          800: "#002d85",
          900: "#0F172A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8FAFC",
          dark: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};
