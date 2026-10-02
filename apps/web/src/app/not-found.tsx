import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center py-20 text-center md:py-28">
      <p className="sticker tilt bg-sun px-8 py-4 font-display text-[clamp(64px,12vw,140px)] font-extrabold leading-none [font-stretch:85%]" style={{ ["--r" as string]: "-4deg" }}>
        404
      </p>
      <h1 className="mt-8 font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Trang này chưa được in ra</h1>
      <p className="mt-3 max-w-md text-[15px] text-ink/70">Đường dẫn có thể đã đổi hoặc sản phẩm đã ngừng bán. Thử tìm trong các mục dưới đây.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary px-6 py-3">
          Về trang chủ
        </Link>
        <Link href="/bo-suu-tap" className="btn-outline px-6 py-3">
          Mẫu có sẵn
        </Link>
        <Link href="/thiet-ke" className="btn-outline px-6 py-3">
          Tự thiết kế
        </Link>
      </div>
    </div>
  );
}
