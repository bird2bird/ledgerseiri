import { NextRequest, NextResponse } from "next/server";
import { makeDashboardV3CockpitMock } from "@/core/dashboard-v3/mock";
import { normalizeBusinessView } from "@/core/business-view";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const businessType = normalizeBusinessView(url.searchParams.get("businessType"));
  const range = (url.searchParams.get("range") || "30d") as "today" | "7d" | "30d" | "month";

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const upstream = `${apiBase}/dashboard-cockpit?businessView=${businessType}&range=${range}`;

    const res = await fetch(upstream, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`dashboard-cockpit upstream failed: ${res.status}`);
    }

    const payload = await res.json();

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[cockpit-v3 route] fallback to mock", err);

    const mock = makeDashboardV3CockpitMock({
      businessView: businessType,
      range,
    });

    return NextResponse.json({
      ...mock,
      source: "mock-fallback",
    });
  }
}
