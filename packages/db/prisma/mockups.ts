/**
 * Sinh ảnh mockup SVG (placeholder) cho sản phẩm in toàn thân.
 * Chạy: pnpm --filter @pod/db exec tsx prisma/mockups.ts
 * Output: apps/api/public/mock/*.svg (API phục vụ tại /mock/*)
 * Thay bằng ảnh thật qua CMS khi có ảnh chụp sản phẩm.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type Shape =
  | "tshirt" | "kids-tee" | "longsleeve" | "hoodie" | "tank" | "shirt" | "polo" | "jersey"
  | "shorts" | "pants" | "pajama" | "dress" | "tote" | "bucket" | "sock" | "bandana";
export type Pattern =
  | "stripes" | "dots" | "check" | "camo" | "leopard" | "tropical" | "waves" | "stars"
  | "tiedye" | "geo" | "halftone" | "gradient";

export type MockSpec = { file: string; shape: Shape; pattern: Pattern; palette: [string, string, string, string] };

const TSHIRT = "M150 58 L108 70 L42 118 L74 178 L112 155 L112 352 L288 352 L288 155 L326 178 L358 118 L292 70 L250 58 Q200 92 150 58 Z";
const LONG = "M150 58 L106 70 L66 120 L40 330 L86 338 L112 180 L112 352 L288 352 L288 180 L314 338 L360 330 L334 120 L294 70 L250 58 Q200 92 150 58 Z";
const HOOD = "M148 64 Q144 14 200 12 Q256 14 252 64 Q200 98 148 64 Z";
const TANK = "M152 48 L132 48 Q134 118 104 150 L108 352 L292 352 L296 150 Q266 118 268 48 L248 48 Q200 112 152 48 Z";
const SHORTS = "M112 70 L288 70 L306 300 L214 306 L200 168 L186 306 L94 300 Z";
const PANTS = "M132 36 L268 36 L284 368 L218 368 L200 128 L182 368 L116 368 Z";
const DRESS = "M162 48 L148 48 Q150 104 128 136 L78 360 L322 360 L272 136 Q250 104 252 48 L238 48 Q200 96 162 48 Z";
const TOTE = "M96 150 L304 150 L316 362 L84 362 Z";
const BUCKET = "M112 196 Q114 112 200 104 Q286 112 288 196 L352 252 Q200 296 48 252 Z";
const SOCK = "M152 36 L232 36 L234 246 Q236 300 186 330 L120 352 Q76 358 80 318 Q84 290 128 268 L152 250 Z";
const BANDANA = "M200 40 L360 200 L200 360 L40 200 Z";

type Part = { d: string; transform?: string };

function partsFor(shape: Shape): { parts: Part[]; details: string[]; extra?: string } {
  switch (shape) {
    case "tshirt":
      return { parts: [{ d: TSHIRT }], details: ["M150 58 Q200 100 250 58", "M112 340 L288 340"] };
    case "kids-tee":
      return {
        parts: [{ d: TSHIRT, transform: "translate(40 50) scale(0.8)" }],
        details: [],
      };
    case "longsleeve":
      return { parts: [{ d: LONG }], details: ["M150 58 Q200 100 250 58", "M42 316 L86 322", "M314 322 L358 316", "M112 336 L288 336"] };
    case "hoodie":
      return {
        parts: [{ d: HOOD }, { d: LONG }],
        details: ["M148 64 Q200 98 252 64", "M140 270 L260 270 L272 330 L128 330 Z", "M188 88 L186 146", "M212 88 L214 146", "M42 316 L86 322", "M314 322 L358 316"],
      };
    case "tank":
      return { parts: [{ d: TANK }], details: ["M152 48 Q200 112 248 48", "M108 340 L292 340"] };
    case "shirt":
      return {
        parts: [{ d: TSHIRT }],
        details: ["M150 58 L178 98 L200 72 L222 98 L250 58", "M200 72 L200 352"],
        extra: [110, 160, 210, 260, 310].map((y) => `<circle cx="206" cy="${y}" r="3.5" fill="#fff" stroke="#1d1d1f" stroke-opacity=".4"/>`).join(""),
      };
    case "polo":
      return {
        parts: [{ d: TSHIRT }],
        details: ["M150 58 L176 92 L200 74 L224 92 L250 58", "M200 74 L200 138"],
        extra: [96, 118].map((y) => `<circle cx="206" cy="${y}" r="3.5" fill="#fff" stroke="#1d1d1f" stroke-opacity=".4"/>`).join(""),
      };
    case "jersey":
      return {
        parts: [{ d: TSHIRT }],
        details: ["M150 58 L200 124 L250 58", "M200 124 L200 352"],
        extra: [150, 196, 242, 288, 334].map((y) => `<circle cx="207" cy="${y}" r="3.5" fill="#fff" stroke="#1d1d1f" stroke-opacity=".4"/>`).join(""),
      };
    case "shorts":
      return { parts: [{ d: SHORTS }], details: ["M112 92 L288 92", "M190 92 L188 128", "M210 92 L212 128"] };
    case "pants":
      return { parts: [{ d: PANTS }], details: ["M132 58 L268 58"] };
    case "pajama":
      return {
        parts: [
          { d: TSHIRT, transform: "translate(-6 40) scale(0.62)" },
          { d: PANTS, transform: "translate(170 50) scale(0.6 0.84)" },
        ],
        details: [],
      };
    case "dress":
      return { parts: [{ d: DRESS }], details: ["M162 48 Q200 96 238 48", "M128 170 L272 170"] };
    case "tote":
      return {
        parts: [{ d: TOTE }],
        details: [],
        extra: `<path d="M146 152 Q146 64 200 64 Q254 64 254 152" fill="none" stroke="#3b3024" stroke-width="10" stroke-linecap="round"/>`,
      };
    case "bucket":
      return { parts: [{ d: BUCKET }], details: ["M112 196 Q200 222 288 196"] };
    case "sock":
      return { parts: [{ d: SOCK }], details: ["M152 70 L232 70"] };
    case "bandana":
      return { parts: [{ d: BANDANA }], details: ["M200 62 L338 200 L200 338 L62 200 Z"] };
  }
}

function patternDef(pattern: Pattern, [bg, c1, c2, c3]: MockSpec["palette"]): string {
  switch (pattern) {
    case "stripes":
      return `<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="44" height="44" fill="${bg}"/><rect width="18" height="44" fill="${c1}"/><rect x="26" width="6" height="44" fill="${c2}"/></pattern>`;
    case "dots":
      return `<pattern id="p" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="${bg}"/><circle cx="9" cy="9" r="7" fill="${c1}"/><circle cx="27" cy="27" r="5" fill="${c2}"/><circle cx="27" cy="9" r="2" fill="${c3}"/></pattern>`;
    case "check":
      return `<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="${bg}"/><rect width="24" height="48" fill="${c1}" opacity=".55"/><rect width="48" height="24" fill="${c1}" opacity=".55"/><path d="M0 36 H48 M36 0 V48" stroke="${c2}" stroke-width="3"/><path d="M0 12 H48 M12 0 V48" stroke="${c3}" stroke-width="1.5"/></pattern>`;
    case "camo":
      return `<pattern id="p" width="140" height="140" patternUnits="userSpaceOnUse"><rect width="140" height="140" fill="${bg}"/><path d="M10 20 Q40 0 60 22 Q80 40 50 52 Q20 60 10 20Z" fill="${c1}"/><path d="M80 70 Q120 50 130 90 Q136 120 100 118 Q70 110 80 70Z" fill="${c2}"/><path d="M20 90 Q40 70 60 96 Q70 130 36 128 Q10 120 20 90Z" fill="${c3}"/><path d="M90 10 Q120 0 128 30 Q120 50 100 40 Q84 30 90 10Z" fill="${c3}"/></pattern>`;
    case "leopard":
      return `<pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="${bg}"/><ellipse cx="20" cy="20" rx="12" ry="9" fill="${c2}"/><ellipse cx="20" cy="20" rx="12" ry="9" fill="none" stroke="${c1}" stroke-width="5" stroke-dasharray="14 6"/><ellipse cx="60" cy="56" rx="11" ry="8" fill="${c2}"/><ellipse cx="60" cy="56" rx="11" ry="8" fill="none" stroke="${c1}" stroke-width="5" stroke-dasharray="12 7"/><circle cx="58" cy="16" r="4" fill="${c1}"/><circle cx="18" cy="62" r="4" fill="${c1}"/></pattern>`;
    case "tropical":
      return `<pattern id="p" width="150" height="150" patternUnits="userSpaceOnUse"><rect width="150" height="150" fill="${bg}"/><g fill="${c1}"><ellipse cx="40" cy="40" rx="34" ry="12" transform="rotate(-35 40 40)"/><ellipse cx="110" cy="100" rx="36" ry="13" transform="rotate(40 110 100)"/></g><g fill="${c2}"><ellipse cx="100" cy="30" rx="26" ry="10" transform="rotate(20 100 30)"/><ellipse cx="40" cy="115" rx="28" ry="10" transform="rotate(-60 40 115)"/></g><g fill="${c3}"><circle cx="75" cy="70" r="9"/><circle cx="140" cy="140" r="7"/><circle cx="10" cy="80" r="6"/></g></pattern>`;
    case "waves":
      return `<pattern id="p" width="60" height="36" patternUnits="userSpaceOnUse"><rect width="60" height="36" fill="${bg}"/><path d="M0 12 Q15 0 30 12 T60 12" fill="none" stroke="${c1}" stroke-width="6"/><path d="M0 28 Q15 16 30 28 T60 28" fill="none" stroke="${c2}" stroke-width="3"/></pattern>`;
    case "stars":
      return `<pattern id="p" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="${bg}"/><polygon points="14,2 17,10 26,10 19,15 22,24 14,19 6,24 9,15 2,10 11,10" fill="${c1}"/><polygon points="42,30 45,38 54,38 47,43 50,52 42,47 34,52 37,43 30,38 39,38" fill="${c2}"/><circle cx="44" cy="12" r="2.5" fill="${c3}"/></pattern>`;
    case "geo":
      return `<pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="${bg}"/><polygon points="0,60 30,0 60,60" fill="${c1}"/><polygon points="15,60 30,30 45,60" fill="${c2}"/><circle cx="30" cy="48" r="4" fill="${c3}"/></pattern>`;
    case "halftone":
      return `<pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${bg}"/><circle cx="11" cy="11" r="6" fill="${c1}"/></pattern><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}" stop-opacity=".0"/><stop offset="1" stop-color="${c2}" stop-opacity=".85"/></linearGradient>`;
    case "tiedye":
      return `<radialGradient id="p" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${bg}"/><stop offset=".25" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset=".75" stop-color="${c3}"/><stop offset="1" stop-color="${c1}"/></radialGradient>`;
    case "gradient":
      return `<linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`;
  }
}

function overlay(pattern: Pattern, [, c1, c2, c3]: MockSpec["palette"]): string {
  if (pattern === "tiedye") {
    return `<g fill="none" stroke-width="14" opacity=".35"><circle cx="200" cy="190" r="60" stroke="${c3}"/><circle cx="200" cy="190" r="110" stroke="${c2}"/><circle cx="200" cy="190" r="160" stroke="#fff"/></g>`;
  }
  if (pattern === "halftone") return `<rect width="400" height="400" fill="url(#hg)"/>`;
  if (pattern === "gradient") {
    return `<g opacity=".25" fill="#fff"><circle cx="120" cy="120" r="50"/><circle cx="290" cy="260" r="80"/></g><path d="M0 260 Q100 200 200 250 T400 230" stroke="${c1}" stroke-width="18" fill="none" opacity=".5"/>`;
  }
  return "";
}

export function renderMockSvg(spec: MockSpec): string {
  const { parts, details, extra } = partsFor(spec.shape);
  const paths = parts.map((p) => `<path d="${p.d}"${p.transform ? ` transform="${p.transform}"` : ""}/>`).join("");
  const scaleTf = parts.length === 1 && parts[0]!.transform ? ` transform="${parts[0]!.transform}"` : "";
  const detailPaths = details.map((d) => `<path d="${d}"${scaleTf}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800">
<defs>${patternDef(spec.pattern, spec.palette)}
<clipPath id="g">${paths}</clipPath>
<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".3" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
</defs>
<ellipse cx="200" cy="374" rx="140" ry="9" fill="#000" opacity=".07"/>
<g clip-path="url(#g)"><rect width="400" height="400" fill="url(#p)"/>${overlay(spec.pattern, spec.palette)}<rect width="400" height="400" fill="url(#shade)"/></g>
<g fill="none" stroke="#1d1d1f" stroke-opacity=".35" stroke-width="2" stroke-linejoin="round">${paths}${detailPaths}</g>
${extra ?? ""}
</svg>`;
}

/** Danh sách mockup dùng cho seed – đổi palette tuỳ ý */
export const MOCKS: MockSpec[] = [
  // Áo thun
  { file: "tee-pink-waves.svg", shape: "tshirt", pattern: "waves", palette: ["#F7C6D9", "#E86A9E", "#FFFFFF", "#B23A6F"] },
  { file: "tee-tiedye-pastel.svg", shape: "tshirt", pattern: "tiedye", palette: ["#FFF3B0", "#F9A8D4", "#C4B5FD", "#93C5FD"] },
  { file: "tee-tropical.svg", shape: "tshirt", pattern: "tropical", palette: ["#FFF7E0", "#2E8B57", "#F4A261", "#E63946"] },
  { file: "tee-geo-night.svg", shape: "tshirt", pattern: "geo", palette: ["#1E1B4B", "#6D28D9", "#22D3EE", "#FDE047"] },
  { file: "tee-ocean-gradient.svg", shape: "tshirt", pattern: "gradient", palette: ["#fff", "#22D3EE", "#3B82F6", "#1E3A8A"] },
  { file: "tee-kids-stars.svg", shape: "kids-tee", pattern: "stars", palette: ["#FDE68A", "#F97316", "#2563EB", "#DC2626"] },
  // Hoodie & Sweater
  { file: "hoodie-camo.svg", shape: "hoodie", pattern: "camo", palette: ["#C9CBA3", "#6B705C", "#3F4238", "#A5A58D"] },
  { file: "hoodie-galaxy.svg", shape: "hoodie", pattern: "tiedye", palette: ["#F0ABFC", "#7C3AED", "#1E1B4B", "#EC4899"] },
  { file: "sweater-halftone.svg", shape: "longsleeve", pattern: "halftone", palette: ["#DBEAFE", "#93C5FD", "#1D4ED8", "#fff"] },
  { file: "sweater-check.svg", shape: "longsleeve", pattern: "check", palette: ["#FEF3C7", "#B45309", "#78350F", "#FFFFFF"] },
  { file: "hoodie-neon-dots.svg", shape: "hoodie", pattern: "dots", palette: ["#111827", "#A3E635", "#F472B6", "#38BDF8"] },
  // Pijama
  { file: "pajama-check.svg", shape: "pajama", pattern: "check", palette: ["#FCE7F3", "#F472B6", "#BE185D", "#FFFFFF"] },
  { file: "pajama-tropical.svg", shape: "pajama", pattern: "tropical", palette: ["#E0F2FE", "#0E7490", "#84CC16", "#FB923C"] },
  { file: "pajama-stars.svg", shape: "pajama", pattern: "stars", palette: ["#1E3A8A", "#FDE047", "#FFFFFF", "#F472B6"] },
  { file: "pajama-dots.svg", shape: "pajama", pattern: "dots", palette: ["#FFF1F2", "#FB7185", "#FDA4AF", "#BE123C"] },
  // Sơ mi & Polo
  { file: "shirt-hawaii.svg", shape: "shirt", pattern: "tropical", palette: ["#0F766E", "#FDE047", "#F97316", "#FFFFFF"] },
  { file: "shirt-stripes.svg", shape: "shirt", pattern: "stripes", palette: ["#FFFFFF", "#60A5FA", "#1E3A8A", "#fff"] },
  { file: "polo-geo.svg", shape: "polo", pattern: "geo", palette: ["#FEF9C3", "#F59E0B", "#0EA5E9", "#111827"] },
  { file: "polo-gradient.svg", shape: "polo", pattern: "gradient", palette: ["#fff", "#F97316", "#EF4444", "#7C2D12"] },
  // Đồ thể thao
  { file: "jersey-baseball.svg", shape: "jersey", pattern: "gradient", palette: ["#fff", "#F97316", "#EAB308", "#0F766E"] },
  { file: "tank-leopard.svg", shape: "tank", pattern: "leopard", palette: ["#BFDBFE", "#111827", "#60A5FA", "#fff"] },
  { file: "shorts-camo.svg", shape: "shorts", pattern: "camo", palette: ["#FDE68A", "#F59E0B", "#92400E", "#FCD34D"] },
  { file: "leggings-waves.svg", shape: "pants", pattern: "waves", palette: ["#ECFCCB", "#65A30D", "#FACC15", "#fff"] },
  { file: "dress-tropical.svg", shape: "dress", pattern: "tropical", palette: ["#FFE4E6", "#16A34A", "#F43F5E", "#FACC15"] },
  // Phụ kiện
  { file: "tote-dots.svg", shape: "tote", pattern: "dots", palette: ["#FEF3C7", "#EA580C", "#0EA5E9", "#111827"] },
  { file: "bucket-camo.svg", shape: "bucket", pattern: "camo", palette: ["#E0E7FF", "#6366F1", "#312E81", "#A5B4FC"] },
  { file: "sock-stripes.svg", shape: "sock", pattern: "stripes", palette: ["#FFFFFF", "#EF4444", "#111827", "#fff"] },
  { file: "bandana-leopard.svg", shape: "bandana", pattern: "leopard", palette: ["#FDE68A", "#78350F", "#F59E0B", "#fff"] },
];

