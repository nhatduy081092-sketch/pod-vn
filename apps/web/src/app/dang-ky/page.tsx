import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Tạo tài khoản", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="container-site py-10 md:py-16">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
