"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveDesignAssetAction, uploadImageAction } from "@/lib/actions";

/** Gói hình tạo sẵn từ repo GitHub (apps/cms/public/packs/*.json): [đường dẫn svg, tên, nhóm, từ khoá] */
type Pack = {
  id: string;
  title: string;
  license: string;
  licenseUrl: string;
  repo: string;
  commit: string;
  note: string;
  render: { kind: "color" | "mono"; color?: string };
  items: [string, string, string, string][];
};
const PACKS = ["fluent-emoji", "tabler-icons"];

/** Dấu vết nguồn lưu trong trường giấy phép – dùng để bỏ qua hình đã nạp */
const licenseOf = (p: Pack, path: string) => `${p.license} · github.com/${p.repo}@${p.commit.slice(0, 7)} · ${path}`.slice(0, 300);
const encPath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

async function fetchSvg(p: Pack, path: string): Promise<string> {
  const urls = [`https://cdn.jsdelivr.net/gh/${p.repo}@${p.commit}/${encPath(path)}`, `https://raw.githubusercontent.com/${p.repo}/${p.commit}/${encPath(path)}`];
  let err: unknown;
  for (const u of urls) {
    try {
      const r = await fetch(u);
      if (r.ok) return await r.text();
      err = new Error(`HTTP ${r.status}`);
    } catch (e) {
      err = e;
    }
  }
  throw err instanceof Error ? err : new Error("Không tải được hình");
}

