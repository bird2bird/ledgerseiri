import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DetectMonthConflictsDto } from './dto/detect-month-conflicts.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { CommitImportDto } from './dto/commit-import.dto';
import type { CashIncomePreviewDto } from './dto/cash-income-preview.dto';
import type { CashIncomeCommitDto } from './dto/cash-income-commit.dto';

type MonthStat = {
  month: string;
  existingCount: number;
};

type AmazonPreviewRawRow = {
  rowNo: number;
  fields: Record<string, string>;
};

type AmazonPreviewFact = {
  rowNo: number;
  orderId: string;
  orderDate?: string | null;
  sku: string;
  productName: string;
  quantity: number;
  amount: number;

  grossAmount: number;
  netAmount: number;
  feeAmount: number;
  taxAmount: number;
  shippingAmount: number;
  promotionAmount: number;

  itemSalesAmount: number;
  itemSalesTaxAmount: number;
  shippingTaxAmount: number;
  promotionDiscountAmount: number;
  promotionDiscountTaxAmount: number;
  commissionFeeAmount: number;
  fbaFeeAmount: number;

  rawTransactionType?: string | null;
  signedAmount?: number | null;
  description?: string | null;

  store?: string | null;
  fulfillment?: string | null;
  rawLabel: string;
};

type AmazonTransactionChargeKind =
  | 'ORDER_SALE'
  | 'AD_FEE'
  | 'STORAGE_FEE'
  | 'SUBSCRIPTION_FEE'
  | 'FBA_FEE'
  | 'TAX'
  | 'PAYOUT'
  | 'ADJUSTMENT'
  | 'OTHER';

type AmazonTransactionCharge = {
  id: string;
  rowNo: number;
  occurredAt?: string | null;
  orderId?: string | null;
  sku?: string | null;
  transactionType: string;
  description: string;
  kind: AmazonTransactionChargeKind;
  signedAmount: number;
};

type AmazonTransactionChargeSummary = {
  orderSale: number;
  adFee: number;
  storageFee: number;
  subscriptionFee: number;
  fbaFee: number;
  tax: number;
  payout: number;
  adjustment: number;
  other: number;
};

type AmazonPreviewResult = {
  summary: {
    filename: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
    totalAmount: number;
    totalQuantity: number;
    delimiter: 'comma' | 'tab';
    headers: string[];
  };
  rawRows: AmazonPreviewRawRow[];
  facts: AmazonPreviewFact[];
  charges: AmazonTransactionCharge[];
  chargeSummary: AmazonTransactionChargeSummary;
};

type PreviewRowItem = {
  rowNo: number;
  businessMonth: string | null;
  matchStatus: 'new' | 'duplicate' | 'conflict' | 'error';
  matchReason?: string;
  normalizedPayload: Record<string, unknown>;
};

type ExpenseImportCommitRow = {
  rowNo?: number;
  occurredAt?: string;
  amount?: number;
  currency?: string;
  category?: string;
  vendor?: string;
  accountName?: string;
  evidenceNo?: string;
  memo?: string;
  status?: 'ok' | 'error' | string;
  error?: string;
};

