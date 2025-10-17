import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5b21b6",
          light: "#7c3aed",
          dark: "#4c1d95"
        }
      }
    }
  },
  plugins: []
};

export default config;
