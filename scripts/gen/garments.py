"""
Sinh bộ phôi basic (SVG 400x400) cho YALA:
  apps/web/public/shapes/basic/<g>.svg            – phôi trắng nền trong suốt (công cụ thiết kế nhuộm màu vải bằng multiply)
  apps/web/public/shapes/basic/<g>-<mau>.svg      – ảnh sản phẩm theo màu (card, trang sản phẩm)
Chạy: python3 scripts/gen/garments.py
"""
import os, json
OUT = os.path.join(os.path.dirname(__file__), "../../apps/web/public/shapes/basic")
os.makedirs(OUT, exist_ok=True)

# ---- Dáng áo: body = viền ngoài; trims = bo cổ/tay/gấu (tô đậm hơn chút); seams = đường may; folds = nếp vải; inner = mặt trong cổ sau
TEE_BODY = "M158 58 Q200 88 242 58 L292 70 C314 78 334 108 352 148 L306 178 C300 172 294 168 288 166 L292 350 C236 358 164 358 108 350 L112 166 C106 168 100 172 94 178 L48 148 C66 108 86 78 108 70 Z"
LS_BODY = "M158 58 Q200 88 242 58 L292 70 C316 80 330 110 338 150 L352 318 C352 326 346 330 340 330 L312 332 C306 332 302 328 302 322 L290 190 L292 350 C236 358 164 358 108 350 L110 190 L98 322 C98 328 94 332 88 332 L60 330 C54 330 48 326 48 318 L62 150 C70 110 84 80 108 70 Z"
HOOD = "M154 66 C140 40 150 14 200 12 C250 14 260 40 246 66 C236 82 220 90 200 90 C180 90 164 82 154 66 Z"
GARMENTS = {
  "tshirt": dict(body=TEE_BODY, trims=["M158 58 Q200 88 242 58 L236 56 Q200 80 164 56 Z"],
                 seams=["M112 166 C108 150 108 110 108 70", "M288 166 C292 150 292 110 292 70", "M60 156 L98 182", "M340 156 L302 182", "M110 340 C164 347 236 347 290 340"],
                 folds=["M128 190 C138 230 132 280 140 330", "M270 200 C262 240 268 290 258 332", "M196 120 C204 170 194 230 202 300"],
                 inner="M158 58 Q200 63 242 58 Q200 88 158 58 Z"),
  "longsleeve": dict(body=LS_BODY, trims=["M158 58 Q200 88 242 58 L236 56 Q200 80 164 56 Z", "M50 314 L98 318 L97 330 L49 327 Z", "M302 318 L350 314 L351 327 L303 330 Z"],
                 seams=["M110 190 C108 150 108 110 108 70", "M290 190 C292 150 292 110 292 70", "M110 340 C164 347 236 347 290 340"],
                 folds=["M128 200 C138 240 132 290 140 330", "M270 205 C262 245 268 292 258 332", "M74 190 C80 230 74 270 78 306", "M326 190 C320 230 326 270 322 306"],
                 inner="M158 58 Q200 63 242 58 Q200 88 158 58 Z"),
  "sweater": dict(body=LS_BODY, trims=["M156 58 Q200 92 244 58 L234 54 Q200 80 166 54 Z", "M50 310 L99 314 L97 331 L49 328 Z", "M301 314 L350 310 L351 328 L303 331 Z", "M108 336 C164 343 236 343 292 336 L292 350 C236 358 164 358 108 350 Z"],
                 seams=["M110 190 C108 150 108 110 108 70", "M290 190 C292 150 292 110 292 70"],
                 folds=["M130 200 C140 240 134 290 140 330", "M268 205 C260 245 266 292 258 330", "M74 190 C80 230 74 270 78 302", "M326 190 C320 230 326 270 322 302"],
                 inner="M156 58 Q200 62 244 58 Q200 92 156 58 Z", ribs=True),
  "hoodie": dict(body=LS_BODY, extra=[HOOD], trims=["M50 310 L99 314 L97 331 L49 328 Z", "M301 314 L350 310 L351 328 L303 331 Z", "M108 336 C164 343 236 343 292 336 L292 350 C236 358 164 358 108 350 Z"],
                 seams=["M110 190 C108 150 108 110 108 70", "M290 190 C292 150 292 110 292 70", "M142 256 L258 256 L270 318 L130 318 Z", "M142 256 L130 318", "M258 256 L270 318"],
                 folds=["M128 200 C136 230 132 250 136 256", "M272 205 C264 230 268 250 264 256", "M74 190 C80 230 74 270 78 302", "M326 190 C320 230 326 270 322 302"],
                 inner="M168 64 C176 80 224 80 232 64 C224 86 176 86 168 64 Z", strings=True, ribs=True),
  "jogger": dict(body="M130 40 L270 40 L276 62 C282 140 288 250 290 340 L292 362 L220 362 L218 340 L204 128 C202 118 198 118 196 128 L182 340 L180 362 L108 362 L110 340 C112 250 118 140 124 62 Z",
                 trims=["M130 40 L270 40 L276 62 L124 62 Z", "M110 340 L182 340 L180 362 L108 362 Z", "M218 340 L290 340 L292 362 L220 362 Z"],
                 seams=["M146 62 C150 90 146 110 136 118", "M254 62 C250 90 254 110 264 118", "M200 62 L200 118"],
                 folds=["M146 160 C150 220 142 280 150 336", "M254 160 C250 220 258 280 250 336", "M164 300 L176 318", "M236 300 L224 318"],
                 inner="", strings=True, ribs=True),
  "tote": dict(body="M92 150 L308 150 L318 360 C318 364 314 366 310 366 L90 366 C86 366 82 364 82 360 Z",
               extra_stroke=["M140 152 C140 60 260 60 260 152", "M152 152 C152 76 248 76 248 152"],
               trims=["M92 150 L308 150 L309 164 L91 164 Z"], seams=["M94 170 L306 170"],
               folds=["M140 200 C146 260 138 320 146 360", "M262 200 C256 260 264 320 256 360"], inner=""),
}

