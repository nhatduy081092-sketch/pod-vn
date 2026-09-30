import type { Config } from "tailwindcss";

/** Màu lấy mẫu trực tiếp từ trang tham chiếu */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Hệ màu YALA 2026: nền trung tính, 1 màu nhấn cam cho hành động mua & giá sale.
           Các tên cũ (cream, navy, brand-*) giữ lại nhưng trỏ về bảng màu mới để toàn site đổi đồng loạt. */
        ink: "#1d1d1f",
        muted: "#6b6660",
        line: "#e7e3dd",
        surface: "#f6f4f1",
        cream: "#f6f4f1",
        banner: "#f6f4f1",
        brand: {
          DEFAULT: "#F2711C", // cam YALA – nút mua, giá sale, trạng thái chọn
          dark: "#D65F10",
          light: "#FFF1E7",
          yellow: "#f6f4f1",
          gold: "#F2711C",
          band: "#F2711C",
          badge: "#ffffff",
        },
        zalo: "#0068FF",
        navy: { DEFAULT: "#1d1d1f", dark: "#000000", light: "#f1eee9" },
        accent: "#F2711C",
        sale: "#D9480F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Be Vietnam Pro", "system-ui", "sans-serif"],
      },
      // Chữ nhẹ hơn: font-black/extrabold cũ -> 700/600 (tiêu đề to nhưng không nặng)
      fontWeight: {
        extrabold: "650",
        black: "700",
      },
      boxShadow: {
        // bỏ bóng cứng viền đen -> bóng mềm
        stack: "0 1px 2px rgb(29 29 31 / .04), 0 10px 30px -12px rgb(29 29 31 / .14)",
        "stack-sm": "0 1px 2px rgb(29 29 31 / .05), 0 6px 18px -10px rgb(29 29 31 / .14)",
        hard: "0 1px 2px rgb(29 29 31 / .06), 0 4px 14px -6px rgb(29 29 31 / .16)",
        soft: "0 1px 2px rgb(29 29 31 / .04), 0 10px 30px -12px rgb(29 29 31 / .14)",
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
} satisfies Config;
