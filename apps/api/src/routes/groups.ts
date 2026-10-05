import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Hono, type Context } from "hono";
import { prisma, type Prisma } from "@pod/db";
import {
  areaExtraPrice,
  designFields,
  GROUP_MAX_MEMBERS,
  groupCreateSchema,
  groupMemberSchema,
  groupPatchSchema,
  orderDesignSchema,
  parseTiers,
  type GroupView,
  type OrderDesign,
} from "@pod/shared";
import { badRequest, notFound } from "../lib/http";
import { HTTPException } from "hono/http-exception";
import { rateLimit } from "../lib/rate-limit";

/**
 * Gom đơn nhóm qua link (/nhom/<code>). Không cần đăng nhập:
 * - trưởng nhóm giữ khoá quản lý (trong link quản lý) -> sửa/đóng nhóm, xoá dòng
 * - mỗi thành viên giữ khoá sửa của dòng mình (lưu trên máy) -> xoá/sửa dòng của mình
 * Server chỉ lưu sha256 của khoá.
 */
export const groupRoutes = new Hono();

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const token = (bytes = 18) => randomBytes(bytes).toString("base64url");
/** mã link: 8 ký tự dễ đọc (không 0/O/1/l) */
function newCode() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  const b = randomBytes(8);
  return Array.from(b, (x) => abc[x % abc.length]).join("");
}
function sameHash(key: string | undefined, hash: string) {
  if (!key) return false;
  const a = Buffer.from(sha(key), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
const forbidden = () => new HTTPException(403, { message: "Không có quyền – dùng link quản lý của trưởng nhóm" });
const adminKey = (c: Context) => c.req.header("x-group-key") ?? undefined;
const deadlinePassed = (d: string) => !!d && Date.now() > new Date(`${d}T23:59:59+07:00`).getTime();

async function loadGroup(code: string) {
  const g = await prisma.groupOrder.findUnique({
    where: { code },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          basePrice: true,
          salePrice: true,
          saleEndsAt: true,
          minQty: true,
          priceTiers: true,
          isActive: true,
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { color: true, colorHex: true, size: true, priceDelta: true } },
          printAreas: { select: { key: true, extraPrice: true } },
        },
      },
    },
  });
  if (!g) throw notFound("Link nhóm không tồn tại hoặc đã bị xoá");
  return g;
}

