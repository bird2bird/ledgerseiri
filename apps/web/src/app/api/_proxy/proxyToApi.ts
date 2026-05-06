import { NextRequest, NextResponse } from "next/server";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function copyRequestHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("accept", request.headers.get("accept") ?? "application/json");

  return headers;
}

function copyResponseHeaders(source: Response) {
  const headers = new Headers();

  source.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

export async function proxyToApi(request: NextRequest, apiPath: string) {
  const targetUrl = new URL(`${apiInternalUrl}${apiPath}`);
  targetUrl.search = request.nextUrl.search;

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const response = await fetch(targetUrl.toString(), {
    method,
    headers: copyRequestHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: copyResponseHeaders(response),
  });
}
