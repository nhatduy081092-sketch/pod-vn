import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        brand: { DEFAULT: "#E4570B", dark: "#C2410C", light: "#FFF1E6" },
      },
    },
  },
  plugins: [],
} satisfies Config;
