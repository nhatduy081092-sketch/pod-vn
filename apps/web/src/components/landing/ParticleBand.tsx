"use client";
import { useEffect, useRef } from "react";

/*
 * Dải mở đầu khối đen "Cách đặt": hạt trắng đá + cam bay rải rác, khi cuộn tới thì bung ra rồi gom thành chữ YALA
 * (chuyển từ mẫu particleAnimation: nổ ra -> gom về hình, hạt dày tự sáng nhờ hoà màu "lighter").
 * Không nút bấm; con trỏ đi qua chỉ đẩy hạt nhẹ rồi hạt tự về chỗ. Canvas 2D, không thư viện.
 * Chỉ chạy khi dải nằm trong màn hình; giảm chuyển động -> vẽ sẵn chữ đã gom, không chạy vòng lặp.
 */

const WORD = "YALA";
const CHALK = "232,230,227"; // #e8e6e3 – chữ trên nền đen của trang
const ORANGE = "228,87,11"; // #E4570B
const ORANGE_SHARE = 0.2;

// thời gian (giây): bung ra, rồi gom về chữ; mỗi hạt trễ ngẫu nhiên để chữ "đọng" dần
const SCATTER = 0.6;
const FORM = 1.5;
const MAX_DELAY = 0.45;

const REPEL_RADIUS = 70; // px CSS
const REPEL_FORCE = 3;
const SPRING = 0.05;
const DAMPING = 0.84;

/** tâm chữ theo chiều cao dải */
const CY = 0.5;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Vẽ chữ lên canvas ẩn đúng cỡ dải rồi rải `n` hạt lên các điểm ảnh đã tô (toạ độ px thiết bị) */
function wordTargets(n: number, w: number, h: number, family: string) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  let size = h * 0.62;
  g.font = `800 ${size}px ${family}`;
  const tw = g.measureText(WORD).width;
  if (tw > w * 0.86) size *= (w * 0.86) / tw;
  g.font = `800 ${size}px ${family}`;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(WORD, w / 2, h * CY);

  const data = g.getImageData(0, 0, w, h).data;
  const filled: number[] = [];
  const stride = Math.max(1, Math.round(size / 160)); // chữ to -> lấy mẫu thưa, đỡ tốn bộ nhớ
  for (let y = 0; y < h; y += stride) for (let x = 0; x < w; x += stride) if (data[(y * w + x) * 4 + 3]! > 128) filled.push(x, y);

  const out = new Float32Array(n * 2);
  const m = filled.length / 2;
  for (let i = 0; i < n; i++) {
    const j = m ? Math.floor(Math.random() * m) * 2 : 0;
    out[i * 2] = m ? filled[j]! + Math.random() * stride : Math.random() * w;
    out[i * 2 + 1] = m ? filled[j + 1]! + Math.random() * stride : Math.random() * h;
  }
  return out;
}

