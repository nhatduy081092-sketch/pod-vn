/** Bảng pastel theo thứ tự xoay vòng (khối chủ đề, sticker) – cam đậm + đen vẫn là màu chính */
export const PASTEL_BG = ["bg-sun", "bg-sky", "bg-bubble", "bg-mint", "bg-lilac", "bg-peach"] as const;
export const PASTEL_HEX = ["#FFD23F", "#8FD3FF", "#FF9EC0", "#A6E58A", "#C9B8FF", "#FFE3CF"] as const;
export const pastel = (i: number) => PASTEL_BG[((i % PASTEL_BG.length) + PASTEL_BG.length) % PASTEL_BG.length]!;
export const pastelHex = (i: number) => PASTEL_HEX[((i % PASTEL_HEX.length) + PASTEL_HEX.length) % PASTEL_HEX.length]!;
/** Góc nghiêng "sticker" xen kẽ, ổn định theo vị trí (không ngẫu nhiên -> không lệch khi hydrate) */
export const tiltOf = (i: number) => [-3, 2, -1.5, 3, -2.5, 1.5][i % 6]!;
