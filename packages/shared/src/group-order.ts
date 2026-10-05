import { z } from "zod";
import { orderDesignSchema, type OrderDesign } from "./design";

/**
 * Gom đơn nhóm qua link: trưởng nhóm tạo link từ thiết kế đã hoàn tất, gửi Zalo/Messenger;
 * mỗi thành viên mở link tự ghi tên (tên/số in nếu thiết kế có ô tên/số), size, số lượng;
 * trưởng nhóm xem danh sách đếm size rồi đặt 1 đơn (danh sách đi thẳng vào đơn đồng phục).
 */
export const GROUP_MAX_MEMBERS = 300;

export const groupCreateSchema = z.object({
  productId: z.string().min(1).max(40),
  color: z.string().trim().max(40).default(""),
  title: z.string().trim().max(80).default(""),
  deadline: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Ngày không hợp lệ")
    .default(""),
  design: orderDesignSchema,
});
export type GroupCreateInput = z.infer<typeof groupCreateSchema>;

export const groupMemberSchema = z.object({
  person: z.string().trim().min(1, "Nhập tên của bạn").max(40, "Tên tối đa 40 ký tự"),
  printName: z.string().trim().max(30, "Tên in tối đa 30 ký tự").default(""),
  number: z
    .string()
    .trim()
    .regex(/^\d{0,3}$/, "Số áo tối đa 3 chữ số")
    .default(""),
  size: z.string().trim().min(1, "Chọn size").max(20),
  qty: z.coerce.number().int().min(1, "Số lượng ít nhất 1").max(50, "Tối đa 50 cái mỗi người"),
  note: z.string().trim().max(60).default(""),
});
export type GroupMemberInput = z.infer<typeof groupMemberSchema>;

export const groupPatchSchema = z.object({
  title: z.string().trim().max(80).optional(),
  deadline: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/)
    .optional(),
  closed: z.boolean().optional(),
});

export type GroupMemberView = { id: string; person: string; printName: string; number: string; size: string; qty: number; note?: string; createdAt: string };
export type GroupView = {
  code: string;
  title: string;
  color: string;
  colorHex: string;
  deadline: string;
  closed: boolean;
  isAdmin: boolean;
  createdAt: string;
  fields: ("name" | "number")[];
  previews: { area: string; name: string; url: string }[];
  product: {
    id: string;
    slug: string;
    name: string;
    basePrice: number;
    salePrice: number | null;
    saleEndsAt: string | null;
    minQty: number;
    priceTiers: { minQty: number; price: number }[];
    sizes: { size: string; priceDelta: number }[];
    areaExtras: number;
  };
  members: GroupMemberView[];
  /** chỉ trả cho trưởng nhóm (để đặt đơn) */
  design?: OrderDesign;
};

/** Đổi danh sách thành viên -> danh sách đồng phục (mỗi cái 1 dòng) để đặt đơn */
export function groupToRoster(members: Pick<GroupMemberView, "person" | "printName" | "number" | "size" | "qty" | "note">[], fields: ("name" | "number")[]) {
  const rows: { name: string; number: string; size: string; note: string }[] = [];
  const printsName = fields.includes("name");
  for (const m of members) {
    // ghi tên người đặt để xưởng chia hàng (khi tên đó không in sẵn trên áo)
    const who = printsName && (!m.printName || m.printName === m.person) ? "" : m.person;
    const note = [who, m.note].filter(Boolean).join(" · ").slice(0, 60);
    for (let i = 0; i < m.qty; i++)
      rows.push({ name: printsName ? (m.printName || m.person).slice(0, 30) : "", number: fields.includes("number") ? m.number : "", size: m.size, note });
  }
  return rows;
}
