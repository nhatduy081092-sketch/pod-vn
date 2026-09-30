import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { getCategories, getNotices, getPages, getSettings } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Analytics } from "@/components/layout/Analytics";
import { TopBar } from "@/components/layout/TopBar";
import { NoticeBanner } from "@/components/layout/NoticeBanner";

const font = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: s.seo.title, template: `%s | ${s.brand.name}` },
    description: s.seo.description,
    openGraph: { type: "website", locale: "vi_VN", siteName: s.brand.name, title: s.seo.title, description: s.seo.description },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#FFA415",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, pages, notices] = await Promise.all([getSettings(), getCategories(), getPages(), getNotices()]);
  return (
    <html lang="vi" className={font.variable}>
      <body className="font-sans">
        <CartProvider>
          <NoticeBanner notices={notices} />
          <TopBar brand={settings.brand} />
          <Header brandName={settings.brand.name} logoUrl={settings.brand.logoUrl} categories={categories} hotline={settings.brand.hotline} />
          <main className="min-h-[60vh]">{children}</main>
          <Footer brand={settings.brand} categories={categories} pages={pages} />
          <FloatingContact zalo={settings.brand.zalo} hotline={settings.brand.hotline} messengerUrl={settings.brand.messengerUrl} />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
