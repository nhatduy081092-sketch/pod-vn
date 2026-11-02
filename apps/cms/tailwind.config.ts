import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        brand: { DEFAULT: "#E4570B", dark: "#C2410C", deep: "#9A3412", light: "#FFF1E6" },
        // ghi ấm như website: mọi neutral-* trong CMS đổi sang dải stone, không phải sửa từng trang
        neutral: colors.stone,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Be Vietnam Pro", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
