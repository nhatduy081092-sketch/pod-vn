import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { QuoteListProvider } from "@/lib/quote-list";
import { getCategories, getNotices, getPages, getSettings } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Analytics } from "@/components/layout/Analytics";
import { TopBar } from "@/components/layout/TopBar";
import { NoticeBanner } from "@/components/layout/NoticeBanner";
import { LaneTracker } from "@/components/personal/LaneTracker";
import { RevealObserver } from "@/components/motion/Reveal";
import { LANE_BOOT_SCRIPT } from "@/lib/personal";

const font = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
// Chữ tiêu đề: tươi, hơi tinh nghịch, hỗ trợ tiếng Việt
const display = Bricolage_Grotesque({
  subsets: ["vietnamese", "latin"],
  axes: ["opsz", "wdth"], // biến thể độ rộng -> tiêu đề hẹp, đậm
  variable: "--font-display",
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
  themeColor: "#1d1d1f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, pages, notices] = await Promise.all([getSettings(), getCategories(), getPages(), getNotices()]);
  return (
    <html lang="vi" className={`${font.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/* nhớ lối khách (Cá nhân | Doanh nghiệp) trước khi vẽ trang */}
        <script dangerouslySetInnerHTML={{ __html: LANE_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <LaneTracker />
        <RevealObserver />
        <CartProvider>
        <QuoteListProvider>
          <NoticeBanner notices={notices} />
          <TopBar brand={settings.brand} />
          <Header
            brandName={settings.brand.name}
            logoUrl={settings.brand.logoUrl}
            categories={categories}
            hotline={settings.brand.hotline}
            industries={settings.b2bHub.industries}
            solutions={settings.b2bHub.solutions}
          />
          <main className="min-h-[60vh]">{children}</main>
          <Footer brand={settings.brand} categories={categories} pages={pages} />
          <FloatingContact zalo={settings.brand.zalo} hotline={settings.brand.hotline} messengerUrl={settings.brand.messengerUrl} />
        </QuoteListProvider>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