COLORS = {"trang": "#f7f6f2", "den": "#1f1f22", "kem": "#ece2cf", "xam": "#a7a9ad", "navy": "#233049", "nau": "#6b4f3f", "xanh-reu": "#556050", "hong": "#efc2c8"}

def svg(g, fill):
    d = GARMENTS[g]
    dark = fill in ("#1f1f22", "#233049", "#6b4f3f", "#556050")
    shapes = [d["body"]] + d.get("extra", [])
    clip = "".join(f'<path d="{p}"/>' for p in shapes)
    fold_col = "#000" if not dark else "#000"
    hi = ".10" if dark else ".22"
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800">',
      '<defs>',
      f'<clipPath id="c">{clip}</clipPath>',
      '<linearGradient id="v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".18" stop-color="#000" stop-opacity=".02"/>'
      f'<stop offset=".42" stop-color="#fff" stop-opacity="{hi}"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".86" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>',
      '<linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient>',
      '<filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>',
      '<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>',
      '<pattern id="rib" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="1.4" height="3" fill="#000" opacity=".10"/></pattern>',
      '</defs>']
    if fill != "none":
        parts.append('<ellipse cx="200" cy="364" rx="118" ry="7" fill="#2b2622" opacity=".16" filter="url(#s)"/>')
    for p in shapes:
        parts.append(f'<path d="{p}" fill="{fill if fill!="none" else "#ffffff"}"/>')
    if d.get("inner"):
        base = fill if fill != "none" else "#ffffff"
        parts.append(f'<path d="{d["inner"]}" fill="{base}"/><path d="{d["inner"]}" fill="#000" opacity="{".45" if dark else ".22"}"/>')
    g_ = ['<g clip-path="url(#c)">', '<rect width="400" height="400" fill="url(#v)"/>', '<rect width="400" height="400" fill="url(#h)"/>']
    for t in d.get("trims", []):
        g_.append(f'<path d="{t}" fill="#000" opacity=".07"/>')
        if d.get("ribs"): g_.append(f'<path d="{t}" fill="url(#rib)"/>')
    for f in d.get("folds", []):
        g_.append(f'<path d="{f}" fill="none" stroke="{fold_col}" stroke-opacity="{".28" if dark else ".13"}" stroke-width="7" stroke-linecap="round" filter="url(#b)"/>')
        g_.append(f'<path d="{f}" fill="none" stroke="#fff" stroke-opacity="{".05" if dark else ".35"}" stroke-width="3" stroke-linecap="round" transform="translate(5 0)" filter="url(#b)"/>')
    g_.append('</g>')
    parts += g_
    seam = "#fff" if dark else "#000"
    so = ".12" if dark else ".12"
    parts.append(f'<g fill="none" stroke="{seam}" stroke-opacity="{so}" stroke-width="1" stroke-dasharray="3 2.5">' + "".join(f'<path d="{p}"/>' for p in d.get("seams", [])) + "</g>")
    parts.append(f'<g fill="none" stroke="#000" stroke-opacity="{".35" if dark else ".14"}" stroke-width="1.1" stroke-linejoin="round">' + "".join(f'<path d="{p}"/>' for p in shapes) + "</g>")
    for p in d.get("extra_stroke", []):
        parts.append(f'<path d="{p}" fill="none" stroke="{fill if fill!="none" else "#ffffff"}" stroke-width="12" stroke-linecap="round"/><path d="{p}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="12" stroke-linecap="round"/>')
    if d.get("strings"):
        sc = "#f2f2f2" if dark else "#ffffff"
        parts.append(f'<path d="M186 84 C186 98 185 108 186 118" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M214 84 C214 98 215 108 214 118" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round"/>' if g!="jogger" else
                     f'<path d="M190 52 C188 80 182 96 184 112" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M210 52 C212 80 218 96 216 112" stroke="{sc}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    parts.append("</svg>")
    return "".join(parts)

for g in GARMENTS:
    open(f"{OUT}/{g}.svg", "w").write(svg(g, "#ffffff"))
    for k, hexv in COLORS.items():
        open(f"{OUT}/{g}-{k}.svg", "w").write(svg(g, hexv))
json.dump({"garments": list(GARMENTS), "colors": COLORS}, open(f"{OUT}/index.json", "w"), ensure_ascii=False, indent=1)
print("ok", len(os.listdir(OUT)))
