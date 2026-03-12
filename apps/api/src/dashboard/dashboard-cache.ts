import type { INestApplication } from '@nestjs/common';

type DashboardCacheEntry = {
  expiresAt: number;
  data: any;
};

const DASHBOARD_CACHE_TTL_MS = 30_000;
const dashboardCache = new Map<string, DashboardCacheEntry>();

export function getDashboardCacheKey(range: string, storeId?: string, locale?: string) {
  return JSON.stringify({
    range: range || '30d',
    storeId: storeId || 'all',
    locale: locale || 'ja',
  });
}

export function getCachedDashboard(key: string) {
  const hit = dashboardCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    dashboardCache.delete(key);
    return null;
  }
  return hit.data;
}

export function setCachedDashboard(key: string, data: any) {
  dashboardCache.set(key, {
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    data,
  });
}

export function clearExpiredDashboardCache() {
  const now = Date.now();
  for (const [k, v] of dashboardCache.entries()) {
    if (now > v.expiresAt) dashboardCache.delete(k);
  }
}

export function invalidateDashboardCache(reason = 'unknown') {
  const sizeBefore = dashboardCache.size;
  dashboardCache.clear();
  if (sizeBefore > 0) {
    console.log(`[dashboard-cache] invalidated entries=${sizeBefore} reason=${reason}`);
  }
}

export function bindDashboardCacheInvalidationMiddleware(app: INestApplication) {
  const writePrefixes = [
    '/api/transactions',
    '/transaction',
    '/api/invoices',
    '/api/payments',
    '/api/fund-transfer',
    '/api/accounts',
    '/api/account-balances',
  ];

  app.use((req: any, res: any, next: any) => {
    const method = String(req?.method || 'GET').toUpperCase();
    const path = String(req?.originalUrl || req?.url || '');
    const isWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    const shouldWatch = isWrite && writePrefixes.some((prefix) => path.startsWith(prefix));

    if (!shouldWatch) return next();

    res.on('finish', () => {
      if (res.statusCode < 400) {
        invalidateDashboardCache(`${method} ${path}`);
      }
    });

    next();
  });
}