export function ParticleBand({ line }: { line: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = getComputedStyle(canvas).fontFamily || "sans-serif";

    let dpr = 1;
    let w = 0;
    let h = 0;
    let n = 0;
    let pos = new Float32Array(0); // vị trí hiện tại
    let start = new Float32Array(0);
    let mid = new Float32Array(0);
    let end = new Float32Array(0); // chữ YALA
    let cloud = new Float32Array(0); // chỗ đứng trong đám mây hạt lúc chờ
    let wobble = new Float32Array(0); // pha + tần số gợn của từng hạt lúc chờ
    let alpha = new Float32Array(0);
    let delay = new Float32Array(0);
    let offset = new Float32Array(0); // lệch do con trỏ đẩy
    let vel = new Float32Array(0);
    let orange = 0; // n hạt đầu màu trắng đá, phần còn lại màu cam
    let morphT = -1; // -1 = chưa gom (rải rác) hoặc đã gom xong
    let formed = false;

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.round(canvas.clientWidth * dpr);
      h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      // mật độ theo diện tích CSS: điện thoại ~2000 hạt, màn rộng tới 7000
      n = Math.round(Math.min(7000, Math.max(2000, (canvas.clientWidth * canvas.clientHeight) / 80)));
      orange = Math.round(n * (1 - ORANGE_SHARE));
      end = wordTargets(n, w, h, family);
      if (pos.length !== n * 2) {
        pos = new Float32Array(n * 2);
        start = new Float32Array(n * 2);
        mid = new Float32Array(n * 2);
        cloud = new Float32Array(n * 2);
        wobble = new Float32Array(n * 2);
        alpha = new Float32Array(n);
        delay = new Float32Array(n);
        offset = new Float32Array(n * 2);
        vel = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) {
          alpha[i] = 0.55 + Math.random() * 0.45;
          wobble[i * 2] = Math.random() * Math.PI * 2;
          wobble[i * 2 + 1] = 0.4 + Math.random() * 0.8;
        }
      }
      // đám mây chờ: dày ở giữa, thưa dần ra (phân bố chuẩn Box–Muller)
      for (let i = 0; i < n; i++) {
        const r = Math.sqrt(-2 * Math.log(1 - Math.random()));
        const a = Math.random() * Math.PI * 2;
        cloud[i * 2] = w / 2 + Math.cos(a) * r * w * 0.13;
        cloud[i * 2 + 1] = h * CY + Math.sin(a) * r * h * 0.17;
      }
      if (formed) pos.set(end); // đổi cỡ sau khi đã gom: nhảy thẳng về chữ mới
      else if (morphT < 0) pos.set(cloud);
    };

    const morph = () => {
      start.set(pos);
      const cx = w / 2;
      const cy = h * CY;
      for (let i = 0; i < n; i++) {
        const k = i * 2;
        // đám mây bung ra khỏi tâm (dẹt theo chiều ngang của dải) + cú hất ngẫu nhiên
        const a = Math.random() * Math.PI * 2;
        const kick = (30 + Math.random() * 90) * dpr;
        mid[k] = cx + (start[k]! - cx) * 2.6 + Math.cos(a) * kick;
        mid[k + 1] = cy + (start[k + 1]! - cy) * 1.6 + Math.sin(a) * kick * 0.6;
        delay[i] = Math.random() * MAX_DELAY;
      }
      morphT = 0;
    };

    const mouse = { x: -1e6, y: -1e6 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (e.clientY - r.top) * dpr;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -1e6;
    };

    const paint = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter"; // chỗ hạt dày (nét chữ) tự sáng lên
      // hạt cỡ theo px CSS: màn hẹp hạt nhỏ hơn để chữ không lổn nhổn
      const size = (canvas.clientWidth < 640 ? 1.4 : 2) * dpr;
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = `rgb(${pass ? ORANGE : CHALK})`;
        const from = pass ? orange : 0;
        const to = pass ? n : orange;
        for (let i = from; i < to; i++) {
          ctx.globalAlpha = alpha[i]! * (formed || morphT >= 0 ? 0.95 : 0.6);
          ctx.fillRect(pos[i * 2]! + offset[i * 2]! - size / 2, pos[i * 2 + 1]! + offset[i * 2 + 1]! - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    let raf = 0;
    let last = 0;
    let running = false;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const step = dt * 60; // cùng cảm giác lò xo ở 60Hz và 120Hz

      if (morphT >= 0) {
        morphT += dt;
        if (morphT < SCATTER) {
          const e = easeOutCubic(morphT / SCATTER);
          for (let k = 0; k < n * 2; k++) pos[k] = start[k]! + (mid[k]! - start[k]!) * e;
        } else if (morphT < SCATTER + FORM + MAX_DELAY) {
          for (let i = 0; i < n; i++) {
            const e = easeInOutCubic(Math.min(Math.max((morphT - SCATTER - delay[i]!) / FORM, 0), 1));
            const k = i * 2;
            pos[k] = mid[k]! + (end[k]! - mid[k]!) * e;
            pos[k + 1] = mid[k + 1]! + (end[k + 1]! - mid[k + 1]!) * e;
          }
        } else {
          pos.set(end);
          morphT = -1;
          formed = true;
        }
      } else if (!formed) {
        // chờ cuộn tới: đám mây gợn nhẹ quanh chỗ đứng
        const t = now / 1000;
        const amp = 6 * dpr;
        for (let k = 0; k < n * 2; k += 2) {
          const ph = wobble[k]! + t * wobble[k + 1]!;
          pos[k] = cloud[k]! + Math.cos(ph) * amp;
          pos[k + 1] = cloud[k + 1]! + Math.sin(ph * 1.3) * amp;
        }
      }

      const R = REPEL_RADIUS * dpr;
      for (let i = 0; i < n; i++) {
        const o = i * 2;
        let vx = vel[o]!;
        let vy = vel[o + 1]!;
        const dx = pos[o]! + offset[o]! - mouse.x;
        const dy = pos[o + 1]! + offset[o + 1]! - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) ** 2 * REPEL_FORCE * dpr;
          vx += (dx / d) * f * step;
          vy += (dy / d) * f * step;
        }
        vx = (vx - offset[o]! * SPRING * step) * DAMPING ** step;
        vy = (vy - offset[o + 1]! * SPRING * step) * DAMPING ** step;
        offset[o] = offset[o]! + vx * step;
        offset[o + 1] = offset[o + 1]! + vy * step;
        vel[o] = vx;
        vel[o + 1] = vy;
      }

      paint();
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    let alive = true;
    setup();
    if (reduce) {
      formed = true;
      pos.set(end);
      paint();
    }
    // chữ phải rải theo đúng font của trang: font tải xong mới tính lại khung chữ
    void document.fonts?.load(`800 100px ${family}`).then(() => {
      if (!alive) return;
      setup();
      if (!running) paint();
    });

    let visible = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = !!e?.isIntersecting;
        if (visible && !document.hidden) play();
        else pause();
        // gom chữ khi đã thấy rõ dải (~40%), chỉ một lần
        if (!reduce && !formed && morphT < 0 && (e?.intersectionRatio ?? 0) >= 0.4) morph();
      },
      { threshold: [0, 0.4] },
    );
    io.observe(canvas);

    const onVis = () => (document.hidden || !visible ? pause() : play());
    document.addEventListener("visibilitychange", onVis);

    let resizeT = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        setup();
        if (!running) paint();
      }, 150);
    });
    ro.observe(canvas);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      alive = false;
      pause();
      io.disconnect();
      ro.disconnect();
      clearTimeout(resizeT);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="relative bg-ink text-[#e8e6e3]" aria-label={`${WORD} – ${line}`}>
      <canvas ref={ref} aria-hidden className="block h-[clamp(180px,26vw,320px)] w-full font-sans" />
      <p className="container-site -mt-[clamp(32px,5.4vw,76px)] pb-2 text-center text-base font-semibold tracking-[0.02em] text-[#e8e6e3]/80 md:text-lg">{line}</p>
    </section>
  );
}
