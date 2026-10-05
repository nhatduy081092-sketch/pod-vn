"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVND, groupToRoster, linePrice, type GroupView } from "@pod/shared";
import { assetUrl } from "@/lib/config";
import { groupAdminKey, myGroupRows, rememberGroupRow, setGroupAdminKey, stashGroupRoster } from "@/lib/group";
import { attachDesign } from "@/components/editor/storage";

type Form = { person: string; printName: string; number: string; size: string; qty: number; note: string };

/**
 * Trang gom đơn nhóm (/nhom/<mã>):
 * - thành viên: xem mẫu áo, ghi tên + size + số lượng (tên/số in nếu thiết kế có ô tên/số), xoá dòng của mình
 * - trưởng nhóm (có khoá quản lý): chia sẻ link, đặt hạn chót, chốt danh sách, xoá dòng, đặt 1 đơn cho cả nhóm
 */
export function GroupOrderView({ code }: { code: string }) {
  const router = useRouter();
  const [g, setG] = useState<GroupView | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [mine, setMine] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Form>({ person: "", printName: "", number: "", size: "", qty: 1, note: "" });
  const [printTouched, setPrintTouched] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [copied, setCopied] = useState("");
  const [slide, setSlide] = useState(0);

  // khoá quản lý: từ link quản lý (?k=) -> lưu trên máy rồi xoá khỏi thanh địa chỉ (tránh lỡ gửi nhầm)
  useEffect(() => {
    const url = new URL(window.location.href);
    const k = url.searchParams.get("k");
    if (k) {
      setGroupAdminKey(code, k);
      url.searchParams.delete("k");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    setAdminKey(k || groupAdminKey(code));
    setMine(myGroupRows(code));
  }, [code]);

  const load = useCallback(async () => {
    try {
      const key = groupAdminKey(code);
      const res = await fetch(`/api/groups/${encodeURIComponent(code)}`, { headers: key ? { "x-group-key": key } : {}, cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as GroupView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không tải được nhóm");
      setG(data);
      setForm((f) => (f.size ? f : { ...f, size: data.product.sizes[0]?.size ?? "" }));
      setLoadErr("");
    } catch (e) {
      setLoadErr((e as Error).message);
    }
  }, [code]);

  useEffect(() => {
    void load();
    // danh sách cập nhật khi thành viên khác ghi danh
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 20_000);
    return () => clearInterval(t);
  }, [load, adminKey]);

  const total = g?.members.reduce((s, m) => s + m.qty, 0) ?? 0;
  const price = useMemo(() => {
    if (!g) return null;
    const src = { basePrice: g.product.basePrice, salePrice: g.product.salePrice, saleEndsAt: g.product.saleEndsAt, priceTiers: g.product.priceTiers };
    const unit = (qty: number) => linePrice({ product: src, totalQty: Math.max(1, qty), areaExtras: g.product.areaExtras });
    const delta = Object.fromEntries(g.product.sizes.map((s) => [s.size, s.priceDelta]));
    const now = unit(total);
    const sum = g.members.reduce((s, m) => s + m.qty * (now + (delta[m.size] ?? 0)), 0);
    const next = [...g.product.priceTiers].sort((a, b) => a.minQty - b.minQty).find((t) => t.minQty > total && unit(t.minQty) < now);
    return { now, single: unit(1), sum, next: next ? { need: next.minQty - total, unit: unit(next.minQty) } : null };
  }, [g, total]);
  const bySize = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of g?.members ?? []) m.set(x.size, (m.get(x.size) ?? 0) + x.qty);
    return (g?.product.sizes ?? []).filter((s) => m.has(s.size)).map((s) => ({ size: s.size, qty: m.get(s.size)! }));
  }, [g]);

  if (loadErr && !g)
    return (
      <div className="mx-auto max-w-md rounded-2xl border-2 border-ink/10 bg-white p-6 text-center">
        <p className="font-display text-xl font-extrabold">Không mở được nhóm</p>
        <p className="mt-1 text-sm text-ink/70">{loadErr}</p>
        <Link href="/thiet-ke" className="btn-primary mt-4 inline-flex px-5 py-2.5 text-sm">
          Tự thiết kế áo nhóm
        </Link>
      </div>
    );
  if (!g) return <p className="py-20 text-center text-sm text-ink/60">Đang tải nhóm…</p>;

  const hasName = g.fields.includes("name");
  const hasNumber = g.fields.includes("number");
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/nhom/${code}` : `/nhom/${code}`;
  const manageUrl = `${shareUrl}?k=${adminKey}`;
  const daysLeft = g.deadline ? Math.ceil((new Date(`${g.deadline}T23:59:59+07:00`).getTime() - Date.now()) / 864e5) : null;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!g) return;
    setErr("");
    setDone("");
    setBusy(true);
    try {
      const body = { ...form, printName: hasName ? (form.printName || form.person).slice(0, 30) : "", number: hasNumber ? form.number : "" };
      const res = await fetch(`/api/groups/${encodeURIComponent(code)}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminKey ? { "x-group-key": adminKey } : {}) },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; editKey?: string; error?: string };
      if (!res.ok || !data.id || !data.editKey) throw new Error(data.error ?? "Không ghi danh được");
      rememberGroupRow(code, data.id, data.editKey);
      setMine(myGroupRows(code));
      setDone(`✓ Đã ghi danh ${form.person} – size ${form.size} × ${form.qty}`);
      setForm((f) => ({ ...f, person: "", printName: "", number: "", qty: 1, note: "" }));
      setPrintTouched(false);
      await load();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xoá dòng này khỏi danh sách nhóm?")) return;
    const key = mine[id];
    const res = await fetch(`/api/groups/${encodeURIComponent(code)}/members/${id}`, {
      method: "DELETE",
      headers: { ...(adminKey ? { "x-group-key": adminKey } : {}), ...(key ? { "x-member-key": key } : {}) },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return setErr(data.error ?? "Không xoá được");
    rememberGroupRow(code, id, null);
    setMine(myGroupRows(code));
    await load();
  }

  async function patch(p: { closed?: boolean; deadline?: string; title?: string }) {
    const res = await fetch(`/api/groups/${encodeURIComponent(code)}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-group-key": adminKey }, body: JSON.stringify(p) });
    const data = (await res.json().catch(() => ({}))) as GroupView & { error?: string };
    if (!res.ok) return setErr(data.error ?? "Không lưu được");
    setG(data);
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }
  async function share() {
    const text = `${g!.title || "Đặt áo nhóm"}: mở link, ghi tên và chọn size giúp mình nhé 👕`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) await nav.share({ title: g!.title || "Đặt áo nhóm", text, url: shareUrl }).catch(() => undefined);
    else await copy(`${text}\n${shareUrl}`, "share");
  }

  /** Trưởng nhóm: mang thiết kế + danh sách sang trang sản phẩm -> thêm giỏ như đơn đồng phục */
  function orderAll() {
    if (!g?.design) return setErr("Mở bằng link quản lý của trưởng nhóm để đặt đơn");
    if (!g.members.length) return setErr("Chưa có ai ghi danh");
    attachDesign(g.product.id, g.design, g.color || undefined);
    stashGroupRoster(g.product.id, groupToRoster(g.members.map((m) => ({ ...m, note: m.note ?? "" })), g.fields), code);
    router.push(`/san-pham/${g.product.slug}?nhom=${code}`);
  }

  return (
    <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
      {/* Mẫu áo */}
      <section className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">Đặt áo nhóm · YALA</p>
        <h1 className="mt-1 font-display text-[clamp(26px,3.4vw,40px)] font-extrabold leading-[1.05] tracking-[-0.02em] [font-stretch:88%]">{g.title || "Áo nhóm của chúng mình"}</h1>
        <p className="mt-1 text-sm text-ink/70">
          {g.product.name}
          {g.color ? ` · màu ${g.color}` : ""}
        </p>
        <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface">
          {g.previews[slide] && <img src={assetUrl(g.previews[slide]!.url)} alt={`Mẫu áo – ${g.previews[slide]!.name}`} className="mx-auto aspect-square w-full max-w-[560px] object-contain" />}
          {g.previews.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {g.previews.map((p, i) => (
                <button key={p.area} type="button" onClick={() => setSlide(i)} className={`rounded-full border-2 px-3 py-0.5 text-xs font-bold ${i === slide ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"}`}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {price && (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span>
              Giá hiện tại: <b className="text-lg">{formatVND(price.now)}</b>/cái
            </span>
            {price.now < price.single && <span className="text-ink/55 line-through">{formatVND(price.single)}</span>}
            {price.next && (
              <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-dark">
                Thêm {price.next.need} cái nữa → {formatVND(price.next.unit)}/cái
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-ink/60">
          Giá đã gồm in theo mẫu. Phí giao hàng tính khi trưởng nhóm đặt đơn.{" "}
          <Link href={`/san-pham/${g.product.slug}`} className="font-bold underline" target="_blank">
            Xem bảng size & chất liệu
          </Link>
        </p>
      </section>

      {/* Ghi danh + danh sách */}
      <section className="space-y-4">
        {g.closed ? (
          <div className="rounded-2xl border-2 border-ink bg-sun/60 p-4">
            <p className="font-display text-lg font-extrabold">Nhóm đã chốt danh sách</p>
            <p className="text-sm text-ink/75">Cần thêm/sửa? Nhắn trưởng nhóm mở lại.</p>
          </div>
        ) : (
          <form onSubmit={join} className="space-y-3 rounded-2xl border-2 border-ink bg-white p-4 shadow-sticker-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-lg font-extrabold">Ghi danh của bạn</p>
              {daysLeft !== null && <span className="text-xs font-bold text-brand-dark">{daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Hạn chót hôm nay"}</span>}
            </div>
            <label className="block">
              <span className="label">Tên của bạn *</span>
              <input
                className="input"
                value={form.person}
                maxLength={40}
                required
                onChange={(e) => setForm((f) => ({ ...f, person: e.target.value, printName: printTouched ? f.printName : e.target.value.toUpperCase().slice(0, 30) }))}
                placeholder="VD: Minh Anh"
                autoComplete="name"
              />
            </label>
            {(hasName || hasNumber) && (
              <div className="grid grid-cols-[1fr_88px] gap-2">
                {hasName && (
                  <label className="block">
                    <span className="label">Tên in trên áo</span>
                    <input
                      className="input"
                      value={form.printName}
                      maxLength={30}
                      onChange={(e) => {
                        setPrintTouched(true);
                        setForm((f) => ({ ...f, printName: e.target.value }));
                      }}
                      placeholder="MINH ANH"
                    />
                  </label>
                )}
                {hasNumber && (
                  <label className="block">
                    <span className="label">Số áo</span>
                    <input className="input" inputMode="numeric" value={form.number} maxLength={3} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value.replace(/\D/g, "") }))} placeholder="10" />
                  </label>
                )}
              </div>
            )}
            <div>
              <span className="label">Size *</span>
              <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Size">
                {g.product.sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    role="radio"
                    aria-checked={form.size === s.size}
                    onClick={() => setForm((f) => ({ ...f, size: s.size }))}
                    className={`min-w-[48px] rounded-lg border-2 px-2.5 py-1.5 text-sm font-bold ${form.size === s.size ? "border-ink bg-brand text-white" : "border-ink/15 bg-white hover:border-ink"}`}
                  >
                    {s.size}
                    {s.priceDelta > 0 && <span className="block text-[10px] font-semibold opacity-80">+{formatVND(s.priceDelta)}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <span className="label">Số lượng</span>
                <div className="mt-1 flex items-center">
                  <button type="button" className="h-10 w-10 rounded-l-lg border-2 border-ink/15 font-bold" onClick={() => setForm((f) => ({ ...f, qty: Math.max(1, f.qty - 1) }))} aria-label="Bớt">
                    −
                  </button>
                  <span className="flex h-10 w-12 items-center justify-center border-y-2 border-ink/15 font-bold">{form.qty}</span>
                  <button type="button" className="h-10 w-10 rounded-r-lg border-2 border-ink/15 font-bold" onClick={() => setForm((f) => ({ ...f, qty: Math.min(50, f.qty + 1) }))} aria-label="Thêm">
                    +
                  </button>
                </div>
              </div>
              <label className="block flex-1">
                <span className="label">Ghi chú</span>
                <input className="input" value={form.note} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="VD: lấy giúp em gái" />
              </label>
            </div>
            {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            {done && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{done}</p>}
            <button className="btn-primary w-full py-3 text-[15px] disabled:opacity-60" disabled={busy || !form.person.trim() || !form.size}>
              {busy ? "Đang ghi danh…" : "Ghi danh"}
            </button>
            <p className="text-[11px] text-ink/55">Tên của bạn hiện trong danh sách nhóm để mọi người cùng kiểm tra. Không cần số điện thoại.</p>
          </form>
        )}

        <div className="rounded-2xl border-2 border-ink/10 bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-lg font-extrabold">Danh sách nhóm</p>
            <p className="text-sm">
              <b>{total}</b> cái · {g.members.length} người
            </p>
          </div>
          {bySize.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bySize.map((s) => (
                <span key={s.size} className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold">
                  {s.size}: {s.qty}
                </span>
              ))}
            </div>
          )}
          {g.members.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">Chưa có ai ghi danh – bạn là người đầu tiên!</p>
          ) : (
            <ol className="mt-3 max-h-[46vh] divide-y divide-ink/10 overflow-y-auto">
              {g.members.map((m, i) => (
                <li key={m.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="w-6 shrink-0 text-xs text-ink/45">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{m.person}</span>
                    {(m.printName && m.printName !== m.person) || m.number ? (
                      <span className="block truncate text-xs text-ink/60">
                        In: {[m.printName, m.number && `#${m.number}`].filter(Boolean).join(" ")}
                      </span>
                    ) : null}
                    {g.isAdmin && m.note && <span className="block truncate text-xs text-ink/60">Ghi chú: {m.note}</span>}
                  </span>
                  <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-xs font-bold">
                    {m.size} × {m.qty}
                  </span>
                  {(g.isAdmin || mine[m.id]) && !(g.closed && !g.isAdmin) && (
                    <button type="button" onClick={() => void remove(m.id)} className="shrink-0 rounded p-1 text-xs font-bold text-red-600 hover:bg-red-50" aria-label={`Xoá dòng của ${m.person}`}>
                      Xoá
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
          {price && total > 0 && (
            <p className="mt-3 flex items-baseline justify-between border-t border-ink/10 pt-3 text-sm">
              <span>Tạm tính cả nhóm</span>
              <b className="text-lg">{formatVND(price.sum)}</b>
            </p>
          )}
        </div>

        {g.isAdmin ? (
          <div className="space-y-3 rounded-2xl border-2 border-ink bg-surface p-4">
            <p className="font-display text-lg font-extrabold">Bạn là trưởng nhóm</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-primary py-2.5 text-sm" onClick={() => void share()}>
                {copied === "share" ? "Đã chép ✓" : "Gửi link cho nhóm"}
              </button>
              <button type="button" className="btn-outline py-2.5 text-sm" onClick={() => void copy(shareUrl, "link")}>
                {copied === "link" ? "Đã chép ✓" : "Chép link"}
              </button>
            </div>
            <label className="block">
              <span className="label">Tên nhóm</span>
              <input className="input" defaultValue={g.title} maxLength={80} placeholder="VD: Áo lớp 12A1 – kỷ yếu" onBlur={(e) => e.target.value !== g.title && void patch({ title: e.target.value })} />
            </label>
            <div className="flex items-end gap-2">
              <label className="block flex-1">
                <span className="label">Hạn chót ghi danh</span>
                <input className="input" type="date" defaultValue={g.deadline} onChange={(e) => void patch({ deadline: e.target.value })} />
              </label>
              <button type="button" className="btn-outline px-3 py-2.5 text-sm" onClick={() => void patch({ closed: !g.closed })}>
                {g.closed ? "Mở lại" : "Chốt danh sách"}
              </button>
            </div>
            <button type="button" className="btn w-full border-ink bg-ink py-3 text-[15px] text-white disabled:opacity-50" disabled={!g.members.length} onClick={orderAll}>
              Đặt đơn cho cả nhóm ({total} cái)
            </button>
            <p className="text-[11px] text-ink/60">
              Danh sách (tên, số, size) đi thẳng vào đơn đồng phục, bạn kiểm tra lại trước khi thanh toán. Giữ riêng{" "}
              <button type="button" className="font-bold underline" onClick={() => void copy(manageUrl, "manage")}>
                {copied === "manage" ? "đã chép link quản lý ✓" : "link quản lý"}
              </button>{" "}
              để mở trên máy khác.
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-ink/55">
            Muốn làm áo nhóm khác?{" "}
            <Link href="/thiet-ke" className="font-bold underline">
              Tự thiết kế trên YALA Studio
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
