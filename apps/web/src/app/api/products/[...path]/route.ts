import { NextRequest } from "next/server";
import { proxyToApi } from "../../_proxy/proxyToApi";

type RouteParams = {
  params: Promise<{
    path?: string[];
  }>;
};

async function handler(request: NextRequest, context: RouteParams) {
  const { path = [] } = await context.params;
  return proxyToApi(request, `/api/products/${path.join("/")}`);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
