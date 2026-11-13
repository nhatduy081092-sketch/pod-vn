"use client";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Nút lụa WebGL (theo bộ Code XR shader-buttons / SatinButton, 11/2026), đổi màu sang cam YALA.
 * - Mặc định là .btn-primary bình thường (không JS, không WebGL, giảm chuyển động -> giữ nguyên nút cũ).
 * - Có WebGL: vẽ tấm lụa cam lõm theo con trỏ, nhấn giữ thì lún xuống; data-gl="on" bỏ nền phẳng.
 * - Chỉ vẽ khi nút nằm trong màn hình và tab đang mở (không tốn pin khi cuộn qua).
 * Chỉ là lớp trang trí: link, href và hành vi bấm giữ nguyên như Link thường.
 */

const VERTEX = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 u_res; uniform float u_dpr; uniform float u_time;
uniform vec2 u_size; uniform vec2 u_mouse; uniform float u_hover; uniform float u_press;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
float sdPill(vec2 p, vec2 b){ vec2 d = abs(p) - b + b.y; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - b.y; }

float fabric(vec2 p){
  float pucker = sin(p.x * 0.45 + noise(vec2(p.x * 0.06, p.y * 0.05)) * 5.0) * 0.5 + 0.5;
  return sdPill(p, u_size * 0.5 - 2.5 - 1.5 * u_press) + pucker * 0.8;
}
vec2 dentAt(vec2 p){ return (p - u_mouse) / vec2(70.0 + 25.0 * u_press, 26.0 + 8.0 * u_press); }
float dent(vec2 p){ vec2 m = dentAt(p); return u_hover * (1.0 + 1.6 * u_press) * exp(-dot(m, m)); }
float crease(vec2 p, float x, float depth){ x += sin(p.y * 0.09 + x) * 1.5; return depth * exp(-abs(p.x - x) * 0.7); }

float height(vec2 p){
  float t = clamp(-fabric(p) / (u_size.y * 0.5), 0.0, 1.0);
  float h = sqrt(1.0 - (1.0 - t) * (1.0 - t)) * u_size.y * (0.3 - 0.1 * u_press);
  float reach = mix(0.6, 0.35, smoothstep(-8.0, 8.0, p.y));
  float hem = 1.0 - smoothstep(0.0, reach, t);
  h += sin(p.x * 0.48 + fbm(vec2(p.x * 0.05, p.y * 0.04)) * 6.0) * hem * 1.1;
  float pull = 1.0 + 0.6 * u_press;
  h -= crease(p, -0.09 * u_size.x, 2.4 * pull);
  h -= crease(p, 0.10 * u_size.x, 2.0 * pull);
  h -= crease(p, -0.01 * u_size.x, 0.9 * pull);
  h += (fbm(p * vec2(0.016, 0.022) + vec2(u_time * 0.05, 0.0)) - 0.5) * 10.0 * t;
  h -= dent(p) * (8.0 + 10.0 * u_press) * t;
  vec2 m = dentAt(p); float r = length(m);
  float spokes = sin(atan(m.y, m.x) * 9.0 + noise(m * 3.0) * 4.0);
  h += spokes * u_press * 1.6 * smoothstep(0.25, 0.8, r) * exp(-r * r * 0.9) * t;
  return h;
}

