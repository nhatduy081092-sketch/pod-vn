import type { Config } from "tailwindcss";

/** Màu lấy mẫu trực tiếp từ trang tham chiếu */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Hệ màu YALA: ĐEN (ink) + CAM ĐẬM (brand) là chủ đạo, nền trung tính; đỏ riêng cho giá sale.
           Các tên cũ (cream, navy, brand-*) giữ lại nhưng trỏ về bảng màu mới để toàn site đổi đồng loạt. */
        ink: "#1d1d1f",
        muted: "#6b6660",
        line: "#e7e3dd",
        surface: "#f6f4f1",
        cream: "#f6f4f1",
        banner: "#f6f4f1",
        brand: {
          DEFAULT: "#E4570B", // cam đậm YALA – nút mua, điểm nhấn, trạng thái chọn
          dark: "#C2410C", // hover + chữ cam trên nền trắng (đủ tương phản AA)
          light: "#FFF1E6",
          yellow: "#f6f4f1",
          gold: "#E4570B",
          band: "#E4570B",
          badge: "#ffffff",
        },
        zalo: "#0068FF",
        navy: { DEFAULT: "#1d1d1f", dark: "#000000", light: "#f1eee9" },
        accent: "#E4570B",
        sale: "#D62828", // đỏ – tách khỏi cam thương hiệu
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
