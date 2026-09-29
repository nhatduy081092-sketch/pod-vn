import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold">Đăng nhập quản trị</h1>
        {expired && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">Phiên đăng nhập đã hết hạn.</p>}
        <LoginForm />
      </div>
    </div>
  );
}
