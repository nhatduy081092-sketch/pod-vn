import { readyDesignFontsHref, type ReadyDesign } from "@pod/shared";

/** Nạp đúng các font mà mẫu đang dùng (React 19 tự đưa <link> lên <head>, không trùng lặp) */
export function DesignFonts({ designs }: { designs: ReadyDesign[] }) {
  if (!designs.length) return null;
  return (
    <>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={readyDesignFontsHref(designs)} precedence="default" />
    </>
  );
}
