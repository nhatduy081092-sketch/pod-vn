import type { Config } from "tailwindcss";

/** Màu lấy mẫu trực tiếp từ trang tham chiếu */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Hệ màu YALA: ĐEN (ink) + CAM ĐẬM (brand) là chủ đạo, nền trung tính; đỏ riêng cho giá sale.
           Các tên cũ (cream, navy, brand-*) giữ lại nhưng trỏ về bảng màu mới để toàn site đổi đồng loạt. */
        ink: "#2a2522", // đen than ấm (11/2026: chữ phối cam + đen, không đen thuần)
        muted: "#57534e",
        line: "#dedbd5",
        surface: "#f4f4f2",
        cream: "#f4f4f2",
        banner: "#f4f4f2",
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
        navy: { DEFAULT: "#2a2522", dark: "#1a1614", light: "#f1eee9" },
        accent: "#E4570B",
        /* Màu nền khối (11/2026 – tông cam đen chững chạc): chỉ còn 3 bậc ghi ấm, bỏ hẳn xanh/hồng/tím.
           Giữ tên cũ (sun, sky…) để toàn site đổi đồng loạt; cam chỉ ở nút, vạch nhấn và khối nhấn. */
        sun: "#ebe7e1", // vải mộc
        sky: "#e4e1dc", // ghi ấm
        bubble: "#efebe6", // ghi sáng
        mint: "#e4e1dc",
        lilac: "#ebe7e1",
        peach: "#efebe6",
        sale: "#D62828", // đỏ – tách khỏi cam thương hiệu
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Be Vietnam Pro", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Be Vietnam Pro", "system-ui", "sans-serif"],
      },
      // Chữ nhẹ hơn: font-black/extrabold cũ -> 700/600 (tiêu đề to nhưng không nặng)
      fontWeight: {
        extrabold: "700",
        black: "700",
      },
      boxShadow: {
        // bỏ bóng cứng viền đen -> bóng mềm
        stack: "0 1px 2px rgb(42 37 34 / .04), 0 10px 30px -12px rgb(42 37 34 / .14)",
        "stack-sm": "0 1px 2px rgb(42 37 34 / .05), 0 6px 18px -10px rgb(42 37 34 / .14)",
        hard: "0 1px 2px rgb(42 37 34 / .06), 0 4px 14px -6px rgb(42 37 34 / .16)",
        soft: "0 1px 2px rgb(42 37 34 / .04), 0 10px 30px -12px rgb(42 37 34 / .14)",
        // tên cũ "sticker" giữ lại nhưng thành bóng mềm (bỏ bóng cứng lệch – kiểu vui nhộn cũ)
        sticker: "0 1px 2px rgb(42 37 34 / .05), 0 8px 24px -14px rgb(42 37 34 / .22)",
        "sticker-sm": "0 1px 2px rgb(42 37 34 / .05)",
        "sticker-lg": "0 1px 2px rgb(42 37 34 / .05), 0 14px 36px -16px rgb(42 37 34 / .25)",
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
} satisfies Config;
