/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF8EB",
          100: "#FDECC8",
          200: "#F5D590",
          300: "#EDBF5E",
          400: "#E8A838",
          500: "#E8A838",
          600: "#C78A20",
          700: "#A16E18",
          800: "#7B5312",
          900: "#0F172A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8FAFC",
          dark: "#0F172A",
        },
        accent: {
          amber: "#E8A838",
          teal: "#2DD4BF",
          orange: "#F97316",
        },
      },
    },
  },
  plugins: [],
};
