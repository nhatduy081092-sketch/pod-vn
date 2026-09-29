import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pod/shared"],
  poweredByHeader: false,
  async rewrites() {
    const api = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
    // ảnh sản phẩm/upload đi qua cùng domain với web -> không lỗi cross-origin, 1 domain khi deploy
    return [
      { source: "/mock/:path*", destination: `${api}/mock/:path*` },
      { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
    ];
  },
  experimental: {
    // cho phép upload ảnh qua server action
    serverActions: { bodySizeLimit: "16mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
