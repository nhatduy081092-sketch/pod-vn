import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/gio-hang", "/thanh-toan", "/don-hang/", "/tai-khoan", "/seller", "/thiet-ke/", "/dang-nhap", "/dang-ky"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
