const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function readString(payload, keys) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function normalizeDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function deriveDateRange(rangePreset) {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (rangePreset === '30D') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (rangePreset === '90D') start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (rangePreset === '365D') start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function readIdentity(row) {
  const normalized = asRecord(row.normalizedPayloadJson);
  const raw = asRecord(row.rawPayloadJson);
  const payload = { ...raw, ...normalized };

  const orderId = readString(payload, [
    'amazonOrderId',
    'AmazonOrderId',
    'orderId',
    'sourceOrderId',
    'order_id',
    'amazon_order_id',
  ]);

  const purchaseDate =
    normalizeDateOnly(readString(payload, [
      'purchaseDate',
      'PurchaseDate',
      'amazonPurchaseDate',
      'AmazonPurchaseDate',
      'purchase_date',
      'orderDate',
      'OrderDate',
      'order_date',
      'postedDate',
      'posted_date',
      'createdAt',
      'CreatedAt',
      'importedAt',
      'ImportedAt',
    ])) ||
    normalizeDateOnly(String(row.businessMonth || '')) ||
    (row.importJob?.importedAt ? row.importJob.importedAt.toISOString().slice(0, 10) : null);

  const title = readString(payload, ['title', 'Title', 'itemTitle', 'productName']) || 'Amazon注文';
  const sellerSku = readString(payload, ['sellerSku', 'SellerSKU', 'sku', 'SKU']);
  const status = readString(payload, ['orderStatus', 'OrderStatus', 'status']) || 'imported';

  return { orderId, purchaseDate, title, sellerSku, status };
}

async function main() {
  const rows = await prisma.importStagingRow.findMany({
    where: {
      module: 'store-orders',
      importJob: { sourceType: 'amazon-sp-api-orders' },
    },
    orderBy: [{ rowNo: 'asc' }, { id: 'asc' }],
    take: 20000,
    select: {
      id: true,
      companyId: true,
      importJobId: true,
      rowNo: true,
      businessMonth: true,
      normalizedPayloadJson: true,
      rawPayloadJson: true,
      importJob: {
        select: {
          id: true,
          importedAt: true,
        },
      },
    },
  });

  if (!rows.length) {
    console.log(JSON.stringify({ ok: true, message: 'no amazon staging rows found' }, null, 2));
    return;
  }

  const companyId = rows[0].companyId;
  const range = deriveDateRange('30D');

  const orderMap = new Map();

  for (const row of rows.filter((row) => row.companyId === companyId)) {
    const identity = readIdentity(row);
    if (!identity.orderId) continue;
    if (identity.purchaseDate && (identity.purchaseDate < range.startDate || identity.purchaseDate > range.endDate)) continue;

    const current = orderMap.get(identity.orderId) || {
      orderId: identity.orderId,
      purchaseDate: identity.purchaseDate,
      itemCount: 0,
      rowNo: row.rowNo,
      titles: [],
    };

    current.itemCount += 1;
    current.purchaseDate = current.purchaseDate || identity.purchaseDate;
    current.rowNo = current.rowNo ?? row.rowNo;
    current.titles.push(identity.title);
    orderMap.set(identity.orderId, current);
  }

  const allOrders = Array.from(orderMap.values()).sort((a, b) => {
    const ad = a.purchaseDate || '';
    const bd = b.purchaseDate || '';
    if (ad !== bd) return bd.localeCompare(ad);
    return Number(b.rowNo || 0) - Number(a.rowNo || 0);
  });

  const totalOrders = allOrders.length;
  const missingDateOrders = allOrders.filter((order) => !order.purchaseDate).length;

  const byLimit = [20, 50, 100].map((limit) => ({
    limit,
    totalOrders,
    visibleOrders: allOrders.slice(0, limit).length,
    totalItems: allOrders.reduce((sum, order) => sum + order.itemCount, 0),
    hasMore: limit < totalOrders,
    nextCursor: limit < totalOrders ? String(limit) : null,
  }));

  console.log(JSON.stringify({
    ok: true,
    companyId,
    range,
    stagingRows: rows.length,
    groupedOrders30D: totalOrders,
    missingDateOrders,
    byLimit,
    sampleDates: allOrders.slice(0, 10).map((order) => ({
      orderId: order.orderId,
      purchaseDate: order.purchaseDate,
      itemCount: order.itemCount,
    })),
  }, null, 2));

  const uniqueTotals = new Set(byLimit.map((row) => row.totalOrders));
  if (uniqueTotals.size !== 1) {
    throw new Error('totalOrders changes by limit in runtime diagnostic');
  }

  if (totalOrders > 20 && byLimit[0].hasMore !== true) {
    throw new Error('hasMore must be true when totalOrders > 20');
  }

  if (totalOrders > 20 && byLimit[0].nextCursor !== '20') {
    throw new Error('nextCursor must be 20 when limit=20 and totalOrders > 20');
  }
}

main()
  .catch((error) => {
    console.error('[NG] Step151-W-K runtime diagnostic failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
