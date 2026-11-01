import { BASIC_COLORS, type ColorKey, type LineupPerson } from "@pod/shared";
import { GarmentMockup, PrintText } from "../designs/GarmentMockup";

/**
 * Minh hoạ áo nhóm: 3 áo cùng thiết kế, mỗi áo in tên/số riêng (ảnh phôi thật + hình in uốn theo nếp vải, xem GarmentMockup).
 * data-ui: chữ ở đây là hình in trên áo, không phải nhãn giao diện (bộ kiểm tra thiết kế bỏ qua).
 * Đúng tính năng thật của YALA (ô tên/số trong Studio) – không phải ảnh khách hàng.
 */
export function TeamLineup({ team, color, people, className = "" }: { team: string; color: ColorKey; people: LineupPerson[]; className?: string }) {
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
        const ink = BASIC_COLORS[c].dark ? "#f4f2ee" : "#1f1f22";
        const at = pos[list.length === 1 ? 1 : i]!;
        return (
          <div
            key={p.name}
            className="absolute aspect-square drop-shadow-[0_10px_18px_rgba(0,0,0,.18)]"
            style={{ left: at.left, top: at.top, width: at.w, zIndex: at.z, transform: `rotate(${at.r}deg)` }}
          >
            <GarmentMockup id={`tl-${i}-${c}`} garment="tshirt" color={c} className="absolute inset-0 h-full w-full">
              <PrintText x={150} y={44} size={30} fill={ink} spacing={3}>
                <tspan opacity={0.8}>{team.toUpperCase()}</tspan>
              </PrintText>
              {p.number ? (
                <>
                  <PrintText x={150} y={236} size={200} fill={ink} spacing={-8} stretch={80}>
                    {p.number}
                  </PrintText>
                  <PrintText x={150} y={292} size={44} fill={ink} spacing={2}>
                    {p.name.toUpperCase()}
                  </PrintText>
                </>
              ) : (
                <PrintText x={150} y={170} size={p.name.length > 6 ? 44 : 64} fill={ink} spacing={2} stretch={85}>
                  {p.name.toUpperCase()}
                </PrintText>
              )}
            </GarmentMockup>
          </div>
        );
      })}
      <span className="absolute bottom-1 right-1 rounded bg-white/85 px-1.5 py-0.5 text-[13px] font-semibold text-ink/70">Minh hoạ</span>
    </div>
  );
}