/** Silhouette (mask) + lớp viền/đổ bóng (line) cho trình xem trước thiết kế phía web */
export function renderShapeAssets(shape: Shape): { mask: string; line: string } {
  const { parts, details, extra } = partsFor(shape);
  const paths = parts.map((p) => `<path d="${p.d}"${p.transform ? ` transform="${p.transform}"` : ""}/>`).join("");
  const scaleTf = parts.length === 1 && parts[0]!.transform ? ` transform="${parts[0]!.transform}"` : "";
  const detailPaths = details.map((d) => `<path d="${d}"${scaleTf}/>`).join("");
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><g fill="#000">${paths}</g></svg>`;
  const line = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<defs><clipPath id="g">${paths}</clipPath>
<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".3" stop-color="#fff" stop-opacity=".15"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
<g clip-path="url(#g)"><rect width="400" height="400" fill="url(#shade)"/></g>
<g fill="none" stroke="#1d1d1f" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round">${paths}${detailPaths}</g>${extra ?? ""}</svg>`;
  return { mask, line };
}

// CLI
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/api/public/mock");
  mkdirSync(out, { recursive: true });
  for (const m of MOCKS) writeFileSync(resolve(out, m.file), renderMockSvg(m));
  console.log(`✓ Đã tạo ${MOCKS.length} mockup tại ${out}`);

  const shapesOut = resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/web/public/shapes");
  mkdirSync(shapesOut, { recursive: true });
  const shapes = [...new Set(MOCKS.map((m) => m.shape))];
  for (const sh of shapes) {
    const { mask, line } = renderShapeAssets(sh);
    writeFileSync(resolve(shapesOut, `mask-${sh}.svg`), mask);
    writeFileSync(resolve(shapesOut, `line-${sh}.svg`), line);
  }
  console.log(`✓ Đã tạo ${shapes.length} shape (mask/line) tại ${shapesOut}`);
}
