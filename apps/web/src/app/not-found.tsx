import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site py-20 text-center">
      <p className="text-6xl font-black text-brand">404</p>
      <h1 className="mt-2 text-xl font-black">Không tìm thấy trang</h1>
      <Link href="/" className="btn-primary mt-6">
        Về trang chủ
      </Link>
    </div>
  );
}
