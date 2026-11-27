/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F8F5F0",
        forest: "#0D2818",
        jade: "#2F5D50",
        gold: "#D4A574",
        amber: "#C68B59",
        smoke: "#5F6B66",
        sand: "#D8CFC4",
        silver: "#9CA3AF",
        mist: "#E8ECE9",
      },
      fontFamily: {
        sans: ["Poppins", "Hind Siliguri", "system-ui", "sans-serif"],
        cormorant: ["Poppins", "Hind Siliguri", "sans-serif"],
        dm: ["Poppins", "Hind Siliguri", "sans-serif"],
      },
    },
  },
  plugins: [],
};