type ExpenseImportCommitDto = {
  companyId?: string;
  filename?: string;
  ledgerScope?: string;
  category?: string;
  rows?: ExpenseImportCommitRow[];
};

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  private detectDelimiter(headerLine: string): 'comma' | 'tab' {
    const tabCount = (headerLine.match(/\t/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    return tabCount > commaCount ? 'tab' : 'comma';
  }

  private splitDelimitedLine(line: string, delimiter: string): string[] {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === delimiter && !inQuotes) {
        out.push(current);
        current = '';
        continue;
      }

      current += ch;
    }

    out.push(current);
    return out.map((x) => x.trim());
  }

  private normalizeHeader(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^[\ufeff]+/, '')
      .replace(/[\s_\-\/（）()]+/g, '');
  }

  private pickField(row: Record<string, string>, aliases: string[]): string {
    for (const alias of aliases) {
      const key = this.normalizeHeader(alias);
      const value = row[key];
      if (value != null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  }

  private parseAmount(value: string): number {
    const cleaned = String(value || '').replace(/[^0-9.\-]/g, '');
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num);
  }

  private parseQuantity(value: string): number {
    const cleaned = String(value || '').replace(/[^0-9\-]/g, '');
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return 0;
    return Math.trunc(num);
  }

  private parseSignedTotalAmount(row: Record<string, string>): number {
    return this.parseAmount(
      this.pickField(row, ['合計', 'total', 'transaction total', 'net total']),
    );
  }

  private parseAmazonOrderRevenue(row: Record<string, string>): number {
    const productSales = this.parseAmount(
      this.pickField(row, [
        '商品売上',
        '商品の売上',
        'product sales',
        'item price',
        'item-price',
        'principal',
        '売上',
        '金額',
      ]),
    );

    const shippingSales = this.parseAmount(
      this.pickField(row, ['配送料', '送料', 'shipping', 'shipping credits']),
    );

    const giftWrapSales = this.parseAmount(
      this.pickField(row, ['ギフト包装料', 'ギフト包装', 'gift wrap', 'giftwrap']),
    );

    return productSales + shippingSales + giftWrapSales;
  }

  private parseAmazonBridgeAmounts(
    row: Record<string, string>,
    kind: AmazonTransactionChargeKind,
    signedAmount: number,
  ) {
    const itemSalesAmount = this.parseAmount(
      this.pickField(row, [
        '商品売上',
        '商品の売上',
        'product sales',
        'item price',
        'item-price',
        'principal',
        '売上',
        '金額',
      ]),
    );

    const itemSalesTaxAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          '商品売上の税',
          '商品の売上税',
          'item tax',
          'principal tax',
        ]),
      ),
    );

    const shippingAmount =
      this.parseAmount(this.pickField(row, ['配送料', '送料', 'shipping', 'shipping credits'])) +
      this.parseAmount(this.pickField(row, ['ギフト包装料', 'ギフト包装', 'gift wrap', 'giftwrap']));

    const shippingTaxAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          '配送料の税金',
          '配送料の税',
          '送料税',
          'shipping tax',
          'shipping-tax',
          'shipping_tax',
        ]),
      ),
    );

    const promotionDiscountAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          'プロモーション割引額',
          'プロモーション割引金額',
          'プロモーション割引',
          'Amazonポイントの費用',
        ]),
      ),
    );

    const promotionDiscountTaxAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          'プロモーション割引の税金',
          'プロモーション割引の税',
        ]),
      ),
    );

    const commissionFeeAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          '手数料',
          '売上にかかる取引手数料',
          '販売手数料',
          '出品手数料',
          'Amazon出品サービスの料金',
          'referral fee',
          'selling fees',
          'commission fee',
          'selling fee',
        ]),
      ),
    );

    const fbaFeeAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          'FBA 手数料',
          'FBA手数料',
          'fba fee',
          'fba fees',
          'fulfillment fee',
          'fulfillment fees',
          'fulfilment fee',
          'fulfilment fees',
        ]),
      ),
    );

    const grossAmount = itemSalesAmount;
    const taxAmount = itemSalesTaxAmount;
    const promotionAmount = promotionDiscountAmount;
    const feeAmount = commissionFeeAmount + fbaFeeAmount;

    let netAmount = signedAmount;

    if (kind === 'ORDER_SALE') {
      netAmount =
        signedAmount !== 0
          ? signedAmount
          : itemSalesAmount
              + itemSalesTaxAmount
              + shippingAmount
              + shippingTaxAmount
              - promotionDiscountAmount
              - promotionDiscountTaxAmount
              - commissionFeeAmount
              - fbaFeeAmount;
    }

    return {
      grossAmount,
      netAmount,
      feeAmount,
      taxAmount,
      shippingAmount,
      promotionAmount,

      itemSalesAmount,
      itemSalesTaxAmount,
      shippingTaxAmount,
      promotionDiscountAmount,
      promotionDiscountTaxAmount,
      commissionFeeAmount,
      fbaFeeAmount,
    };
  }

  private looksLikeOrderSaleRow(args: {
    row: Record<string, string>;
    transactionType: string;
    description: string;
    signedAmount: number;
  }): boolean {
    const t = String(args.transactionType || '').toLowerCase();
    const d = String(args.description || '').toLowerCase();

    const grossSales = this.parseAmazonOrderRevenue(args.row);
    const shippingTax = this.parseAmount(
      this.pickField(args.row, ['商品売上の税', '配送料の税', 'ギフト包装の税', '税金', 'tax', 'taxes']),
    );
    const feeLikeAmount = this.parseAmount(
      this.pickField(args.row, [
        '売上にかかる取引手数料',
        '販売手数料',
        '出品手数料',
        'Amazon出品サービスの料金',
        'referral fee',
        'selling fees',
        'FBA手数料',
        'fba fees',
        'fulfillment fees',
        'トランザクションのその他',
        'その他各種手数料',
        'other transaction fees',
      ]),
    );

    const hasFeeKeywords =
      t.includes('広告') ||
      d.includes('広告') ||
      t.includes('storage') ||
      d.includes('storage') ||
      t.includes('保管') ||
      d.includes('保管') ||
      t.includes('倉庫') ||
      d.includes('倉庫') ||
      t.includes('subscription') ||
      d.includes('subscription') ||
      t.includes('月額') ||
      d.includes('月額') ||
      t.includes('登録料') ||
      d.includes('登録料') ||
      t.includes('fba') ||
      d.includes('fba') ||
      t.includes('フルフィルメント') ||
      d.includes('フルフィルメント') ||
      t.includes('販売手数料') ||
      d.includes('販売手数料') ||
      t.includes('手数料') ||
      d.includes('手数料') ||
      t.includes('refund') ||
      d.includes('refund') ||
      t.includes('返品') ||
      d.includes('返品') ||
      t.includes('返金') ||
      d.includes('返金') ||
      t.includes('tax') ||
      d.includes('tax') ||
      t.includes('税') ||
      d.includes('税') ||
      t.includes('payout') ||
      d.includes('payout') ||
      t.includes('disbursement') ||
      d.includes('disbursement') ||
      t.includes('transfer') ||
      d.includes('transfer') ||
      t.includes('アカウントへ') ||
      d.includes('アカウントへ') ||
      t.includes('adjustment') ||
      d.includes('adjustment') ||
      t.includes('調整') ||
      d.includes('調整') ||
      t.includes('claim') ||
      d.includes('claim') ||
      t.includes('chargeback') ||
      d.includes('chargeback');

    if (hasFeeKeywords) return false;

    const hasOrderToken =
      t.includes('注文') ||
      t.includes('order') ||
      d.includes('注文') ||
      d.includes('order');

    return grossSales > 0 || (hasOrderToken && feeLikeAmount === 0 && shippingTax >= 0);
  }

  private classifyAmazonChargeKind(args: {
    row: Record<string, string>;
    transactionType: string;
    description: string;
    orderId: string;
    sku: string;
    productName: string;
    quantity: number;
    signedAmount: number;
  }): AmazonTransactionChargeKind {
    const t = String(args.transactionType || '').toLowerCase();
    const d = String(args.description || '').toLowerCase();

    const has = (...keywords: string[]) =>
      keywords.some((k) => t.includes(k) || d.includes(k));

    if (has('広告', 'ads', 'advertising', 'タイムセールのパフォーマンスに基づく手数料')) return 'AD_FEE';
    if (has('月額登録料', 'subscription', '月額', '登録料')) return 'SUBSCRIPTION_FEE';
    if (has('保管', 'storage', '倉庫', '在庫保管', '保管手数料')) return 'STORAGE_FEE';
    if (has('fba', 'フルフィルメント', '販売手数料', '手数料')) return 'FBA_FEE';
    if (has('税', 'tax')) return 'TAX';
    if (has('振込', 'disbursement', 'payout', 'transfer', 'アカウントへ')) return 'PAYOUT';
    if (has('調整', 'adjustment', 'chargeback', 'claim', '返金', 'refund', '返品')) return 'ADJUSTMENT';
    if (this.looksLikeOrderSaleRow(args)) return 'ORDER_SALE';
    return 'OTHER';
  }

  private parseAmazonStoreOrdersCsv(filename: string, csvText: string): AmazonPreviewResult {
    const normalized = String(csvText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    if (!normalized) {
      throw new Error('csvText is empty');
    }

    const lines = normalized
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('CSV must include header and at least one data row');
    }

    let headerIndex = -1;
    let delimiterKind: 'comma' | 'tab' = 'comma';
    let delimiterChar = ',';
    let headerCells: string[] = [];
    let normalizedHeaders: string[] = [];

    const expectedHeaderAliases = [
      'amazon-order-id',
      'order-id',
      'order id',
      '注文番号',
      '注文id',
      'purchase-date',
      'order-date',
      '日付',
      '日付/時間',
      '商品名',
      'item-name',
      'product-name',
      'sku',
      'seller-sku',
      '数量',
      'quantity',
      'トランザクション種別',
      'transaction type',
      '説明',
      'description',
      '合計',
      'total',
    ].map((x) => this.normalizeHeader(x));

    for (let i = 0; i < Math.min(lines.length, 20); i += 1) {
      const probeDelimiterKind = this.detectDelimiter(lines[i]);
      const probeDelimiterChar = probeDelimiterKind === 'tab' ? '\t' : ',';
      const probeHeaderCells = this.splitDelimitedLine(lines[i], probeDelimiterChar);
      const probeNormalizedHeaders = probeHeaderCells.map((x) => this.normalizeHeader(x));

      const score = probeNormalizedHeaders.filter((x) => expectedHeaderAliases.includes(x)).length;
      if (score >= 2) {
        headerIndex = i;
        delimiterKind = probeDelimiterKind;
        delimiterChar = probeDelimiterChar;
        headerCells = probeHeaderCells;
        normalizedHeaders = probeNormalizedHeaders;
        break;
      }
    }

    if (headerIndex < 0) {
      throw new Error('Could not detect a valid Amazon CSV header row');
    }

    const rawRows: AmazonPreviewRawRow[] = [];
    const facts: AmazonPreviewFact[] = [];
    const charges: AmazonTransactionCharge[] = [];

    const chargeSummary: AmazonTransactionChargeSummary = {
      orderSale: 0,
      adFee: 0,
      storageFee: 0,
      subscriptionFee: 0,
      fbaFee: 0,
      tax: 0,
      payout: 0,
      adjustment: 0,
      other: 0,
    };

    let totalAmount = 0;
    let totalQuantity = 0;
    let failedRows = 0;

    for (let i = headerIndex + 1; i < lines.length; i += 1) {
      const cells = this.splitDelimitedLine(lines[i], delimiterChar);
      const headerToValue: Record<string, string> = {};
      const headerOriginalToValue: Record<string, string> = {};

      for (let j = 0; j < normalizedHeaders.length; j += 1) {
        headerToValue[normalizedHeaders[j]] = cells[j] ?? '';
        headerOriginalToValue[headerCells[j] ?? `col_${j + 1}`] = cells[j] ?? '';
      }

      const rowNo = i;
      rawRows.push({
        rowNo,
        fields: headerOriginalToValue,
      });

      const transactionType = this.pickField(headerToValue, [
        'トランザクション種別',
        'トランザクションの種類',
        '取引タイプ',
        '取引種別',
        'transaction type',
        'transaction type description',
        'type',
      ]);

      const description = this.pickField(headerToValue, [
        '説明',
        '明細',
        '内容',
        'description',
        'details',
      ]);

      const orderId = this.pickField(headerToValue, [
        'amazon-order-id',
        'order-id',
        'order id',
        '注文番号',
        '注文id',
        '注文',
      ]);

      const orderDate = this.pickField(headerToValue, [
        'purchase-date',
        'order-date',
        'purchase date',
        'order date',
        '注文日',
        '日付',
        '日付/時間',
        '日時',
        'posted-date',
        'posted date',
      ]);

      const sku = this.pickField(headerToValue, [
        'sku',
        'seller-sku',
        'merchant-sku',
        '商品sku',
      ]);

      const productName = this.pickField(headerToValue, [
        'product-name',
        'item-name',
        'title',
        'product name',
        '商品名',
        '説明',
      ]);

      const quantity = this.parseQuantity(
        this.pickField(headerToValue, ['quantity', 'qty', '数量', '個数']),
      );

      const store = this.pickField(headerToValue, [
        'store',
        'marketplace',
        'store-name',
        '販売チャネル',
        '店舗',
      ]);

      const fulfillment = this.pickField(headerToValue, [
        'fulfillment-channel',
        'fulfillment',
        '配送チャネル',
        '発送区分',
        'フルフィルメント',
      ]);

      const signedAmount = this.parseSignedTotalAmount(headerToValue);
      const kind = this.classifyAmazonChargeKind({
        row: headerToValue,
        transactionType,
        description,
        orderId,
        sku,
        productName,
        quantity,
        signedAmount,
      });

      charges.push({
        id: `${rowNo}-${orderId || 'na'}-${sku || 'na'}-${kind}`,
        rowNo,
        occurredAt: orderDate || null,
        orderId: orderId || null,
        sku: sku || null,
        transactionType: transactionType || '-',
        description: description || '',
        kind,
        signedAmount,
      });

      if (kind === 'ORDER_SALE') chargeSummary.orderSale += signedAmount;
      else if (kind === 'AD_FEE') chargeSummary.adFee += signedAmount;
      else if (kind === 'STORAGE_FEE') chargeSummary.storageFee += signedAmount;
      else if (kind === 'SUBSCRIPTION_FEE') chargeSummary.subscriptionFee += signedAmount;
      else if (kind === 'FBA_FEE') chargeSummary.fbaFee += signedAmount;
      else if (kind === 'TAX') chargeSummary.tax += signedAmount;
      else if (kind === 'PAYOUT') chargeSummary.payout += signedAmount;
      else if (kind === 'ADJUSTMENT') chargeSummary.adjustment += signedAmount;
      else chargeSummary.other += signedAmount;

      const isOrderLike = kind === 'ORDER_SALE';

      if (isOrderLike && (orderId || sku || productName)) {
        const bridge = this.parseAmazonBridgeAmounts(headerToValue, kind, signedAmount);

        const fact: AmazonPreviewFact = {
          rowNo,
          orderId,
          orderDate: orderDate || null,
          sku,
          productName,
          quantity,
          amount: bridge.grossAmount,
          grossAmount: bridge.grossAmount,
          netAmount: bridge.netAmount,
          feeAmount: bridge.feeAmount,
          taxAmount: bridge.taxAmount,
          shippingAmount: bridge.shippingAmount,
          promotionAmount: bridge.promotionAmount,

          itemSalesAmount: bridge.itemSalesAmount,
          itemSalesTaxAmount: bridge.itemSalesTaxAmount,
          shippingTaxAmount: bridge.shippingTaxAmount,
          promotionDiscountAmount: bridge.promotionDiscountAmount,
          promotionDiscountTaxAmount: bridge.promotionDiscountTaxAmount,
          commissionFeeAmount: bridge.commissionFeeAmount,
          fbaFeeAmount: bridge.fbaFeeAmount,

          rawTransactionType: transactionType || null,
          signedAmount,
          description: description || null,
          store: store || null,
          fulfillment: fulfillment || null,
          rawLabel: productName || sku || orderId || '注文',
        };

        facts.push(fact);
        totalAmount += bridge.grossAmount;
        totalQuantity += quantity;
      }

      if (
        !transactionType &&
        !description &&
        !orderId &&
        !sku &&
        !productName &&
        signedAmount === 0
      ) {
        failedRows += 1;
      }
    }

    return {
      summary: {
        filename,
        totalRows: rawRows.length,
        successRows: facts.length,
        failedRows,
        totalAmount,
        totalQuantity,
        delimiter: delimiterKind,
        headers: headerCells,
      },
      rawRows,
      facts,
      charges,
      chargeSummary,
    };
  }

  private async resolveCompanyId(explicitCompanyId?: string): Promise<string> {
    const normalized = String(explicitCompanyId || '').trim();
    if (normalized) return normalized;

    const firstCompany = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!firstCompany?.id) {
      throw new NotFoundException('No company found for imports');
    }

    return firstCompany.id;
  }

  private normalizeBusinessMonth(raw?: string | null): string | null {
    const value = String(raw || '').trim();
    if (!value) return null;

    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) {
      return `${direct.getFullYear()}-${String(direct.getMonth() + 1).padStart(2, '0')}`;
    }

    const match = value.match(/(20\d{2})[\/\-.年]?\s*(0?[1-9]|1[0-2])/);
    if (!match) return null;

    return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}`;
  }

  private hashPayload(parts: Array<string | number | null | undefined>): string {
    const raw = parts.map((x) => String(x ?? '')).join('|');
    return createHash('sha256').update(raw).digest('hex');
  }

  private buildStoreOrderDedupeHash(companyId: string, fact: AmazonPreviewFact): string {
    return this.hashPayload([
      companyId,
      'store-orders',
      fact.orderId,
      fact.sku,
      this.normalizeBusinessMonth(fact.orderDate),
      fact.grossAmount,
      fact.quantity,
      fact.rawTransactionType,
    ]);
  }

  private buildStoreOperationDedupeHash(companyId: string, charge: AmazonTransactionCharge): string {
    return this.hashPayload([
      companyId,
      'store-operation',
      this.normalizeBusinessMonth(charge.occurredAt),
      charge.kind,
      charge.transactionType,
      charge.orderId,
      charge.sku,
      charge.signedAmount,
      charge.description,
    ]);
  }

  private buildStoreOrderPreviewRows(args: {
    companyId: string;
    facts: AmazonPreviewFact[];
    conflictMonths: string[];
    existingHashSet: Set<string>;
    policy: string;
  }): PreviewRowItem[] {
    const { companyId, facts, conflictMonths, existingHashSet, policy } = args;
    const conflictSet = new Set(conflictMonths);

    return facts.map((fact) => {
      const businessMonth = this.normalizeBusinessMonth(fact.orderDate);
      const dedupeHash = this.buildStoreOrderDedupeHash(companyId, fact);

      let matchStatus: PreviewRowItem['matchStatus'] = 'new';
      let matchReason = '';

      if (!businessMonth) {
        matchStatus = 'error';
        matchReason = 'businessMonth could not be derived from orderDate';
      } else if (conflictSet.has(businessMonth) && policy === 'skip_existing_months') {
        matchStatus = 'conflict';
        matchReason = 'month conflict detected and current policy skips existing months';
      } else if (
        existingHashSet.has(dedupeHash) &&
        !(conflictSet.has(businessMonth) && policy === 'replace_existing_months')
      ) {
        matchStatus = 'duplicate';
        matchReason = 'same dedupeHash already exists in Transaction';
      }

      return {
        rowNo: fact.rowNo,
        businessMonth,
        matchStatus,
        matchReason: matchReason || undefined,
        normalizedPayload: {
          entityType: 'transaction',
          module: 'store-orders',
          dedupeHash,
          orderId: fact.orderId,
          orderDate: fact.orderDate,
          sku: fact.sku,
          productName: fact.productName,
          quantity: fact.quantity,
          grossAmount: fact.grossAmount,
          netAmount: fact.netAmount,
          feeAmount: fact.feeAmount,
          taxAmount: fact.taxAmount,
          shippingAmount: fact.shippingAmount,
          promotionAmount: fact.promotionAmount,

          itemSalesAmount: fact.itemSalesAmount,
          itemSalesTaxAmount: fact.itemSalesTaxAmount,
          shippingTaxAmount: fact.shippingTaxAmount,
          promotionDiscountAmount: fact.promotionDiscountAmount,
          promotionDiscountTaxAmount: fact.promotionDiscountTaxAmount,
          commissionFeeAmount: fact.commissionFeeAmount,
          fbaFeeAmount: fact.fbaFeeAmount,

          rawTransactionType: fact.rawTransactionType,
          signedAmount: fact.signedAmount,
          description: fact.description,
          store: fact.store,
          fulfillment: fact.fulfillment,
          rawLabel: fact.rawLabel,
        },
      };
    });
  }

  private buildStoreOperationPreviewRows(args: {
    companyId: string;
    charges: AmazonTransactionCharge[];
    conflictMonths: string[];
    existingHashSet: Set<string>;
    policy: string;
  }): PreviewRowItem[] {
    const { companyId, charges, conflictMonths, existingHashSet, policy } = args;
    const conflictSet = new Set(conflictMonths);

    return charges
      .filter((charge) => charge.kind !== 'ORDER_SALE')
      .map((charge) => {
        const businessMonth = this.normalizeBusinessMonth(charge.occurredAt);
        const dedupeHash = this.buildStoreOperationDedupeHash(companyId, charge);

        let matchStatus: PreviewRowItem['matchStatus'] = 'new';
        let matchReason = '';

        if (!businessMonth) {
          matchStatus = 'error';
          matchReason = 'businessMonth could not be derived from occurredAt';
        } else if (conflictSet.has(businessMonth) && policy === 'skip_existing_months') {
          matchStatus = 'conflict';
          matchReason = 'month conflict detected and current policy skips existing months';
        } else if (
          existingHashSet.has(dedupeHash) &&
          !(conflictSet.has(businessMonth) && policy === 'replace_existing_months')
        ) {
          matchStatus = 'duplicate';
          matchReason = 'same dedupeHash already exists in Transaction';
        }

        return {
          rowNo: charge.rowNo,
          businessMonth,
          matchStatus,
          matchReason: matchReason || undefined,
          normalizedPayload: {
            entityType: 'transaction',
            module: 'store-operation',
            dedupeHash,
            occurredAt: charge.occurredAt,
            orderId: charge.orderId,
            sku: charge.sku,
            transactionType: charge.transactionType,
            description: charge.description,
            kind: charge.kind,
            signedAmount: charge.signedAmount,
          },
        };
      });
  }

  private async getExistingMonthStats(companyId: string, months: string[]) {
    if (months.length === 0) {
      return {
        existingMonths: [] as string[],
        conflictMonths: [] as string[],
        monthStats: [] as MonthStat[],
      };
    }

    const existingRows = await this.prisma.transaction.findMany({
      where: {
        companyId,
        businessMonth: {
          in: months,
        },
      },
      select: {
        businessMonth: true,
      },
    });

    const monthCountMap = new Map<string, number>();
    for (const row of existingRows) {
      const month = String(row.businessMonth || '').trim();
      if (!month) continue;
      monthCountMap.set(month, (monthCountMap.get(month) || 0) + 1);
    }

    const existingMonths = Array.from(monthCountMap.keys()).sort();
    const conflictMonths = months.filter((month) => monthCountMap.has(month));
    const monthStats = conflictMonths.map((month) => ({
      month,
      existingCount: monthCountMap.get(month) || 0,
    }));

    return {
      existingMonths,
      conflictMonths,
      monthStats,
    };
  }

  private normalizeJsonObject(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {};
    }
    return input as Record<string, unknown>;
  }

  private parseDateOrNow(raw?: string | null): Date {
    const value = String(raw || '').trim();
    if (!value) return new Date();

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const normalized = value.replace(/\s+JST$/i, '').trim();
    const m = normalized.match(
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      const day = Number(m[3]);
      const hour = Number(m[4] || '0');
      const minute = Number(m[5] || '0');
      const second = Number(m[6] || '0');

      const fallback = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(fallback.getTime())) {
        return fallback;
      }
    }

    return new Date();
  }

  private normalizeStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input.map((x) => String(x || '').trim()).filter(Boolean);
  }

  private includesKeyword(value: string, keywords: string[]) {
    const normalized = String(value || '').toLowerCase();
    return keywords.some((k) => normalized.includes(String(k).toLowerCase()));
  }

  private resolveImportDirection(args: {
    module: string;
    signedAmount: number;
  }): 'INCOME' | 'EXPENSE' {
    if (args.module === 'store-orders') {
      return 'INCOME';
    }
    return args.signedAmount >= 0 ? 'INCOME' : 'EXPENSE';
  }

  private resolveImportTransactionType(args: {
    module: string;
    kind: string;
    signedAmount: number;
  }): 'SALE' | 'FBA_FEE' | 'AD' | 'REFUND' | 'OTHER' {
    const kind = String(args.kind || '').toUpperCase();

    if (args.module === 'store-orders') {
      return 'SALE';
    }

    if (kind === 'AD_FEE') return 'AD';
    if (kind === 'FBA_FEE' || kind === 'STORAGE_FEE') return 'FBA_FEE';
    if (kind === 'ADJUSTMENT' && args.signedAmount < 0) return 'REFUND';

    return 'OTHER';
  }

  private resolveCategoryKeywords(args: {
    module: string;
    kind: string;
    direction: 'INCOME' | 'EXPENSE';
  }): string[] {
    const kind = String(args.kind || '').toUpperCase();

    if (args.module === 'store-orders') {
      return ['売上', 'sales', 'sale', '収入', 'amazon', 'store-order'];
    }

    if (args.direction === 'INCOME') {
      if (kind === 'PAYOUT') return ['入金', '振込', 'payout', '入帳'];
      if (kind === 'ADJUSTMENT') return ['調整', '返金', 'refund', '収入'];
      return ['収入', '入金', 'その他'];
    }

    if (kind === 'AD_FEE') return ['広告', 'ad', 'ads', 'advertising'];
    if (kind === 'FBA_FEE') return ['fba', '物流', '発送', '手数料', 'fulfillment'];
    if (kind === 'STORAGE_FEE') return ['保管', 'storage', '倉庫'];
    if (kind === 'SUBSCRIPTION_FEE') return ['月額', '登録料', 'subscription', 'platform'];
    if (kind === 'TAX') return ['税', 'tax'];
    if (kind === 'ADJUSTMENT') return ['調整', '返金', 'refund', '返品'];

    return ['その他', 'other', '雑費', '手数料'];
  }

  private async resolveImportAccountId(tx: Prisma.TransactionClient, args: {
    companyId: string;
    storeId: string;
    module: string;
    kind: string;
  }): Promise<string | null> {
    const accounts = await tx.account.findMany({
      where: {
        companyId: args.companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        storeId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!accounts.length) return null;

    const keywords =
      args.module === 'store-orders'
        ? ['amazon', '売上', '入金', '受取', 'payment', 'gateway', 'wallet']
        : ['amazon', '支払', '経費', '費用', 'payment', 'gateway', 'wallet', 'bank'];

    const scored = accounts.map((account) => {
      let score = 0;
      if (account.storeId === args.storeId) score += 5;
      if (!account.storeId) score += 2;

      const name = String(account.name || '');
      if (this.includesKeyword(name, keywords)) score += 5;

      const type = String(account.type || '').toUpperCase();
      if (type === 'PAYMENT_GATEWAY') score += 3;
      if (type === 'BANK') score += 2;
      if (type === 'EWALLET') score += 2;

      if (args.module === 'store-orders' && this.includesKeyword(name, ['amazon'])) score += 3;
      if (args.module === 'store-operation' && this.includesKeyword(name, ['amazon'])) score += 2;

      return {
        id: account.id,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.id || null;
  }

  private async resolveImportCategoryId(tx: Prisma.TransactionClient, args: {
    companyId: string;
    module: string;
    kind: string;
    direction: 'INCOME' | 'EXPENSE';
  }): Promise<string | null> {
    const categories = await tx.transactionCategory.findMany({
      where: {
        companyId: args.companyId,
        direction: args.direction as any,
      },
      select: {
        id: true,
        name: true,
        code: true,
        isSystem: true,
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    if (!categories.length) return null;

    const keywords = this.resolveCategoryKeywords(args);

    const scored = categories.map((category) => {
      let score = 0;
      const name = String(category.name || '');
      const code = String(category.code || '');

      if (this.includesKeyword(name, keywords)) score += 5;
      if (this.includesKeyword(code, keywords)) score += 4;
      if (category.isSystem) score += 1;

      return {
        id: category.id,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.id || null;
  }

  private buildImportMemoPrefix(module: string) {
    return `[imports:${String(module || '').trim()}]`;
  }

  private buildPreciseReplaceWhere(args: {
    companyId: string;
    module: string;
    months: string[];
  }): Prisma.TransactionWhereInput {
    const normalizedMonths = args.months
      .map((x) => String(x || '').trim())
      .filter(Boolean);

    return {
      companyId: args.companyId,
      businessMonth: {
        in: normalizedMonths,
      },
      sourceType: 'IMPORT' as any,
      sourceFileName: {
        not: null,
      },
      memo: {
        startsWith: this.buildImportMemoPrefix(args.module),
      },
      importJob: {
        is: {
          companyId: args.companyId,
          module: args.module,
        },
      },
    };
  }

  private async buildImportResultSummary(args: {
    companyId: string;
    importJobId: string;
    importedRows: number;
    duplicateRows: number;
    conflictRows: number;
    errorRows: number;
    deletedRows: number;
  }) {
    const job = await this.prisma.importJob.findFirst({
      where: {
        id: args.importJobId,
        companyId: args.companyId,
      },
      select: {
        id: true,
        module: true,
        filename: true,
        fileMonthsJson: true,
        conflictMonthsJson: true,
        createdAt: true,
        importedAt: true,
      },
    });

    const stagingRows = await this.prisma.importStagingRow.findMany({
      where: {
        importJobId: args.importJobId,
      },
      select: {
        id: true,
        rowNo: true,
        businessMonth: true,
        matchStatus: true,
        normalizedPayloadJson: true,
      },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        companyId: args.companyId,
        importJobId: args.importJobId,
      },
      select: {
        id: true,
        amount: true,
        direction: true,
        type: true,
        businessMonth: true,
        accountId: true,
        categoryId: true,
        storeId: true,
      },
    });

    const fileMonths = this.normalizeStringArray(job?.fileMonthsJson);
    const conflictMonths = this.normalizeStringArray(job?.conflictMonthsJson);

    const importedMonths = Array.from(
      new Set(
        transactions
          .map((x) => String(x.businessMonth || '').trim())
          .filter(Boolean),
      ),
    ).sort();

    const stagingStatusCounts = {
      newRows: stagingRows.filter((x) => x.matchStatus === 'new').length,
      duplicateRows: stagingRows.filter((x) => x.matchStatus === 'duplicate').length,
      conflictRows: stagingRows.filter((x) => x.matchStatus === 'conflict').length,
      errorRows: stagingRows.filter((x) => x.matchStatus === 'error').length,
    };

    const amazonDetailSummary = stagingRows.reduce(
      (acc, row) => {
        const payload = this.normalizeJsonObject(row.normalizedPayloadJson);
        acc.itemSalesAmount += Number(payload.itemSalesAmount || 0);
        acc.itemSalesTaxAmount += Number(payload.itemSalesTaxAmount || 0);
        acc.shippingAmount += Number(payload.shippingAmount || 0);
        acc.shippingTaxAmount += Number(payload.shippingTaxAmount || 0);
        acc.promotionDiscountAmount += Number(payload.promotionDiscountAmount || 0);
        acc.promotionDiscountTaxAmount += Number(payload.promotionDiscountTaxAmount || 0);
        acc.commissionFeeAmount += Number(payload.commissionFeeAmount || 0);
        acc.fbaFeeAmount += Number(payload.fbaFeeAmount || 0);
        return acc;
      },
      {
        itemSalesAmount: 0,
        itemSalesTaxAmount: 0,
        shippingAmount: 0,
        shippingTaxAmount: 0,
        promotionDiscountAmount: 0,
        promotionDiscountTaxAmount: 0,
        commissionFeeAmount: 0,
        fbaFeeAmount: 0,
      },
    );

    const directionBreakdown = {
      incomeCount: transactions.filter((x) => x.direction === 'INCOME').length,
      expenseCount: transactions.filter((x) => x.direction === 'EXPENSE').length,
      transferCount: transactions.filter((x) => x.direction === 'TRANSFER').length,
    };

    const typeBreakdownMap = new Map<string, { count: number; amount: number }>();
    for (const tx of transactions) {
      const key = String(tx.type || 'OTHER');
      const current = typeBreakdownMap.get(key) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(tx.amount || 0);
      typeBreakdownMap.set(key, current);
    }

    const byType = Array.from(typeBreakdownMap.entries())
      .map(([type, value]) => ({
        type,
        count: value.count,
        amount: value.amount,
      }))
      .sort((a, b) => b.count - a.count);

    const monthBreakdownMap = new Map<string, { count: number; amount: number }>();
    for (const tx of transactions) {
      const key = String(tx.businessMonth || '').trim() || '-';
      const current = monthBreakdownMap.get(key) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(tx.amount || 0);
      monthBreakdownMap.set(key, current);
    }

    const byMonth = Array.from(monthBreakdownMap.entries())
      .map(([month, value]) => ({
        month,
        count: value.count,
        amount: value.amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const coverage = {
      withAccountCount: transactions.filter((x) => !!x.accountId).length,
      withCategoryCount: transactions.filter((x) => !!x.categoryId).length,
      distinctStoreCount: Array.from(
        new Set(transactions.map((x) => String(x.storeId || '').trim()).filter(Boolean)),
      ).length,
    };

    const totalCommittedAmount = transactions.reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0,
    );

    return {
      importJobId: args.importJobId,
      module: job?.module || null,
      filename: job?.filename || null,
      createdAt: job?.createdAt || null,
      importedAt: job?.importedAt || null,

      months: {
        fileMonths,
        conflictMonths,
        importedMonths,
      },

      staging: {
        totalRows: stagingRows.length,
        ...stagingStatusCounts,
      },

      amazonOrderDetails: amazonDetailSummary,

      commit: {
        importedRows: args.importedRows,
        duplicateRows: args.duplicateRows,
        conflictRows: args.conflictRows,
        errorRows: args.errorRows,
        deletedRows: args.deletedRows,
      },

      transactions: {
        committedCount: transactions.length,
        totalCommittedAmount,
        ...directionBreakdown,
        byType,
        byMonth,
      },

      coverage,

      integrity: {
        importedRowsMatchesCommittedCount: args.importedRows === transactions.length,
      },
    };
  }

  async previewCashIncomeImport(dto: CashIncomePreviewDto) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const companyId = String(dto.companyId || '').trim();

    const normalizeCashAccountName = (value: string) =>
      String(value || '')
        .normalize('NFKC')
        .trim()
        .toLowerCase()
        .replace(/[\s\u3000（）()\[\]【】「」『』・_\-\/\\.]/g, '');

    const accounts = companyId
      ? await this.prisma.account.findMany({
          where: {
            companyId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            type: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      : [];

    const cashAccounts = accounts.filter((account) => account.type === 'CASH');
    const accountByExactName = new Map(
      accounts.map((account) => [String(account.name || '').trim(), account.id]),
    );

    const resolveAccount = (accountName: string) => {
      const normalizedInput = normalizeCashAccountName(accountName);

      if (!accountName) {
        return {
          accountId: null,
          matchMode: 'unresolved' as const,
        };
      }

      const exactAccountId = accountByExactName.get(accountName);
      if (exactAccountId) {
        return {
          accountId: exactAccountId,
          matchMode: 'exact_name' as const,
        };
      }

      if (companyId && normalizedInput) {
        const normalizedFallback = accounts.find((account) => {
          const normalizedAccountName = normalizeCashAccountName(account.name);
          if (!normalizedAccountName) return false;

          return (
            normalizedAccountName === normalizedInput ||
            normalizedAccountName.includes(normalizedInput) ||
            normalizedInput.includes(normalizedAccountName)
          );
        });

        if (normalizedFallback?.id) {
          return {
            accountId: normalizedFallback.id,
            matchMode: 'cash_fallback' as const,
          };
        }

        const inputLooksCash =
          normalizedInput.includes('現金') ||
          normalizedInput.includes('cash') ||
          normalizedInput.includes('genkin');

        if (inputLooksCash && cashAccounts.length === 1) {
          return {
            accountId: cashAccounts[0].id,
            matchMode: 'cash_fallback' as const,
          };
        }
      }

      return {
        accountId: null,
        matchMode: 'unresolved' as const,
      };
    };

    const previewRows = rows.map((row, index) => {
      const rowNo = Number(row.rowNo || index + 1);
      const accountName = String(row.accountName || '').trim();
      const amount = Number(row.amount || 0);
      const occurredAt = String(row.occurredAt || '').trim();
      const memoRaw = String(row.memo || '').trim();
      const source = String(row.source || '').trim();

      const messages: string[] = [];

      if (!accountName) messages.push('accountName is required');
      if (!Number.isFinite(amount) || amount <= 0) {
        messages.push('amount must be greater than 0');
      }
      if (!occurredAt) {
        messages.push('occurredAt is required');
      } else if (Number.isNaN(new Date(occurredAt).getTime())) {
        messages.push('occurredAt is not parseable');
      }
      if (!memoRaw) messages.push('memo is recommended');

      const hasError = messages.some((msg) =>
        msg.includes('required') ||
        msg.includes('greater than 0') ||
        msg.includes('not parseable'),
      );

      const accountResolution = resolveAccount(accountName);
      const accountId = accountResolution.accountId;
      const matchMode = accountResolution.matchMode;

      if (companyId && accountName && !accountId && !hasError) {
        messages.push('accountName could not be resolved');
      }

      const matchStatus = hasError
        ? 'error'
        : messages.length > 0
          ? 'warning'
          : 'pending';

      return {
        rowNo,
        matchStatus,
        matchReason: messages.length ? messages.join(' / ') : undefined,
        accountResolution: {
          strategy: 'exact_name_then_cash_fallback',
          matchMode,
          accountName,
          accountId,
        },
        normalizedPayload: {
          entityType: 'transaction',
          module: 'cash-income',
          type: 'OTHER',
          direction: 'INCOME',
          amount,
          occurredAt,
          accountName,
          accountId,
          categoryId: null,
          memo: `[cash] ${memoRaw}`.trim(),
          source: source || undefined,
          cashMarker: '[cash]',
        },
      };
    });

    const summary = previewRows.reduce(
      (acc, row) => {
        acc.totalRows += 1;

        if (row.matchStatus === 'error') {
          acc.errorRows += 1;
          return acc;
        }

        if (row.matchStatus === 'warning') {
          acc.warningRows += 1;
        }

        acc.pendingRows += 1;
        acc.totalPendingAmount += Number(row.normalizedPayload.amount || 0);
        return acc;
      },
      {
        totalRows: 0,
        pendingRows: 0,
        errorRows: 0,
        warningRows: 0,
        totalPendingAmount: 0,
      },
    );

    return {
      ok: true,
      action: 'cash-income-preview',
      module: 'cash-income',
      companyId: companyId || null,
      filename: dto.filename || null,
      summary,
      rows: previewRows,
      accountResolution: {
        strategy: 'exact_name_then_cash_fallback',
        activeAccountCount: accounts.length,
        activeCashAccountCount: cashAccounts.length,
      },
      message:
        'Cash income preview contract only. Account exact-name and cash fallback resolution are enabled when companyId is provided. DB write and transaction commit are not connected yet.',
    };
  }

  async commitCashIncomeContract(dto: CashIncomeCommitDto) {
    const companyId = String(dto.companyId || '').trim();
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const filename = String(dto.filename || 'cash-income.csv').trim();

    const blockedReasons: string[] = [];

    if (!companyId) {
      blockedReasons.push('companyId is required');
    }

    if (!rows.length) {
      blockedReasons.push('rows are required');
    }

    const defaultStore = companyId
      ? await this.prisma.store.findFirst({
          where: {
            companyId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            name: true,
          },
        })
      : null;

    if (companyId && !defaultStore?.id) {
      blockedReasons.push('storeId could not be resolved');
    }

    const requestedAccountIds = rows
      .map((row) => String(row.normalizedPayload?.accountId || '').trim())
      .filter(Boolean);

    const activeAccounts = companyId && requestedAccountIds.length
      ? await this.prisma.account.findMany({
          where: {
            companyId,
            id: {
              in: Array.from(new Set(requestedAccountIds)),
            },
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : [];

    const activeAccountIdSet = new Set(activeAccounts.map((account) => account.id));

    const plannedRows = rows.map((row, index) => {
      const payload = row.normalizedPayload || {};
      const rowNo = Number(row.rowNo || index + 1);
      const amount = Number(payload.amount || 0);
      const occurredAt = String(payload.occurredAt || '').trim();
      const accountId = String(payload.accountId || '').trim();
      const memo = String(payload.memo || '').trim();
      const type = String(payload.type || '').trim();
      const direction = String(payload.direction || '').trim();
      const module = String(payload.module || '').trim();
      const cashMarker = String(payload.cashMarker || '').trim();
      const source = String(payload.source || '').trim();

      const rowReasons: string[] = [];

      if (String(row.matchStatus || '') === 'error') {
        rowReasons.push('row matchStatus is error');
      }
      if (!accountId) {
        rowReasons.push('accountId is required');
      } else if (!activeAccountIdSet.has(accountId)) {
        rowReasons.push('accountId could not be resolved in company');
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        rowReasons.push('amount must be greater than 0');
      }
      if (!occurredAt) {
        rowReasons.push('occurredAt is required');
      } else if (Number.isNaN(new Date(occurredAt).getTime())) {
        rowReasons.push('occurredAt is not parseable');
      }
      if (type !== 'OTHER') rowReasons.push('type must be OTHER');
      if (direction !== 'INCOME') rowReasons.push('direction must be INCOME');
      if (module !== 'cash-income') rowReasons.push('module must be cash-income');
      if (payload.categoryId !== null) rowReasons.push('categoryId must be null');
      if (!memo.startsWith('[cash]')) rowReasons.push('memo must start with [cash]');
      if (cashMarker !== '[cash]') rowReasons.push('cashMarker must be [cash]');

      const dedupeHash = this.hashPayload([
        companyId,
        'cash-income',
        rowNo,
        accountId,
        amount,
        occurredAt,
        memo,
        source,
      ]);

      return {
        rowNo,
        commitReady: rowReasons.length === 0,
        blockedReasons: rowReasons,
        normalizedPayload: {
          entityType: 'transaction',
          module: 'cash-income',
          type: 'OTHER',
          direction: 'INCOME',
          sourceType: 'IMPORT',
          companyId,
          storeId: defaultStore?.id || null,
          accountId: accountId || null,
          categoryId: null,
          amount,
          currency: 'JPY',
          occurredAt,
          memo,
          source: source || undefined,
          sourceFileName: filename,
          sourceRowNo: rowNo,
          businessMonth: this.normalizeBusinessMonth(occurredAt),
          dedupeHash,
        },
      };
    });

    const rowBlockedReasons = plannedRows.flatMap((row) =>
      row.blockedReasons.map((reason) => `row ${row.rowNo}: ${reason}`),
    );

    const allBlockedReasons = [...blockedReasons, ...rowBlockedReasons];
    const canCommit =
      allBlockedReasons.length === 0 &&
      plannedRows.length > 0 &&
      plannedRows.every((row) => row.commitReady);

    if (!canCommit) {
      return {
        ok: true,
        action: 'cash-income-commit',
        module: 'cash-income',
        companyId: companyId || null,
        filename,
        commitReady: false,
        commitExecuted: false,
        blockedReasons: allBlockedReasons,
        importedRows: 0,
        duplicateRows: 0,
        blockedRows: plannedRows.filter((row) => !row.commitReady).length,
        createdTransactionIds: [],
        summary: {
          totalRows: rows.length,
          readyRows: plannedRows.filter((row) => row.commitReady).length,
          blockedRows: plannedRows.filter((row) => !row.commitReady).length,
          totalReadyAmount: plannedRows
            .filter((row) => row.commitReady)
            .reduce((sum, row) => sum + Number(row.normalizedPayload.amount || 0), 0),
          importedRows: 0,
          duplicateRows: 0,
          totalImportedAmount: 0,
        },
        storeResolution: {
          strategy: 'first_company_store',
          storeId: defaultStore?.id || null,
          storeName: defaultStore?.name || null,
        },
        rows: plannedRows.map((row) => ({
          ...row,
          commitStatus: row.commitReady ? 'ready' : 'blocked',
          transactionId: null,
          existingTransactionId: null,
        })),
        message:
          'Cash income commit blocked. Fix validation errors before creating transactions.',
      };
    }

    const committedRows: Array<{
      rowNo: number;
      commitStatus: 'imported' | 'duplicate';
      transactionId: string | null;
      existingTransactionId: string | null;
      normalizedPayload: (typeof plannedRows)[number]['normalizedPayload'];
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const row of plannedRows) {
        const payload = row.normalizedPayload;

        const existing = await tx.transaction.findFirst({
          where: {
            companyId,
            dedupeHash: payload.dedupeHash,
          },
          select: {
            id: true,
          },
        });

        if (existing?.id) {
          committedRows.push({
            rowNo: row.rowNo,
            commitStatus: 'duplicate',
            transactionId: null,
            existingTransactionId: existing.id,
            normalizedPayload: payload,
          });
          continue;
        }

        const created = await tx.transaction.create({
          data: {
            companyId,
            storeId: String(payload.storeId),
            accountId: String(payload.accountId),
            categoryId: null,
            type: 'OTHER',
            direction: 'INCOME',
            sourceType: 'IMPORT',
            amount: Number(payload.amount || 0),
            currency: 'JPY',
            occurredAt: new Date(String(payload.occurredAt)),
            externalRef: payload.source ? `cash-source:${String(payload.source)}` : null,
            memo: String(payload.memo || ''),
            businessMonth: payload.businessMonth || this.normalizeBusinessMonth(payload.occurredAt),
            dedupeHash: String(payload.dedupeHash || ''),
            sourceFileName: filename,
            sourceRowNo: Number(payload.sourceRowNo || row.rowNo),
          },
          select: {
            id: true,
          },
        });

        committedRows.push({
          rowNo: row.rowNo,
          commitStatus: 'imported',
          transactionId: created.id,
          existingTransactionId: null,
          normalizedPayload: payload,
        });
      }
    });

    const importedRows = committedRows.filter((row) => row.commitStatus === 'imported');
    const duplicateRows = committedRows.filter((row) => row.commitStatus === 'duplicate');
    const totalImportedAmount = importedRows.reduce(
      (sum, row) => sum + Number(row.normalizedPayload.amount || 0),
      0,
    );

    return {
      ok: true,
      action: 'cash-income-commit',
      module: 'cash-income',
      companyId,
      filename,
      commitReady: true,
      commitExecuted: true,
      blockedReasons: [],
      importedRows: importedRows.length,
      duplicateRows: duplicateRows.length,
      blockedRows: 0,
      createdTransactionIds: importedRows
        .map((row) => row.transactionId)
        .filter(Boolean),
      summary: {
        totalRows: rows.length,
        readyRows: plannedRows.length,
        blockedRows: 0,
        totalReadyAmount: plannedRows.reduce(
          (sum, row) => sum + Number(row.normalizedPayload.amount || 0),
          0,
        ),
        importedRows: importedRows.length,
        duplicateRows: duplicateRows.length,
        totalImportedAmount,
      },
      storeResolution: {
        strategy: 'first_company_store',
        storeId: defaultStore?.id || null,
        storeName: defaultStore?.name || null,
      },
      rows: plannedRows.map((row) => {
        const committed = committedRows.find((item) => item.rowNo === row.rowNo);
        return {
          ...row,
          commitStatus: committed?.commitStatus || 'blocked',
          transactionId: committed?.transactionId || null,
          existingTransactionId: committed?.existingTransactionId || null,
        };
      }),
      message:
        'Cash income transactions committed. Duplicate rows are skipped by dedupeHash.',
    };
  }


  async detectMonthConflicts(dto: DetectMonthConflictsDto) {
    const companyId = await this.resolveCompanyId(dto.companyId);
    const filename = String(dto.filename || 'import-preview.csv');
    const csvText = String(dto.csvText || '');
    const module = dto.module || 'store-orders';
    const sourceType = dto.sourceType || 'amazon-csv';

    const parsed = this.parseAmazonStoreOrdersCsv(filename, csvText);

    const candidateMonths =
      module === 'store-operation'
        ? parsed.charges
            .filter((x) => x.kind !== 'ORDER_SALE')
            .map((x) => this.normalizeBusinessMonth(x.occurredAt))
        : parsed.facts.map((x) => this.normalizeBusinessMonth(x.orderDate));

    const fileMonths = Array.from(
      new Set(candidateMonths.filter((x): x is string => !!x)),
    ).sort();

    const stats = await this.getExistingMonthStats(companyId, fileMonths);

    return {
      ok: true,
      action: 'detect-month-conflicts',
      module,
      companyId,
      sourceType,
      fileMonths,
      existingMonths: stats.existingMonths,
      conflictMonths: stats.conflictMonths,
      hasConflict: stats.conflictMonths.length > 0,
      monthStats: stats.monthStats,
      message:
        stats.conflictMonths.length > 0
          ? 'month conflicts detected from parsed business dates'
          : 'no month conflicts detected from parsed business dates',
    };
  }

  async previewImport(dto: PreviewImportDto) {
    const companyId = await this.resolveCompanyId(dto.companyId);
    const filename = String(dto.filename || 'import-preview.csv');
    const csvText = String(dto.csvText || '');
    const module = dto.module || 'store-orders';
    const sourceType = dto.sourceType || 'amazon-csv';
    const monthConflictPolicy = dto.monthConflictPolicy || 'skip_existing_months';

    const detect = await this.detectMonthConflicts({
      companyId,
      filename,
      csvText,
      workbookBase64: dto.workbookBase64,
      module,
      sourceType,
    });

    const parsed = this.parseAmazonStoreOrdersCsv(filename, csvText);

    const allHashes =
      module === 'store-operation'
        ? parsed.charges
            .filter((x) => x.kind !== 'ORDER_SALE')
            .map((x) => this.buildStoreOperationDedupeHash(companyId, x))
        : parsed.facts.map((x) => this.buildStoreOrderDedupeHash(companyId, x));

    const existingTransactions = allHashes.length
      ? await this.prisma.transaction.findMany({
          where: {
            companyId,
            dedupeHash: {
              in: allHashes,
            },
          },
          select: {
            dedupeHash: true,
          },
        })
      : [];

    const existingHashSet = new Set(
      existingTransactions
        .map((x) => String(x.dedupeHash || '').trim())
        .filter(Boolean),
    );

    const previewRows =
      module === 'store-operation'
        ? this.buildStoreOperationPreviewRows({
            companyId,
            charges: parsed.charges,
            conflictMonths: detect.conflictMonths,
            existingHashSet,
            policy: String(monthConflictPolicy),
          })
        : this.buildStoreOrderPreviewRows({
            companyId,
            facts: parsed.facts,
            conflictMonths: detect.conflictMonths,
            existingHashSet,
            policy: String(monthConflictPolicy),
          });

    const summary = {
      totalRows: previewRows.length,
      validRows: previewRows.filter((x) => x.matchStatus !== 'error').length,
      newRows: previewRows.filter((x) => x.matchStatus === 'new').length,
      duplicateRows: previewRows.filter((x) => x.matchStatus === 'duplicate').length,
      conflictRows: previewRows.filter((x) => x.matchStatus === 'conflict').length,
      errorRows: previewRows.filter((x) => x.matchStatus === 'error').length,
    };

    const created = await this.prisma.importJob.create({
      data: {
        companyId,
        domain: module,
        module,
        sourceType,
        filename,
        fileHash: null,
        status: 'PENDING',
        monthConflictPolicy: String(monthConflictPolicy),
        totalRows: summary.totalRows,
        successRows: summary.validRows,
        failedRows: summary.errorRows,
        deletedRowCount: 0,
        fileMonthsJson: detect.fileMonths,
        conflictMonthsJson: detect.conflictMonths,
        errorMessage: null,
        stagingRows: {
          create: previewRows.map((row) => ({
            company: {
              connect: { id: companyId },
            },
            module,
            rowNo: row.rowNo,
            businessMonth: row.businessMonth,
            rawPayloadJson: {
              module,
              rowNo: row.rowNo,
              businessMonth: row.businessMonth,
            } as Prisma.InputJsonValue,
            normalizedPayloadJson: row.normalizedPayload as Prisma.InputJsonValue,
            dedupeHash: String(row.normalizedPayload?.dedupeHash || '') || null,
            matchStatus: row.matchStatus,
            matchReason: row.matchReason || null,
            targetEntityType: 'transaction',
            targetEntityId: null,
          })),
        },
      },
      select: {
        id: true,
        companyId: true,
        domain: true,
        filename: true,
        status: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ok: true,
      action: 'preview',
      module,
      companyId,
      sourceType,
      importJobId: created.id,
      job: created,
      summary,
      fileMonths: detect.fileMonths,
      existingMonths: detect.existingMonths,
      conflictMonths: detect.conflictMonths,
      monthConflictPolicy,
      rows: previewRows,
      message: 'imports preview created from parsed business dates and staging rows',
    };
  }

  async commitImport(importJobId: string, dto: CommitImportDto) {
    const companyId = await this.resolveCompanyId(dto.companyId);

    const result = await this.prisma.$transaction(async (tx) => {
      const job = await tx.importJob.findFirst({
        where: {
          id: importJobId,
          companyId,
        },
        select: {
          id: true,
          companyId: true,
          domain: true,
          module: true,
          filename: true,
          status: true,
          fileMonthsJson: true,
          conflictMonthsJson: true,
          monthConflictPolicy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!job) {
        throw new NotFoundException(`ImportJob not found: ${importJobId}`);
      }

      const module = String(job.module || job.domain || 'store-orders');
      const policy = String(
        dto.monthConflictPolicy || job.monthConflictPolicy || 'skip_existing_months',
      );

      const stagingRows = await tx.importStagingRow.findMany({
        where: {
          importJobId,
          matchStatus: 'new',
        },
        orderBy: [{ rowNo: 'asc' }],
        select: {
          id: true,
          rowNo: true,
          businessMonth: true,
          dedupeHash: true,
          matchReason: true,
          normalizedPayloadJson: true,
        },
      });

      const defaultStore = await tx.store.findFirst({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (!defaultStore?.id) {
        throw new NotFoundException(
          `No store found for company ${companyId}. Commit requires at least one store.`,
        );
      }

      const conflictMonths = this.normalizeStringArray(job.conflictMonthsJson);
      let deletedRows = 0;

      if (policy === 'replace_existing_months' && conflictMonths.length > 0) {
        const deleted = await tx.transaction.deleteMany({
          where: this.buildPreciseReplaceWhere({
            companyId,
            module,
            months: conflictMonths,
          }),
        });

        deletedRows = deleted.count;
      }

      let importedRows = 0;
      let duplicateRows = 0;
      let conflictRows = 0;
      let errorRows = 0;

      const seenHashes = new Set<string>();

      for (const row of stagingRows) {
        const payload = this.normalizeJsonObject(row.normalizedPayloadJson);
        const dedupeHash = String(row.dedupeHash || payload.dedupeHash || '').trim();
        const businessMonth = String(row.businessMonth || '').trim() || null;

        if (!dedupeHash) {
          errorRows += 1;
          await tx.importStagingRow.update({
            where: { id: row.id },
            data: {
              matchReason: 'commit skipped: dedupeHash missing',
            },
          });
          continue;
        }

        if (seenHashes.has(dedupeHash)) {
          duplicateRows += 1;
          await tx.importStagingRow.update({
            where: { id: row.id },
            data: {
              matchReason: 'commit skipped: duplicate dedupeHash inside current import job',
            },
          });
          continue;
        }
        seenHashes.add(dedupeHash);

        if (
          policy === 'skip_existing_months' &&
          businessMonth &&
          conflictMonths.includes(businessMonth)
        ) {
          conflictRows += 1;
          await tx.importStagingRow.update({
            where: { id: row.id },
            data: {
              matchReason:
                'commit skipped: businessMonth is in conflictMonths under skip_existing_months',
            },
          });
          continue;
        }

        const existing = await tx.transaction.findFirst({
          where: {
            companyId,
            dedupeHash,
          },
          select: { id: true },
        });

        if (existing) {
          duplicateRows += 1;
          await tx.importStagingRow.update({
            where: { id: row.id },
            data: {
              targetEntityType: 'transaction',
              targetEntityId: existing.id,
              matchReason: 'commit skipped: same dedupeHash already exists in Transaction',
            },
          });
          continue;
        }

        const isStoreOperation = module === 'store-operation';
        const occurredAt = this.parseDateOrNow(
          String(payload.orderDate || payload.occurredAt || ''),
        );
        const signedAmount = Number(payload.signedAmount ?? 0);
        const grossAmount = Number(payload.grossAmount ?? payload.amount ?? 0);
        const kind = String(payload.kind || payload.transactionType || '').toUpperCase();

        const resolvedAmount = isStoreOperation
          ? Math.abs(Math.round(signedAmount || 0))
          : Math.abs(Math.round(grossAmount || 0));

        const resolvedDirection = this.resolveImportDirection({
          module,
          signedAmount,
        });

        const resolvedType = this.resolveImportTransactionType({
          module,
          kind,
          signedAmount,
        });

        const resolvedAccountId = await this.resolveImportAccountId(tx, {
          companyId,
          storeId: defaultStore.id,
          module,
          kind,
        });

        const resolvedCategoryId = await this.resolveImportCategoryId(tx, {
          companyId,
          module,
          kind,
          direction: resolvedDirection,
        });

        const externalRef = String(payload.orderId || '').trim() || null;

        const memo = isStoreOperation
          ? `[imports:${module}] ${String(payload.kind || payload.transactionType || 'charge')} | ${String(payload.description || '-')}`
          : `[imports:${module}] ${String(payload.productName || payload.rawLabel || 'order')} | SKU ${String(payload.sku || '-')}`;

        const created = await tx.transaction.create({
          data: {
            companyId,
            storeId: defaultStore.id,
            accountId: resolvedAccountId,
            categoryId: resolvedCategoryId,
            type: resolvedType as any,
            direction: resolvedDirection as any,
            sourceType: 'IMPORT' as any,
            amount: resolvedAmount,
            occurredAt,
            externalRef,
            memo,
            businessMonth,
            dedupeHash,
            importJobId,
            sourceFileName: job.filename,
            sourceRowNo: row.rowNo,
          },
          select: {
            id: true,
          },
        });

        await tx.importStagingRow.update({
          where: { id: row.id },
          data: {
            targetEntityType: 'transaction',
            targetEntityId: created.id,
            matchReason: row.matchReason || 'committed to Transaction',
          },
        });

        importedRows += 1;
      }

      const updatedJob = await tx.importJob.update({
        where: { id: importJobId },
        data: {
          status: 'SUCCEEDED',
          monthConflictPolicy: policy,
          importedAt: new Date(),
          deletedRowCount: deletedRows,
          totalRows: stagingRows.length,
          successRows: importedRows,
          failedRows: errorRows + conflictRows,
          errorMessage: null,
        },
        select: {
          id: true,
          companyId: true,
          domain: true,
          module: true,
          filename: true,
          status: true,
          totalRows: true,
          successRows: true,
          failedRows: true,
          deletedRowCount: true,
          createdAt: true,
          updatedAt: true,
          importedAt: true,
          monthConflictPolicy: true,
        },
      });

      return {
        job: updatedJob,
        importedRows,
        duplicateRows,
        conflictRows,
        errorRows,
        deletedRows,
      };
    });

    const summary = await this.buildImportResultSummary({
      companyId,
      importJobId,
      importedRows: result.importedRows,
      duplicateRows: result.duplicateRows,
      conflictRows: result.conflictRows,
      errorRows: result.errorRows,
      deletedRows: result.deletedRows,
    });

    return {
      ok: true,
      action: 'commit',
      companyId,
      importJobId,
      monthConflictPolicy: String(
        dto.monthConflictPolicy || result.job.monthConflictPolicy || 'skip_existing_months',
      ),
      importedRows: result.importedRows,
      duplicateRows: result.duplicateRows,
      conflictRows: result.conflictRows,
      errorRows: result.errorRows,
      deletedRows: result.deletedRows,
      status: result.job.status,
      job: result.job,
      summary,
      message: 'imports commit persisted new staging rows into Transaction',
    };
  }

  async getImportSummary(importJobId: string, explicitCompanyId?: string) {
    const companyId = await this.resolveCompanyId(explicitCompanyId);

    const job = await this.prisma.importJob.findFirst({
      where: {
        id: importJobId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`ImportJob not found: ${importJobId}`);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        companyId,
        importJobId,
      },
      select: {
        id: true,
      },
    });

    const stagingRows = await this.prisma.importStagingRow.findMany({
      where: {
        importJobId,
      },
      select: {
        id: true,
        matchStatus: true,
      },
    });

    const summary = await this.buildImportResultSummary({
      companyId,
      importJobId,
      importedRows: transactions.length,
      duplicateRows: stagingRows.filter((x) => x.matchStatus === 'duplicate').length,
      conflictRows: stagingRows.filter((x) => x.matchStatus === 'conflict').length,
      errorRows: stagingRows.filter((x) => x.matchStatus === 'error').length,
      deletedRows: 0,
    });

    return {
      ok: true,
      action: 'summary',
      companyId,
      importJobId,
      summary,
      message: 'import result summary loaded',
    };
  }

  async listHistory(args: { module?: string; companyId?: string }) {
    const companyId = await this.resolveCompanyId(args.companyId);

    const rows = await this.prisma.importJob.findMany({
      where: {
        companyId,
        ...(args.module ? { module: args.module } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        companyId: true,
        domain: true,
        module: true,
        sourceType: true,
        filename: true,
        fileHash: true,
        status: true,
        monthConflictPolicy: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
        deletedRowCount: true,
        fileMonthsJson: true,
        conflictMonthsJson: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        importedAt: true,
      },
    });

    return {
      ok: true,
      action: 'history',
      companyId,
      module: args.module || null,
      total: rows.length,
      items: rows,
      message: 'imports history loaded',
    };
  }
  // Step109-Z1-H5D-EXPENSE-COMMIT-SERVICE:
  // Commit ledger_scope scoped expense import rows into Transaction.
  private normalizeExpenseLedgerScope(value?: string | null): string {
    return String(value || '').trim().toLowerCase();
  }

  private assertExpenseLedgerScope(scope: string): void {
    const allowed = new Set([
      'company-operation-expense',
      'payroll-expense',
      'other-expense',
      'store-operation-expense',
    ]);

    if (!allowed.has(scope)) {
      throw new BadRequestException(`Unsupported expense ledger_scope: ${scope || '-'}`);
    }
  }

  private parseExpenseImportDate(value?: string | null): Date {
    const raw = String(value || '').trim();
    if (!raw) {
      throw new BadRequestException('occurredAt is required');
    }

    const normalized = raw
      .replace(/[.]/g, '/')
      .replace(/年/g, '/')
      .replace(/月/g, '/')
      .replace(/日/g, '')
      .trim();

    const ymd = normalized.match(/^(20\d{2})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymd) {
      const y = Number(ymd[1]);
      const m = Number(ymd[2]);
      const d = Number(ymd[3]);
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    throw new BadRequestException(`Invalid occurredAt: ${raw}`);
  }

  private async resolveImportStoreId(companyId: string): Promise<string> {
    const existing = await this.prisma.store.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (existing?.id) return existing.id;

    const created = await this.prisma.store.create({
      data: {
        companyId,
        name: 'LedgerSeiri Import Store',
        platform: 'LEDGERSEIRI',
        region: 'JP',
      },
      select: { id: true },
    });

    return created.id;
  }

  private async resolveExpenseAccountId(args: {
    companyId: string;
    accountName?: string | null;
  }): Promise<string | null> {
    const accountName = String(args.accountName || '').trim();
    if (!accountName) return null;

    const account = await this.prisma.account.findFirst({
      where: {
        companyId: args.companyId,
        name: accountName,
        isActive: true,
      },
      select: { id: true },
    });

    return account?.id || null;
  }

  private buildExpenseImportMemo(args: {
    ledgerScope: string;
    category: string;
    vendor?: string | null;
    evidenceNo?: string | null;
    memo?: string | null;
  }): string {
    const parts = [
      `[ledger_scope:${args.ledgerScope}]`,
      `[ledger_subcategory:${args.category || '-'}]`,
    ];

    if (args.vendor) parts.push(`[vendor:${args.vendor}]`);
    if (args.evidenceNo) parts.push(`[evidence_no:${args.evidenceNo}]`);
    if (args.memo) parts.push(String(args.memo).trim());

    return parts.join(' ').trim();
  }


  // Step109-Z1-H5H-FIX2B-WRAP-EXPENSE-MEMO-ACCOUNT-MARKER:
  // Persist template account_name into Transaction.memo marker for H5G display.
  private withExpenseAccountNameMarker(memo: string, accountName?: string | null): string {
    const normalizedMemo = String(memo || "").trim();
    const normalizedAccountName = String(accountName || "").trim();

    if (!normalizedAccountName) return normalizedMemo;
    if (/\[account_name:[^\]]+\]/i.test(normalizedMemo)) return normalizedMemo;

    return `${normalizedMemo} [account_name:${normalizedAccountName}]`.trim();
  }

  async commitExpenseImport(body: ExpenseImportCommitDto) {
    const companyId = await this.resolveCompanyId(body?.companyId);
    const ledgerScope = this.normalizeExpenseLedgerScope(body?.ledgerScope);
    this.assertExpenseLedgerScope(ledgerScope);

    const filename = String(body?.filename || `${ledgerScope}-template.csv`).trim();
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      throw new BadRequestException('No expense rows to commit');
    }

    const okRows = rows.filter((row) => String(row.status || 'ok') === 'ok');
    const blockedRows = rows.length - okRows.length;

    if (!okRows.length) {
      throw new BadRequestException('No valid expense rows to commit');
    }

    const storeId = await this.resolveImportStoreId(companyId);
    const fileHash = this.hashPayload([
      companyId,
      ledgerScope,
      filename,
      JSON.stringify(okRows),
    ]);

    const importJob = await this.prisma.importJob.create({
      data: {
        companyId,
        domain: 'ledger',
        module: ledgerScope,
        sourceType: 'expense-csv',
        filename,
        fileHash,
        status: 'PROCESSING',
        totalRows: rows.length,
        successRows: 0,
        failedRows: blockedRows,
      },
      select: { id: true },
    });

    let importedRows = 0;
    let duplicateRows = 0;
    let errorRows = blockedRows;
    let totalImportedAmount = 0;
    const createdTransactionIds: string[] = [];

    for (const row of rows) {
      const rowNo = Number(row.rowNo || 0) || 0;
      const amount = Math.abs(Number(row.amount || 0));
      const category = String(row.category || '').trim();
      const vendor = String(row.vendor || '').trim();
      const evidenceNo = String(row.evidenceNo || '').trim();
      const accountName = String(row.accountName || '').trim();
      const currency = String(row.currency || 'JPY').trim() || 'JPY';

      let occurredAt: Date;
      let businessMonth: string | null = null;

      try {
        if (String(row.status || 'ok') !== 'ok') {
          throw new Error(row.error || 'preview row is not OK');
        }

        if (!amount) throw new Error('amount is required');
        if (!category) throw new Error('category is required');

        occurredAt = this.parseExpenseImportDate(row.occurredAt);
        businessMonth = this.normalizeBusinessMonth(occurredAt.toISOString());
      } catch (err) {
        errorRows += 1;
        await this.prisma.importStagingRow.create({
          data: {
            importJobId: importJob.id,
            companyId,
            module: ledgerScope,
            rowNo,
            businessMonth: null,
            rawPayloadJson: row as Prisma.InputJsonValue,
            normalizedPayloadJson: {
              ledgerScope,
              category,
              amount,
              error: err instanceof Error ? err.message : 'row validation failed',
            } as Prisma.InputJsonValue,
            dedupeHash: null,
            matchStatus: 'error',
            matchReason: err instanceof Error ? err.message : 'row validation failed',
            targetEntityType: 'transaction',
          },
        });
        continue;
      }

      const memo = this.buildExpenseImportMemo({
        ledgerScope,
        category,
        vendor,
        evidenceNo,
        memo: row.memo,
      });

      const dedupeHash = this.hashPayload([
        companyId,
        ledgerScope,
        filename,
        rowNo,
        occurredAt.toISOString().slice(0, 10),
        amount,
        category,
        vendor,
        evidenceNo,
        accountName,
        memo: this.withExpenseAccountNameMarker(memo, row.accountName),
      ]);

      const existing = await this.prisma.transaction.findFirst({
        where: { companyId, dedupeHash },
        select: { id: true },
      });

      if (existing?.id) {
        duplicateRows += 1;
        await this.prisma.importStagingRow.create({
          data: {
            importJobId: importJob.id,
            companyId,
            module: ledgerScope,
            rowNo,
            businessMonth,
            rawPayloadJson: row as Prisma.InputJsonValue,
            normalizedPayloadJson: {
              ledgerScope,
              category,
              amount,
              currency,
              occurredAt: occurredAt.toISOString(),
              vendor,
              evidenceNo,
              accountName,
              memo,
              dedupeHash,
            } as Prisma.InputJsonValue,
            dedupeHash,
            matchStatus: 'duplicate',
            matchReason: 'same dedupeHash already exists in Transaction',
            targetEntityType: 'transaction',
            targetEntityId: existing.id,
          },
        });
        continue;
      }

      const accountId = await this.resolveExpenseAccountId({
        companyId,
        accountName,
      });

      const created = await this.prisma.transaction.create({
        data: {
          companyId,
          storeId,
          accountId,
          categoryId: null,
          importJobId: importJob.id,
          type: 'OTHER',
          direction: 'EXPENSE',
          sourceType: 'IMPORT',
          amount,
          currency,
          occurredAt,
          externalRef: evidenceNo || undefined,
          memo,
          businessMonth,
          dedupeHash,
          sourceFileName: filename,
          sourceRowNo: rowNo || undefined,
        },
        select: { id: true },
      });

      await this.prisma.importStagingRow.create({
        data: {
          importJobId: importJob.id,
          companyId,
          module: ledgerScope,
          rowNo,
          businessMonth,
          rawPayloadJson: row as Prisma.InputJsonValue,
          normalizedPayloadJson: {
            ledgerScope,
            category,
            amount,
            currency,
            occurredAt: occurredAt.toISOString(),
            vendor,
            evidenceNo,
            accountName,
            accountId,
            memo,
            dedupeHash,
          } as Prisma.InputJsonValue,
          dedupeHash,
          matchStatus: 'new',
          matchReason: 'committed to Transaction',
          targetEntityType: 'transaction',
          targetEntityId: created.id,
        },
      });

      importedRows += 1;
      totalImportedAmount += amount;
      createdTransactionIds.push(created.id);
    }

    const status = errorRows > 0 ? 'FAILED' : 'SUCCEEDED';

    const job = await this.prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status,
        successRows: importedRows,
        failedRows: errorRows,
        importedAt: new Date(),
      },
      select: {
        id: true,
        filename: true,
        status: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
        importedAt: true,
      },
    });

    return {
      ok: errorRows === 0,
      action: 'expense-import-commit',
      module: ledgerScope,
      companyId,
      filename,
      importJobId: importJob.id,
      importedRows,
      duplicateRows,
      blockedRows,
      errorRows,
      totalImportedAmount,
      createdTransactionIds,
      job,
      message:
        errorRows === 0
          ? `${ledgerScope} import committed`
          : `${ledgerScope} import completed with errors`,
    };
  }


}
