"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setLane } from "@/lib/personal";

/** Nhớ khách đang quan tâm Doanh nghiệp hay Cá nhân (theo trang vừa vào) */
export function LaneTracker() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/doanh-nghiep")) setLane("b2b");
    else if (path.startsWith("/thiet-ke") || path.startsWith("/bo-suu-tap") || path.startsWith("/thanh-toan")) setLane("personal");
  }, [path]);
  return null;
}
