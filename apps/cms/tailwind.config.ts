import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        brand: { DEFAULT: "#FFA415", dark: "#F08A00", light: "#FFF6C1" },
      },
    },
  },
  plugins: [],
} satisfies Config;
