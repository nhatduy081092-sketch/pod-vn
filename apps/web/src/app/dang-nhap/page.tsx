import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="container-site py-10 md:py-16">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
