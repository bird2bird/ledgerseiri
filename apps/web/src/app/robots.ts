import type { MetadataRoute } from 'next';

const SITE = 'https://ledgerseiri.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app',
          '/login',
          '/ja/app',
          '/en/app',
          '/zh-CN/app',
          '/zh-TW/app',
          '/ja/login',
          '/en/login',
          '/zh-CN/login',
          '/zh-TW/login',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
