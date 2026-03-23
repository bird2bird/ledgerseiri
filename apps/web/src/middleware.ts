import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 放行平台 & 登录
  if (
    pathname.startsWith('/ja/platform') ||
    pathname.startsWith('/platform-auth') ||
    pathname.startsWith('/api/platform') ||
    pathname.startsWith('/api/platform-auth') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.next();
  }

  try {
    // ✅ 用当前域名（关键）
    const res = await fetch(
      `${origin}/api/workspace/context`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 403) {
      const data = await res.json();

      if (data?.message === 'TENANT_SUSPENDED') {
        return NextResponse.redirect(
          new URL(`/${pathname.split('/').filter(Boolean)[0] || 'ja'}/tenant-suspended`, req.url)
        );
      }
    }

  } catch (e) {
    console.error('middleware fetch error', e);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico).*)',
  ],
};
