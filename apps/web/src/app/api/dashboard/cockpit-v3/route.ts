import { NextRequest, NextResponse } from "next/server";
import { makeDashboardV3CockpitMock } from "@/core/dashboard-v3/mock";
import { normalizeBusinessView } from "@/core/business-view";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const businessType = normalizeBusinessView(url.searchParams.get("businessType"));
  const range = (url.searchParams.get("range") || "30d") as "today" | "7d" | "30d" | "month";

  // Step90 baseline:
  // 1) 先用 web route 固定 real seam 入口
  // 2) 未来可在这里转发到真正的 API 聚合接口
  // 3) 当前先回传 mock，但 source 标成 real-ready，方便 provider seam 落地

  const mock = makeDashboardV3CockpitMock({
    businessView: businessType,
    range,
  });

  return NextResponse.json({
    ...mock,
    source: "mock",
  });
}
