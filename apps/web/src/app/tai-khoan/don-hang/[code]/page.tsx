import { AccountOrderDetail } from "@/components/account/AccountPages";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <AccountOrderDetail code={decodeURIComponent(code).toUpperCase()} />;
}
