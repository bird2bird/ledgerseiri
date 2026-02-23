import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const SITE = 'https://ledgerseiri.com';
const LOCALES = ['ja', 'en', 'zh-CN', 'zh-TW'] as const;

// Exclude non-SEO routes
const EXCLUDE_PREFIX = ['app', 'login', 'api', '_next'];

function walkPages(baseDir: string): string[] {
  // return route paths WITHOUT locale prefix, like: '/', '/lp'
  const routes: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (e.isDirectory()) {
        // skip special dirs
        if (EXCLUDE_PREFIX.includes(e.name)) continue;
        walk(full);
        continue;
      }

      if (e.isFile() && e.name === 'page.tsx') {
        const rel = path.relative(baseDir, full); // e.g. "lp/page.tsx" or "page.tsx"
        const segDir = path.dirname(rel); // "." or "lp"
        const route = segDir === '.' ? '/' : `/${segDir.replaceAll(path.sep, '/')}`;
        routes.push(route);
      }
    }
  }

  walk(baseDir);

  // unique + sort
  return Array.from(new Set(routes)).sort();
}

function withLocale(locale: string, route: string) {
  return route === '/' ? `/${locale}` : `/${locale}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const langRoot = path.join(process.cwd(), 'src', 'app', '[lang]');
  const routes = walkPages(langRoot); // '/', '/lp', '/(future...)'

  const items: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const lang of LOCALES) {
      const url = `${SITE}${withLocale(lang, route)}`;

      const alternates: Record<string, string> = {};
      for (const l of LOCALES) alternates[l] = `${SITE}${withLocale(l, route)}`;

      items.push({
        url,
        lastModified: now,
        alternates: { languages: alternates },
      });
    }
  }

  return items;
}
