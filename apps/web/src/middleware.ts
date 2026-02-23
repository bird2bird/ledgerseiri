import { NextRequest, NextResponse } from "next/server";
import { normalizeLang, isLangSegment, pickLangFromAcceptLanguage } from "./lib/i18n/lang";

const COOKIE_LANG = "ls_lang";

/**
 * Rules:
 * 1) If path already starts with /{lang}/... -> allow (no rewrite to ja)
 * 2) If path is "/" -> redirect to preferred /{lang}
 * 3) If path is "/login|/register|/forgot-password|/terms|/privacy" (without lang) -> redirect to /{lang}/{path}
 * 4) Otherwise pass-through (avoid breaking LP routes)
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Ignore Next internals & static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  const seg1 = pathname.split("/")[1] || "";
  // Already localized: keep it
  if (isLangSegment(seg1)) {
    // Keep cookie updated (so /login can inherit language)
    const res = NextResponse.next();
    res.cookies.set(COOKIE_LANG, seg1, { path: "/", sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const cookieLang = req.cookies.get(COOKIE_LANG)?.value;
  const preferred = normalizeLang(cookieLang) || pickLangFromAcceptLanguage(req.headers.get("accept-language"));

  // Root -> /{lang}
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // If visiting auth/legal routes without lang prefix, redirect to add prefix
  const plain = pathname.replace(/\/+$/g, "");
  const isAuthOrLegal =
    plain === "/login" ||
    plain === "/register" ||
    plain === "/forgot-password" ||
    plain === "/terms" ||
    plain === "/privacy";

  if (isAuthOrLegal) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}${plain}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Do NOT rewrite other routes. (LP & marketing pages should work as-is)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