void main(){
  vec2 p = (gl_FragCoord.xy - u_res * 0.5) / u_dpr;
  vec2 b = u_size * 0.5;
  float dg = sdPill(p, b);
  float bevel = (1.0 - smoothstep(0.0, 7.0, dg)) * (0.10 + 0.05 * smoothstep(0.0, -b.y, p.y));
  float groove = clamp(0.5 - dg * u_dpr, 0.0, 1.0);
  vec3 col = vec3(0.0);
  if (groove > 0.0) {
    col = mix(vec3(0.03, 0.006, 0.0), vec3(0.45, 0.14, 0.03), smoothstep(0.2 * b.y, -b.y, p.y));
    float cloth = clamp(0.5 - fabric(p) * u_dpr, 0.0, 1.0);
    if (cloth > 0.0) {
      vec2 e = vec2(1.5, 0.0);
      float h0 = height(p); float hl = height(p - e.xy); float hr = height(p + e.xy);
      float hd = height(p - e.yx); float hu = height(p + e.yx);
      vec3 n = normalize(vec3((hl - hr) / 3.0, (hd - hu) / 3.0, 1.0));
      float ao = clamp(1.0 - (hl + hr + hd + hu - 4.0 * h0) * 0.12, 0.5, 1.1);
      vec3 v = vec3(0.0, 0.0, 1.0);
      vec3 light = normalize(vec3(-0.25, 0.78, 0.58));
      vec3 hv = normalize(light + v);
      float diff = clamp((dot(n, light) + 0.25) / 1.25, 0.0, 1.0);
      float spec = pow(max(dot(n, hv), 0.0), 40.0);
      vec3 tg = normalize(vec3(0.0, 1.0, 0.0) - n * n.y);
      float th = dot(tg, hv);
      float sheen = pow(sqrt(max(1.0 - th * th, 0.0)), 90.0);
      vec3 bounce = normalize(vec3(0.1, -0.7, 0.7));
      float spec2 = pow(max(dot(n, normalize(bounce + v)), 0.0), 30.0);
      float weave = noise(vec2(p.x * 0.5, p.y * 3.5));
      // cam YALA: tối – giữa (gần #C2410C để chữ trắng đủ tương phản) – sáng
      vec3 satin = mix(vec3(0.30, 0.08, 0.01), vec3(0.72, 0.24, 0.03), smoothstep(0.05, 0.55, diff));
      satin = mix(satin, vec3(0.90, 0.36, 0.08), smoothstep(0.62, 0.95, diff));
      satin *= ao * (0.96 + 0.06 * weave);
      satin += vec3(1.0, 0.78, 0.55) * (sheen * (0.24 + 0.12 * weave) + spec * 0.45) * min(ao, 1.0);
      satin += vec3(1.0, 0.6, 0.3) * spec2 * 0.3;
      satin *= 1.0 - 0.3 * clamp(dent(p), 0.0, 1.0) - 0.08 * u_press;
      float wall = smoothstep(-5.0, 2.0, sdPill(p + vec2(0.0, 3.0 + 4.0 * u_press), b));
      satin *= 1.0 - wall * (0.22 + 0.25 * u_press);
      col = mix(col, satin, cloth);
    }
  }
  vec3 bevelCol = vec3(0.45, 0.43, 0.42);
  gl_FragColor = vec4(col * groove + bevelCol * bevel * (1.0 - groove), groove + bevel * (1.0 - groove));
}
`;

type Spring = { value: number; velocity: number };
const spring = (s: Spring, target: number, k: number, c: number, dt: number) => {
  s.velocity += ((target - s.value) * k - s.velocity * c) * dt;
  s.value += s.velocity * dt;
};

export function SatinLink({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = linkRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return; // lỗi shader -> giữ nút phẳng
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const loc: Record<string, WebGLUniformLocation | null> = {};
    const u = (name: string) => (loc[name] ??= gl.getUniformLocation(program, name));

    // lò xo theo con trỏ (y hướng lên, gốc ở tâm nút)
    const REACH = 24, K = 90, C = 14;
    const target = { x: 0, y: 0, hover: 0, press: 0 };
    const sx: Spring = { value: 0, velocity: 0 }, sy: Spring = { value: 0, velocity: 0 };
    const sh: Spring = { value: 0, velocity: 0 }, sp: Spring = { value: 0, velocity: 0 };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = e.clientX - r.left - r.width / 2;
      target.y = r.top + r.height / 2 - e.clientY;
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      target.hover = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
    };
    const down = (e: PointerEvent) => (move(e), (target.press = 1));
    const up = (e: PointerEvent) => {
      target.press = 0;
      if (e.pointerType !== "mouse") target.hover = 0;
    };
    const leave = () => ((target.hover = 0), (target.press = 0));
    const keyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      Object.assign(target, { x: 0, y: 0, hover: 1, press: 1 });
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("keydown", keyDown);
    el.addEventListener("keyup", leave);
    el.addEventListener("blur", leave);

    const start = performance.now();
    let last = start;
    let raf = 0;
    let visible = false;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      spring(sx, target.x, K, C, dt);
      spring(sy, target.y, K, C, dt);
      spring(sh, target.hover, K, C, dt);
      spring(sp, target.press, K * 2, C * 1.4, dt);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(u("u_res"), w, h);
      gl.uniform1f(u("u_dpr"), dpr);
      gl.uniform1f(u("u_time"), (now - start) / 1000);
      gl.uniform2f(u("u_size"), el.offsetWidth, el.offsetHeight);
      gl.uniform2f(u("u_mouse"), sx.value, sy.value);
      gl.uniform1f(u("u_hover"), sh.value);
      gl.uniform1f(u("u_press"), sp.value);
      el.style.setProperty("--press", sp.value.toFixed(3));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!el.dataset.gl) el.dataset.gl = "on"; // chỉ bỏ nền phẳng sau khi đã vẽ được khung đầu
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
    };
    const wake = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => ((visible = e.isIntersecting), wake()));
    io.observe(el);
    document.addEventListener("visibilitychange", wake);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("keydown", keyDown);
      el.removeEventListener("keyup", leave);
      el.removeEventListener("blur", leave);
      delete el.dataset.gl;
      el.style.removeProperty("--press");
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <Link ref={linkRef} href={href} className={`satin ${className}`}>
      <canvas ref={canvasRef} className="satin__canvas" aria-hidden />
      <span className="satin__label">{children}</span>
    </Link>
  );
}
