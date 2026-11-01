/** Nền khối xoay vòng (tên cũ "pastel"; 11/2026 đã thành 3 bậc ghi ấm theo tailwind.config) – cam đậm + đen là màu chính */
export const PASTEL_BG = ["bg-sun", "bg-sky", "bg-bubble", "bg-mint", "bg-lilac", "bg-peach"] as const;
export const PASTEL_HEX = ["#ebe7e1", "#e4e1dc", "#efebe6", "#e4e1dc", "#ebe7e1", "#efebe6"] as const;
export const pastel = (i: number) => PASTEL_BG[((i % PASTEL_BG.length) + PASTEL_BG.length) % PASTEL_BG.length]!;
export const pastelHex = (i: number) => PASTEL_HEX[((i % PASTEL_HEX.length) + PASTEL_HEX.length) % PASTEL_HEX.length]!;
/** Góc nghiêng "sticker" xen kẽ, ổn định theo vị trí (không ngẫu nhiên -> không lệch khi hydrate) */
export const tiltOf = (i: number) => [-3, 2, -1.5, 3, -2.5, 1.5][i % 6]!;