function view(g: Awaited<ReturnType<typeof loadGroup>>, isAdmin: boolean): GroupView {
  const design = g.design as unknown as OrderDesign;
  const vs = g.product.variants.filter((v) => !g.color || v.color === g.color);
  const list = vs.length ? vs : g.product.variants;
  const sizes = [...new Map(list.filter((v) => v.size).map((v) => [v.size, { size: v.size, priceDelta: v.priceDelta }])).values()];
  return {
    code: g.code,
    title: g.title,
    color: g.color,
    colorHex: list.find((v) => /^#[0-9a-f]{6}$/i.test(v.colorHex))?.colorHex ?? "",
    deadline: g.deadline,
    closed: g.closed || deadlinePassed(g.deadline),
    isAdmin,
    createdAt: g.createdAt.toISOString(),
    fields: designFields(design.json),
    previews: design.files.map((f) => ({ area: f.area, name: f.name, url: f.previewUrl })),
    product: {
      id: g.product.id,
      slug: g.product.slug,
      name: g.product.name,
      basePrice: g.product.basePrice,
      salePrice: g.product.salePrice,
      saleEndsAt: g.product.saleEndsAt?.toISOString() ?? null,
      minQty: g.product.minQty,
      priceTiers: parseTiers(g.product.priceTiers),
      sizes: sizes.length ? sizes : [{ size: "FREE SIZE", priceDelta: 0 }],
      areaExtras: areaExtraPrice(g.product.printAreas, design.files.map((f) => f.area)),
    },
    members: g.members.map((m) => ({ id: m.id, person: m.person, printName: m.printName, number: m.number, size: m.size, qty: m.qty, createdAt: m.createdAt.toISOString(), ...(isAdmin ? { note: m.note } : {}) })),
    ...(isAdmin ? { design } : {}),
  };
}

/** Tạo nhóm từ thiết kế đã hoàn tất */
groupRoutes.post("/groups", rateLimit({ key: "group-create", limit: 12, windowMs: 60 * 60_000 }), async (c) => {
  const input = groupCreateSchema.parse(await c.req.json());
  const product = await prisma.product.findFirst({ where: { id: input.productId, isActive: true }, select: { id: true, basePrice: true } });
  if (!product) throw notFound("Sản phẩm không còn bán");
  if (product.basePrice <= 0) throw badRequest("Sản phẩm này cần báo giá – gửi yêu cầu báo giá thay vì gom nhóm");
  const design = orderDesignSchema.parse(input.design);
  const key = token();
  let code = newCode();
  for (let i = 0; i < 3 && (await prisma.groupOrder.findUnique({ where: { code }, select: { id: true } })); i++) code = newCode();
  await prisma.groupOrder.create({
    data: { code, productId: product.id, title: input.title, color: input.color, deadline: input.deadline, design: design as unknown as Prisma.InputJsonValue, adminHash: sha(key) },
  });
  return c.json({ code, adminKey: key }, 201);
});

groupRoutes.get("/groups/:code", async (c) => {
  const g = await loadGroup(c.req.param("code"));
  c.header("Cache-Control", "no-store");
  return c.json(view(g, sameHash(adminKey(c), g.adminHash)));
});

/** Trưởng nhóm: đổi tên nhóm, hạn chót, đóng/mở ghi danh */
groupRoutes.patch("/groups/:code", async (c) => {
  const g = await loadGroup(c.req.param("code"));
  if (!sameHash(adminKey(c), g.adminHash)) throw forbidden();
  const p = groupPatchSchema.parse(await c.req.json());
  await prisma.groupOrder.update({ where: { id: g.id }, data: p });
  return c.json(view(await loadGroup(g.code), true));
});

/** Thành viên ghi danh */
groupRoutes.post("/groups/:code/members", rateLimit({ key: "group-join", limit: 40, windowMs: 60 * 60_000 }), async (c) => {
  const g = await loadGroup(c.req.param("code"));
  const isAdmin = sameHash(adminKey(c), g.adminHash);
  if ((g.closed || deadlinePassed(g.deadline)) && !isAdmin) throw badRequest("Nhóm đã chốt danh sách – liên hệ trưởng nhóm");
  if (g.members.length >= GROUP_MAX_MEMBERS) throw badRequest(`Nhóm tối đa ${GROUP_MAX_MEMBERS} dòng`);
  const m = groupMemberSchema.parse(await c.req.json());
  const v = view(g, isAdmin);
  if (!v.product.sizes.some((s) => s.size === m.size)) throw badRequest("Size không có trong sản phẩm");
  if (v.fields.includes("name") && !m.printName) m.printName = m.person.slice(0, 30);
  const key = token(12);
  const row = await prisma.groupMember.create({ data: { ...m, groupId: g.id, editHash: sha(key) }, select: { id: true } });
  return c.json({ id: row.id, editKey: key }, 201);
});

/** Xoá 1 dòng: chính thành viên đó (khoá sửa) hoặc trưởng nhóm */
groupRoutes.delete("/groups/:code/members/:id", async (c) => {
  const g = await loadGroup(c.req.param("code"));
  const m = g.members.find((x) => x.id === c.req.param("id"));
  if (!m) throw notFound("Không tìm thấy dòng này");
  const isAdmin = sameHash(adminKey(c), g.adminHash);
  if (!isAdmin && !sameHash(c.req.header("x-member-key") ?? undefined, m.editHash)) throw forbidden();
  if (!isAdmin && (g.closed || deadlinePassed(g.deadline))) throw badRequest("Nhóm đã chốt danh sách – liên hệ trưởng nhóm");
  await prisma.groupMember.delete({ where: { id: m.id } });
  return c.json({ ok: true });
});
