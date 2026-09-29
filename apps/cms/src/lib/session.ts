import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE = "pod_admin";

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function requireToken(): Promise<string> {
  const t = await getToken();
  if (!t) redirect("/login");
  return t;
}
