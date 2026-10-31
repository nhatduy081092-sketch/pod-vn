import { BASIC_COLORS, GARMENT_ZONE, type ColorKey, type LineupPerson } from "@pod/shared";

/**
 * Minh hoạ áo nhóm: 3 áo cùng thiết kế, mỗi áo in tên/số riêng (ảnh phôi thật + chữ chồng lên vùng ngực).
 * data-ui: chữ ở đây là hình in trên áo, không phải nhãn giao diện (bộ kiểm tra thiết kế bỏ qua).
 * Đúng tính năng thật của YALA (ô tên/số trong Studio) – không phải ảnh khách hàng.
 */
export function TeamLineup({ team, color, people, className = "" }: { team: string; color: ColorKey; people: LineupPerson[]; className?: string }) {
  const z = GARMENT_ZONE.tshirt;
  const list = people.slice(0, 3);
  // áo giữa đứng trước, to hơn
  const pos = [
    { left: "-4%", top: "12%", w: "50%", z: 1, r: -4 },
    { left: "23%", top: "2%", w: "54%", z: 3, r: 0 },
    { left: "54%", top: "12%", w: "50%", z: 2, r: 4 },
  ];
  return (
    <div data-ui className={`relative aspect-[16/10] w-full ${className}`} role="img" aria-label={`Minh hoạ áo nhóm ${team} in tên riêng từng người`}>
      {list.map((p, i) => {
        const c = p.color ?? color;
        const dark = BASIC_COLORS[c].dark;
        const at = pos[list.length === 1 ? 1 : i]!;
        return (
          <div
            key={p.name}
            className="absolute aspect-square drop-shadow-[0_10px_18px_rgba(0,0,0,.18)]"
            style={{ left: at.left, top: at.top, width: at.w, zIndex: at.z, transform: `rotate(${at.r}deg)` }}
          >
            <img src={`/blanks/tshirt-${c}.webp`} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
            <div
              className={`absolute flex flex-col items-center justify-start text-center font-display font-extrabold uppercase leading-none [container-type:inline-size] ${dark ? "text-white" : "text-ink"}`}
              style={{ left: `${z.x * 100}%`, top: `${(z.y + 0.03) * 100}%`, width: `${z.w * 100}%`, height: `${z.h * 100}%` }}
            >
              <span className="block max-w-full truncate text-[length:11cqw] tracking-[0.06em] opacity-80">{team}</span>
              {p.number && <span className="mt-[4cqw] block text-[length:52cqw] tracking-[-0.04em] [font-stretch:80%]">{p.number}</span>}
              <span className={`block max-w-full truncate tracking-[0.04em] ${p.number ? "mt-[2cqw] text-[length:15cqw]" : `mt-[16cqw] [font-stretch:85%] ${p.name.length > 6 ? "text-[length:14cqw]" : "text-[length:19cqw]"}`}`}>{p.name}</span>
            </div>
          </div>
        );
      })}
      <span className="absolute bottom-1 right-1 rounded bg-white/85 px-1.5 py-0.5 text-[13px] font-semibold text-ink/70">Minh hoạ</span>
    </div>
  );
}
