import { NextRequest } from "next/server";
import { proxyToApi } from "../_proxy/proxyToApi";

async function handler(request: NextRequest) {
  return proxyToApi(request, "/api/import-jobs");
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