/** SVG -> ảnh WebP nền trong suốt, cạnh dài = size px (vẽ lại vector nên nét ở mọi cỡ) */
async function rasterize(svgText: string, size: number, color?: string): Promise<{ blob: Blob; w: number; h: number }> {
  const doc = new DOMParser().parseFromString(color ? svgText.replace(/currentColor/g, color) : svgText, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== "svg") throw new Error("SVG lỗi");
  const vb = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  const vw = vb.length === 4 && vb[2]! > 0 ? vb[2]! : Number(svg.getAttribute("width")) || 32;
  const vh = vb.length === 4 && vb[3]! > 0 ? vb[3]! : Number(svg.getAttribute("height")) || 32;
  const k = size / Math.max(vw, vh);
  const w = Math.round(vw * k);
  const h = Math.round(vh * k);
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Không vẽ được SVG"));
      i.src = url;
    });
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Không xuất được ảnh"))), "image/webp", 0.92));
    return { blob, w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Nạp hình nguồn mở (giấy phép MIT) vào Thư viện thiết kế: tải SVG gốc từ GitHub (qua CDN jsDelivr),
 * vẽ ra WebP độ phân giải cao ngay trên trình duyệt admin, tải lên kho ảnh, tạo mục thư viện kèm nguồn + giấy phép.
 * Chạy lại an toàn: hình đã nạp (cùng dấu vết nguồn) được bỏ qua. Có thể tạm dừng.
 */
export function PackImporter({ done: initialDone }: { done: string[] }) {
  const router = useRouter();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [pid, setPid] = useState(PACKS[0]!);
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [size, setSize] = useState(1600);
  const [approve, setApprove] = useState(true);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [prog, setProg] = useState({ done: 0, total: 0, fail: 0 });
  const stop = useRef(false);
  const doneSet = useRef(new Set(initialDone));

  useEffect(() => {
    Promise.all(PACKS.map((id) => fetch(`/packs/${id}.json`).then((r) => (r.ok ? (r.json() as Promise<Pack>) : null)))).then((l) => setPacks(l.filter((x): x is Pack => !!x)));
  }, []);

  const pack = packs.find((p) => p.id === pid);
  const groups = useMemo(() => {
    const m = new Map<string, { total: number; imported: number }>();
    for (const [path, , cat] of pack?.items ?? []) {
      const g = m.get(cat) ?? { total: 0, imported: 0 };
      g.total++;
      if (pack && doneSet.current.has(licenseOf(pack, path))) g.imported++;
      m.set(cat, g);
    }
    return [...m].sort((a, b) => b[1].total - a[1].total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack, prog.done]);

  useEffect(() => setCats(new Set()), [pid]);

  async function run() {
    if (!pack) return;
    const queue = pack.items.filter(([path, , cat]) => cats.has(cat) && !doneSet.current.has(licenseOf(pack, path)));
    if (!queue.length) return setLog((l) => ["Không còn hình nào cần nạp trong các nhóm đã chọn.", ...l]);
    stop.current = false;
    setRunning(true);
    setProg({ done: 0, total: queue.length, fail: 0 });
    let ok = 0;
    let fail = 0;
    // vẽ trước 3 hình song song, tải lên lần lượt
    const rendered = new Map<number, Promise<{ blob: Blob; w: number; h: number }>>();
    const render = (i: number) => {
      if (i >= queue.length || rendered.has(i)) return;
      rendered.set(i, fetchSvg(pack, queue[i]![0]).then((t) => rasterize(t, size, pack.render.kind === "mono" ? (pack.render.color ?? "#1d1d1f") : undefined)));
    };
    for (let i = 0; i < queue.length; i++) {
      if (stop.current) break;
      for (let j = i; j < i + 3; j++) render(j);
      const [path, name, cat, tags] = queue[i]!;
      try {
        const img = await rendered.get(i)!;
        rendered.delete(i);
        const fd = new FormData();
        fd.append("file", new File([img.blob], `${name.replace(/[^\w-]+/g, "-").slice(0, 60) || "hinh"}.webp`, { type: "image/webp" }));
        const up = await uploadImageAction(fd);
        if (!up.ok) throw new Error(up.error);
        const lic = licenseOf(pack, path);
        const r = await saveDesignAssetAction(null, {
          kind: "CLIPART",
          name: name.slice(0, 80),
          category: cat.slice(0, 40),
          tags: tags.slice(0, 200),
          imageUrl: up.url,
          natW: img.w,
          natH: img.h,
          data: null,
          isActive: true,
          sortOrder: 0,
          source: "OPEN",
          license: lic,
          status: approve ? "APPROVED" : "DRAFT",
        });
        if (!r.ok) throw new Error(r.error);
        doneSet.current.add(lic);
        ok++;
      } catch (e) {
        fail++;
        setLog((l) => [`✗ ${name}: ${(e as Error).message}`, ...l].slice(0, 200));
      }
      setProg({ done: ok + fail, total: queue.length, fail });
    }
    setRunning(false);
    setLog((l) => [`${stop.current ? "Đã tạm dừng" : "Xong"}: nạp ${ok} hình${fail ? `, lỗi ${fail}` : ""}.`, ...l]);
    router.refresh();
  }

  const selectedCount = groups.filter(([c]) => cats.has(c)).reduce((s, [, g]) => s + g.total - g.imported, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/design-library" className="underline">
          ← Thư viện thiết kế
        </Link>
      </p>
      <div className="flex flex-wrap gap-2">
        {packs.map((p) => (
          <button key={p.id} type="button" disabled={running} onClick={() => setPid(p.id)} className={p.id === pid ? "btn-primary" : "btn-ghost"}>
            {p.title} ({p.items.length})
          </button>
        ))}
      </div>
      {!pack ? (
        <p className="text-sm text-neutral-500">Đang tải danh sách…</p>
      ) : (
        <>
          <section className="card space-y-1 text-sm">
            <p>{pack.note}</p>
            <p className="text-neutral-600">
              Giấy phép:{" "}
              <a href={pack.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {pack.license}
              </a>{" "}
              · Nguồn:{" "}
              <a href={`https://github.com/${pack.repo}/tree/${pack.commit}`} target="_blank" rel="noopener noreferrer" className="underline">
                github.com/{pack.repo}
              </a>{" "}
              (bản {pack.commit.slice(0, 7)}). Mỗi hình lưu kèm nguồn + giấy phép trong thư viện.
            </p>
          </section>

          <section className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Chọn nhóm cần nạp</h2>
              <div className="flex gap-2 text-sm">
                <button type="button" className="underline" disabled={running} onClick={() => setCats(new Set(groups.map(([c]) => c)))}>
                  Chọn tất cả
                </button>
                <button type="button" className="underline" disabled={running} onClick={() => setCats(new Set())}>
                  Bỏ chọn
                </button>
              </div>
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(([c, g]) => (
                <li key={c}>
                  <label className={`flex items-center gap-2 rounded border px-2 py-1.5 text-sm ${g.imported === g.total ? "opacity-60" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={running || g.imported === g.total}
                      checked={cats.has(c)}
                      onChange={(e) =>
                        setCats((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(c);
                          else n.delete(c);
                          return n;
                        })
                      }
                    />
                    <span className="flex-1">{c}</span>
                    <span className="text-xs text-neutral-500">
                      {g.imported ? `${g.imported}/` : ""}
                      {g.total}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                Cỡ ảnh
                <select className="input h-9 w-auto px-2" value={size} disabled={running} onChange={(e) => setSize(Number(e.target.value))}>
                  <option value={1200}>1200px (nhẹ)</option>
                  <option value={1600}>1600px (khuyên dùng)</option>
                  <option value={2400}>2400px (in khổ lớn)</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={approve} disabled={running} onChange={(e) => setApprove(e.target.checked)} /> Duyệt luôn (hiện cho khách)
              </label>
              {running ? (
                <button type="button" className="btn-ghost" onClick={() => (stop.current = true)}>
                  Tạm dừng
                </button>
              ) : (
                <button type="button" className="btn-primary" disabled={!selectedCount} onClick={() => void run()}>
                  Nạp {selectedCount} hình
                </button>
              )}
            </div>
            {prog.total > 0 && (
              <div>
                <div className="h-2 overflow-hidden rounded bg-neutral-200">
                  <div className="h-full bg-brand transition-all" style={{ width: `${(prog.done / prog.total) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-neutral-600">
                  {prog.done}/{prog.total}
                  {prog.fail ? ` · lỗi ${prog.fail}` : ""} · giữ trang này mở đến khi xong (tạm dừng rồi nạp lại sẽ bỏ qua hình đã có)
                </p>
              </div>
            )}
          </section>
          {log.length > 0 && (
            <ul className="card max-h-60 space-y-0.5 overflow-y-auto text-xs">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
