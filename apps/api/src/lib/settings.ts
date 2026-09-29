import { prisma } from "@pod/db";
import { mergeLanding, type LandingSettings } from "@pod/shared";

let cache: { value: LandingSettings; at: number } | null = null;
const TTL = 30_000;

export async function getLanding(fresh = false): Promise<LandingSettings> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.value;
  const row = await prisma.setting.findUnique({ where: { key: "landing" } });
  const value = mergeLanding(row?.value);
  cache = { value, at: Date.now() };
  return value;
}

export function invalidateLanding() {
  cache = null;
}
