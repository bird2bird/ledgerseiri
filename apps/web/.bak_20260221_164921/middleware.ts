import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['ja', 'en', 'zh-CN', 'zh-TW'] as const;
type Locale = (typeof LOCALES)[number];

function detectLocale(req: NextRequest): Locale {
  const al = req.headers.get('accept-language') || '';
  if (al.includes('zh-TW') || al.includes('zh-Hant')) return 'zh-TW';
  if (al.includes('zh')) return 'zh-CN';
  if (al.includes('en')) return 'en';
  return 'ja';
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
}

function stripLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return '/';
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1) || '/';
  }
  return pathname || '/';
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Ignore Next internals + static endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const pathNoLocale = stripLocale(pathname);

  // No locale in URL -> redirect to detected locale
  if (!hasLocalePrefix(pathname)) {
    const locale = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Provide stripped path for hreflang/canonical metadata generation
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-path-no-locale', pathNoLocale);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)'],
};
