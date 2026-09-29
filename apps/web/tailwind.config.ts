import type { Config } from "tailwindcss";

/** Màu lấy mẫu trực tiếp từ trang tham chiếu */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        cream: "#FFF6C1",
        banner: "#FDF3B0",
        brand: {
          DEFAULT: "#FFA415", // khung card sản phẩm
          dark: "#F08A00",
          yellow: "#FEBB2E", // hero
          gold: "#FFC21A", // nút CTA
          band: "#FF9D21",
          badge: "#FFE44D", // chữ vàng trên nền đen
        },
        zalo: "#0068FF",
        // nhận diện OEM Group (lấy từ oemgroup.vn)
        navy: { DEFAULT: "#1C4D99", dark: "#0F2F63", light: "#E8EFFA" },
        oem: "#F88125",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Be Vietnam Pro", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // hiệu ứng "xấp giấy" viền đen lệch như mẫu
        stack: "5px 5px 0 -2px #fff, 5px 5px 0 0 #1d1d1f",
        "stack-sm": "3px 3px 0 -1px #fff, 3px 3px 0 0 #1d1d1f",
        hard: "3px 3px 0 0 #1d1d1f",
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
} satisfies Config;
