import Link from "next/link";
import { adminFetch } from "@/lib/api";
import type { AdminCategory } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { PriceExcelUpload } from "@/components/PriceExcel";

export const metadata = { title: "Bảng giá Excel" };

export default async function PriceExcelPage() {
  const cats = await adminFetch<AdminCategory[]>("/categories");
  return (
    <>
      <PageHeader title="Bảng giá Excel">
        <Link href="/products/prices" className="btn-ghost h-fit">
          Bảng giá nhanh
        </Link>
        <Link href="/products" className="btn-ghost h-fit">
          ← Sản phẩm
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-bold">1. Tải bảng giá hiện tại</h2>
          <p className="mt-1 text-sm text-neutral-600">File gồm sheet “Bảng giá” (giá bán, giá gạch, giá “Từ”, khuyến mãi, SL tối thiểu, giá sỉ, đang bán), “Phân loại” (phụ phí màu/size) và “Hướng dẫn”.</p>
          <form action="/products/excel/download" method="get" className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="label">Danh mục</span>
              <select name="categoryId" className="input">
                <option value="">Tất cả</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Nguồn</span>
              <select name="nguon" className="input">
                <option value="">Tất cả</option>
                <option value="yala">Sản phẩm YALA</option>
                <option value="oem">Nhập từ nguồn OEM</option>
              </select>
            </label>
            <button type="submit" className="btn-primary">⬇ Tải file Excel</button>
          </form>
        </section>

        <section className="card">
          <h2 className="font-bold">2. Sửa giá trong Excel</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-600">
            <li>Chỉ sửa cột nền trắng; giữ nguyên cột “Mã SP” / “Mã phân loại”.</li>
            <li>Giá gõ dạng <code>159000</code>, <code>159.000</code> hoặc <code>159k</code>. Giá bán = 0 → liên hệ báo giá; để trống → giữ nguyên.</li>
            <li>Giá sỉ: <code>100=108000; 300=104000</code>. Xoá bớt dòng không đổi cũng được.</li>
            <li>Lưu lại dạng <b>.xlsx</b> (Excel, Google Sheets → Tải xuống → .xlsx, Numbers → Xuất Excel).</li>
          </ul>
        </section>
      </div>

      <section className="card mt-4">
        <h2 className="font-bold">3. Tải file lên để cập nhật website</h2>
        <p className="mb-3 mt-1 text-sm text-neutral-600">Hệ thống so sánh với giá hiện tại và cho xem trước từng thay đổi. Chỉ khi bấm “Áp dụng” giá trên website mới đổi (tất cả cùng lúc).</p>
        <PriceExcelUpload />
      </section>
    </>
  );
}
