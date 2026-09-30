"use client";

const KEYS: [string, string][] = [
  ["Ctrl + Z", "Hoàn tác"],
  ["Ctrl + Y / Ctrl + Shift + Z", "Làm lại"],
  ["Ctrl + C / Ctrl + V", "Sao chép / dán lớp (dán được sang mặt khác)"],
  ["Ctrl + D", "Nhân đôi lớp"],
  ["Delete / Backspace", "Xoá lớp"],
  ["Mũi tên", "Dịch 1 mm (giữ Shift: 10 mm)"],
  ["+ / −", "Phóng to / thu nhỏ lớp"],
  ["Lăn chuột trên khung", "Phóng to / thu nhỏ lớp đang chọn"],
  ["] / [", "Đưa lớp lên / xuống"],
  ["Shift khi xoay", "Xoay theo bước 15°"],
  ["Ctrl + S", "Lưu vào tài khoản"],
  ["Esc", "Bỏ chọn"],
  ["?", "Mở bảng phím tắt"],
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="keys-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="keys-title" className="text-lg font-black">
          Phím tắt
        </h2>
        <dl className="mt-3 divide-y divide-ink/10 text-sm">
          {KEYS.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-1.5">
              <dt>{v}</dt>
              <dd className="shrink-0 rounded border border-ink/20 bg-cream px-1.5 py-0.5 font-mono text-[11px] font-bold">{k}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="btn mt-4 w-full border-ink bg-brand" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
