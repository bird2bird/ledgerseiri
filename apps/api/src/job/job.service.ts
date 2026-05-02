import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type JobDomain = 'import-jobs' | 'export-jobs';

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

@Injectable()
export class JobService {
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

  private parseAmazonBridgeAmounts(row: Record<string, string>, kind: AmazonTransactionChargeKind, signedAmount: number) {
    const grossAmount = this.parseAmazonOrderRevenue(row);

    const taxAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          '商品売上の税',
          '配送料の税',
          'ギフト包装の税',
          '税金',
          'tax',
          'taxes',
          'プロモーション割引の税',
        ]),
      ),
    );

    const shippingAmount =
      this.parseAmount(this.pickField(row, ['配送料', '送料', 'shipping', 'shipping credits'])) +
      this.parseAmount(this.pickField(row, ['ギフト包装料', 'ギフト包装', 'gift wrap', 'giftwrap']));

    const promotionAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
          'Amazonポイントの費用',
          'プロモーション',
          'プロモーション割引',
          'プロモーション割引額',
          'promotion',
          'discount',
          'amazon points',
        ]),
      ),
    );

    const feeAmount = Math.abs(
      this.parseAmount(
        this.pickField(row, [
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
      ),
    );

    let netAmount = signedAmount;

    if (kind === 'ORDER_SALE') {
      netAmount = signedAmount !== 0 ? signedAmount : grossAmount - feeAmount - taxAmount - promotionAmount;
    }

    return {
      grossAmount,
      netAmount,
      feeAmount,
      taxAmount,
      shippingAmount,
      promotionAmount,
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

  private async resolveCompanyId() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!company) {
      throw new Error('No company found. Please create a company first.');
    }

    return company.id;
  }

  // Step109-Z1-H11-C-IMPORT-JOB-LIST-FIELDS:
  // Expose existing ImportJob columns for Import Center list/detail preparation.
  // This does not change Prisma schema or create new endpoints.
  private mapImportJob(item: {
    id: string;
    companyId: string;
    domain: string;
    module: string | null;
    sourceType: string | null;
    filename: string;
    fileHash: string | null;
    status: string;
    monthConflictPolicy: string | null;
    totalRows: number | null;
    successRows: number | null;
    failedRows: number | null;
    deletedRowCount: number | null;
    fileMonthsJson: unknown;
    conflictMonthsJson: unknown;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    importedAt: Date | null;
  }) {
    return {
      id: item.id,
      companyId: item.companyId,
      domain: item.domain,
      module: item.module,
      sourceType: item.sourceType,
      filename: item.filename,
      fileHash: item.fileHash,
      status: item.status,
      monthConflictPolicy: item.monthConflictPolicy,
      totalRows: item.totalRows,
      successRows: item.successRows,
      failedRows: item.failedRows,
      deletedRowCount: item.deletedRowCount,
      fileMonthsJson: item.fileMonthsJson,
      conflictMonthsJson: item.conflictMonthsJson,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      importedAt: item.importedAt ? item.importedAt.toISOString() : null,
    };
  }

  private mapExportJob(item: {
    id: string;
    companyId: string;
    domain: string;
    format: string;
    status: string;
    filterJson: unknown;
    fileUrl: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      companyId: item.companyId,
      domain: item.domain,
      format: item.format,
      status: item.status,
      filterJson: item.filterJson,
      fileUrl: item.fileUrl,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listImportJobs() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.importJob.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      ok: true,
      domain: 'import-jobs' as JobDomain,
      action: 'list',
      items: rows.map((item) => this.mapImportJob(item)),
      total: rows.length,
      message: 'import-jobs loaded',
    };
  }

  async getImportMeta() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.importJob.findMany({
      where: { companyId },
      select: {
        domain: true,
        status: true,
      },
    });

    const domainSet = new Set<string>();
    let pending = 0;
    let processing = 0;
    let succeeded = 0;
    let failed = 0;

    for (const row of rows) {
      if (row.domain) domainSet.add(row.domain);

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING') pending += 1;
      else if (status === 'PROCESSING') processing += 1;
      else if (status === 'SUCCEEDED') succeeded += 1;
      else if (status === 'FAILED') failed += 1;
    }

    return {
      ok: true,
      domain: 'import-jobs' as JobDomain,
      action: 'meta',
      domains: [
        { value: '', label: 'すべてのドメイン' },
        ...Array.from(domainSet)
          .sort()
          .map((value) => ({
            value,
            label: value,
          })),
      ],
      statuses: [
        { value: '', label: 'すべての状態' },
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PROCESSING', label: 'PROCESSING' },
        { value: 'SUCCEEDED', label: 'SUCCEEDED' },
        { value: 'FAILED', label: 'FAILED' },
      ],
      summary: {
        total: rows.length,
        pending,
        processing,
        succeeded,
        failed,
      },
      message: 'import-jobs meta loaded',
    };
  }

  async listExportJobs() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.exportJob.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      ok: true,
      domain: 'export-jobs' as JobDomain,
      action: 'list',
      items: rows.map((item) => this.mapExportJob(item)),
      total: rows.length,
      message: 'export-jobs loaded',
    };
  }

  async getExportMeta() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.exportJob.findMany({
      where: { companyId },
      select: {
        domain: true,
        status: true,
        format: true,
      },
    });

    const domainSet = new Set<string>();
    const formatSet = new Set<string>();
    let pending = 0;
    let processing = 0;
    let succeeded = 0;
    let failed = 0;

    for (const row of rows) {
      if (row.domain) domainSet.add(row.domain);
      if (row.format) formatSet.add(row.format);

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING') pending += 1;
      else if (status === 'PROCESSING') processing += 1;
      else if (status === 'SUCCEEDED') succeeded += 1;
      else if (status === 'FAILED') failed += 1;
    }

    return {
      ok: true,
      domain: 'export-jobs' as JobDomain,
      action: 'meta',
      domains: [
        { value: '', label: 'すべてのドメイン' },
        ...Array.from(domainSet)
          .sort()
          .map((value) => ({
            value,
            label: value,
          })),
      ],
      formats: [
        { value: '', label: 'すべての形式' },
        ...Array.from(formatSet)
          .sort()
          .map((value) => ({
            value,
            label: value.toUpperCase(),
          })),
      ],
      statuses: [
        { value: '', label: 'すべての状態' },
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PROCESSING', label: 'PROCESSING' },
        { value: 'SUCCEEDED', label: 'SUCCEEDED' },
        { value: 'FAILED', label: 'FAILED' },
      ],
      summary: {
        total: rows.length,
        pending,
        processing,
        succeeded,
        failed,
      },
      message: 'export-jobs meta loaded',
    };
  }

  async createImportJob(payload: unknown) {
    const body =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {};

    const domain = String(body.domain ?? '').trim();

    if (domain !== 'amazon-store-orders') {
      return {
        ok: true,
        domain: 'import-jobs',
        action: 'create',
        payload,
        mode: 'stub',
        message: 'import-jobs create stub',
      };
    }

    const filename =
      String(body.filename ?? 'amazon-store-orders.csv').trim() ||
      'amazon-store-orders.csv';
    const csvText = String(body.csvText ?? '');
    const commit = body.commit === true;

    try {
      const parsed = this.parseAmazonStoreOrdersCsv(filename, csvText);

      if (!commit) {
        return {
          ok: true,
          domain,
          action: 'preview',
          mode: 'foundation-preview',
          summary: parsed.summary,
          rawRows: parsed.rawRows,
          facts: parsed.facts,
          charges: parsed.charges,
          chargeSummary: parsed.chargeSummary,
          job: null,
          message: 'amazon store orders csv preview ready',
        };
      }

      const companyId = await this.resolveCompanyId();
      const status = parsed.summary.successRows > 0 ? 'SUCCEEDED' : 'FAILED';

      const created = await this.prisma.importJob.create({
        data: {
          companyId,
          domain,
          filename,
          status,
          totalRows: parsed.summary.totalRows,
          successRows: parsed.summary.successRows,
          failedRows: parsed.summary.failedRows,
          errorMessage:
            status === 'FAILED' ? 'No valid amazon store order rows parsed' : null,
        },
      });

      return {
        ok: true,
        domain,
        action: 'create',
        mode: 'foundation-preview',
        summary: parsed.summary,
        rawRows: parsed.rawRows,
        facts: parsed.facts,
        charges: parsed.charges,
        chargeSummary: parsed.chargeSummary,
        job: this.mapImportJob(created),
        message: 'amazon store orders import job created',
      };
    } catch (error) {
      return {
        ok: false,
        domain,
        action: commit ? 'create' : 'preview',
        mode: 'foundation-preview',
        summary: {
          filename,
          totalRows: 0,
          successRows: 0,
          failedRows: 0,
          totalAmount: 0,
          totalQuantity: 0,
          delimiter: 'comma' as const,
          headers: [],
        },
        rawRows: [],
        facts: [],
        charges: [],
        chargeSummary: {
          orderSale: 0,
          adFee: 0,
          storageFee: 0,
          subscriptionFee: 0,
          fbaFee: 0,
          tax: 0,
          payout: 0,
          adjustment: 0,
          other: 0,
        },
        job: null,
        message: error instanceof Error ? error.message : 'amazon store orders csv parse failed',
      };
    }
  }

  createExportJob(payload: unknown) {
    return {
      ok: true,
      domain: 'export-jobs',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'export-jobs create stub',
    };
  }
}
