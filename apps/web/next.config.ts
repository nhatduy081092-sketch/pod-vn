import path from "node:path";
import type { NextConfig } from "next";

/** Host ảnh ngoài được tối ưu qua next/image (resize + WebP/AVIF theo thiết bị) */
const apiHosts = [process.env.API_URL, process.env.NEXT_PUBLIC_API_URL, "http://127.0.0.1:4000", "http://localhost:4000"]
  .filter((x): x is string => !!x)
  .map((x) => new URL(x.replace(/\/$/, "")));
const uploadsBase = process.env.NEXT_PUBLIC_UPLOADS_BASE ? new URL(process.env.NEXT_PUBLIC_UPLOADS_BASE) : null;

const nextConfig: NextConfig = {
  transpilePackages: ["@pod/shared"],
  // Docker: NEXT_OUTPUT=standalone -> server tự chứa, image nhỏ (tắt khi dev/Windows)
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const, outputFileTracingRoot: path.join(process.cwd(), "../..") } : {}),
  compress: process.env.NEXT_COMPRESS !== "0",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
    imageSizes: [64, 96, 128, 200, 256, 320],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "oemgroup.vn" },
      { protocol: "https", hostname: "www.oemgroup.vn" },
      ...apiHosts.flatMap((u) =>
        ["/uploads/**", "/mock/**"].map((pathname) => ({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, port: u.port, pathname })),
      ),
      ...(uploadsBase ? [{ protocol: uploadsBase.protocol.replace(":", "") as "http" | "https", hostname: uploadsBase.hostname, pathname: "/**" }] : []),
    ],
  },
  async rewrites() {
    const api = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
    // ảnh sản phẩm/upload đi qua cùng domain với web -> không lỗi cross-origin, 1 domain khi deploy
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
      { source: "/mock/:path*", destination: `${api}/mock/:path*` },
      { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
