/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#d4af37",
          light: "#f5d67b",
          deep: "#a8842a",
        },
        burgundy: {
          DEFAULT: "#7f1d1d",
          deep: "#160d0d",
          wine: "#3b0f14",
        },
        cream: "#e8e2d0",
        felt: "#0f5132",
        walnut: "#3b2416",
        warmlight: "#fff2d6",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 30px rgba(212, 175, 55, 0.25)",
        goldsoft: "0 8px 40px rgba(212, 175, 55, 0.15)",
      },
    },
  },
  plugins: [],
};
