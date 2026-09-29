import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CMS – Quản trị", template: "%s | CMS" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans">{children}</body>
    </html>
  );
}
