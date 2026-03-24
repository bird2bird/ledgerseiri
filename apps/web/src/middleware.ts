import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 放行静态资源
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 放行公共认证/平台认证/API 认证
  if (
    pathname.startsWith('/platform-auth') ||
    pathname.startsWith('/api/platform') ||
    pathname.startsWith('/api/platform-auth') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // 当前阶段：middleware 不做任何内部 fetch
  // 只保留透传，避免 Edge runtime / Docker / proxy 链路导致全站 500
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
