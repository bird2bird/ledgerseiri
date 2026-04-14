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

  store?: string | null;
  fulfillment?: string | null;
  rawLabel: string;
};

type AmazonPreviewCharge = {
  id: string;
  rowNo: number;
  occurredAt?: string | null;
  orderId?: string | null;
  sku?: string | null;
  transactionType: string;
  description: string;
  kind:
    | 'ORDER_SALE'
    | 'AD_FEE'
    | 'STORAGE_FEE'
    | 'SUBSCRIPTION_FEE'
    | 'FBA_FEE'
    | 'TAX'
    | 'PAYOUT'
    | 'ADJUSTMENT'
    | 'OTHER';
  signedAmount: number;
};

type AmazonPreviewChargeSummary = {
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
  charges: AmazonPreviewCharge[];
  chargeSummary: AmazonPreviewChargeSummary;
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
      ])
    );

    const shippingSales = this.parseAmount(
      this.pickField(row, [
        '配送料',
        '送料',
        'shipping',
        'shipping credits',
      ])
    );

    const giftWrapSales = this.parseAmount(
      this.pickField(row, [
        'ギフト包装料',
        'ギフト包装',
        'gift wrap',
        'giftwrap',
      ])
    );

    return productSales + shippingSales + giftWrapSales;
  }

  private absAmount(value: number): number {
    return Math.abs(Number(value || 0));
  }

  private sumSignedFields(row: Record<string, string>, aliases: string[]): number {
    return aliases.reduce((sum, alias) => sum + this.parseAmount(this.pickField(row, [alias])), 0);
  }

  private classifyAmazonTransactionKind(transactionType: string, description: string) {
    const t = String(transactionType || '').trim();
    const d = String(description || '').trim();
    const merged = `${t} ${d}`;

    if (/注文|order/i.test(merged)) return 'ORDER_SALE' as const;
    if (/広告|ads?|advertising/i.test(merged)) return 'AD_FEE' as const;
    if (/在庫保管|在庫関連|storage/i.test(merged)) return 'STORAGE_FEE' as const;
    if (/月額|月租|subscription|register|登録料/i.test(merged)) return 'SUBSCRIPTION_FEE' as const;
    if (/FBA|販売手数料|出品手数料|referral fee|fulfillment fee/i.test(merged)) return 'FBA_FEE' as const;
    if (/税|源泉|tax/i.test(merged)) return 'TAX' as const;
    if (/振込|入金|payout|transfer|送金|amazonチャージ/i.test(merged)) return 'PAYOUT' as const;
    if (/調整|adjust/i.test(merged)) return 'ADJUSTMENT' as const;
    return 'OTHER' as const;
  }

  private parseAmazonOrderBridge(row: Record<string, string>) {
    const productSales = this.parseAmount(
      this.pickField(row, [
        '商品売上',
        '商品の売上',
        'product sales',
        'item price',
        'item-price',
        'principal',
      ])
    );

    const productTax = this.absAmount(
      this.sumSignedFields(row, [
        '商品の売上税',
        '商品売上税',
      ])
    );

    const shippingRevenue = this.parseAmount(
      this.pickField(row, [
        '配送料',
        '送料',
        'shipping',
        'shipping credits',
      ])
    );

    const shippingTax = this.absAmount(
      this.sumSignedFields(row, [
        '配送料の税',
      ])
    );

    const giftWrapRevenue = this.parseAmount(
      this.pickField(row, [
        'ギフト包装料',
        'ギフト包装',
        'gift wrap',
        'giftwrap',
      ])
    );

    const giftWrapTax = this.absAmount(
      this.sumSignedFields(row, [
        'ギフト包装の税',
      ])
    );

    const amazonPoints = this.absAmount(
      this.sumSignedFields(row, [
        'Amazonポイント',
        'Amazonポイントの費用',
      ])
    );

    const promotion = this.absAmount(
      this.sumSignedFields(row, [
        'プロモーション',
        'プロモーション割引',
        'promotion',
        'discount',
      ])
    );

    const withholdingTax = this.absAmount(
      this.sumSignedFields(row, [
        '源泉徴収税',
        '税金',
        'tax',
      ])
    );

    const transactionOther = this.absAmount(
      this.sumSignedFields(row, [
        'トランザクションその他',
        'トランザクションその他の手数料',
        'その他各種手数料',
        'other transaction fees',
      ])
    );

    const fbaFee = this.absAmount(
      this.sumSignedFields(row, [
        'FBA手数料',
        'フルフィルメント手数料',
        'fba fees',
        'fulfillment fees',
      ])
    );

    const sellingFee = this.absAmount(
      this.sumSignedFields(row, [
        '出品手数料',
        '販売手数料',
        'referral fee',
        'selling fees',
      ])
    );

    const grossAmount = productSales + shippingRevenue + giftWrapRevenue;
    const shippingAmount = shippingRevenue + giftWrapRevenue;
    const feeAmount = fbaFee + sellingFee + transactionOther;
    const taxAmount = productTax + shippingTax + giftWrapTax + withholdingTax;
    const promotionAmount = amazonPoints + promotion;
    const netAmount = grossAmount - feeAmount - taxAmount - promotionAmount;

    return {
      grossAmount,
      netAmount,
      feeAmount,
      taxAmount,
      shippingAmount,
      promotionAmount,
    };
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
      '商品名',
      'item-name',
      'product-name',
      'sku',
      'seller-sku',
      'quantity',
      '数量',
      'item-price',
      'amount',
      'principal',
      '金額',
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
    const charges: AmazonPreviewCharge[] = [];

    let totalAmount = 0;
    let totalQuantity = 0;
    let failedRows = 0;

    const chargeSummary: AmazonPreviewChargeSummary = {
      adFee: 0,
      storageFee: 0,
      subscriptionFee: 0,
      fbaFee: 0,
      tax: 0,
      payout: 0,
      adjustment: 0,
      other: 0,
    };

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
        'トランザクションの種類',
        '取引タイプ',
        'transaction type',
        'type',
        '種類',
      ]);

      const description = this.pickField(headerToValue, [
        '説明',
        'description',
        'memo',
      ]);

      const orderId = this.pickField(headerToValue, [
        'amazon-order-id',
        'order-id',
        'order id',
        '注文番号',
        '注文id',
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
      ]);

      const quantity = this.parseQuantity(
        this.pickField(headerToValue, [
          'quantity',
          'qty',
          '数量',
        ])
      );

      const amount = this.parseAmazonOrderRevenue(headerToValue);

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
      ]);

      const signedTotal = this.parseAmount(
        this.pickField(headerToValue, [
          '合計',
          'total',
          'amount',
        ])
      );

      const kind = this.classifyAmazonTransactionKind(transactionType, description);

      if (!(orderId || sku || productName)) {
        if (signedTotal !== 0 || kind !== 'OTHER') {
          const charge: AmazonPreviewCharge = {
            id: `${kind}-${rowNo}`,
            rowNo,
            occurredAt: orderDate || null,
            orderId: orderId || null,
            sku: sku || null,
            transactionType,
            description,
            kind,
            signedAmount: signedTotal,
          };
          charges.push(charge);

          if (kind === 'AD_FEE') chargeSummary.adFee += signedTotal;
          else if (kind === 'STORAGE_FEE') chargeSummary.storageFee += signedTotal;
          else if (kind === 'SUBSCRIPTION_FEE') chargeSummary.subscriptionFee += signedTotal;
          else if (kind === 'FBA_FEE') chargeSummary.fbaFee += signedTotal;
          else if (kind === 'TAX') chargeSummary.tax += signedTotal;
          else if (kind === 'PAYOUT') chargeSummary.payout += signedTotal;
          else if (kind === 'ADJUSTMENT') chargeSummary.adjustment += signedTotal;
          else chargeSummary.other += signedTotal;
          continue;
        }

        failedRows += 1;
        continue;
      }

      const bridge = this.parseAmazonOrderBridge(headerToValue);

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
        store: store || null,
        fulfillment: fulfillment || null,
        rawLabel: productName || sku || orderId || '注文',
      };

      facts.push(fact);
      totalAmount += bridge.grossAmount;
      totalQuantity += quantity;
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

  private mapImportJob(item: {
    id: string;
    companyId: string;
    domain: string;
    filename: string;
    status: string;
    totalRows: number | null;
    successRows: number | null;
    failedRows: number | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      companyId: item.companyId,
      domain: item.domain,
      filename: item.filename,
      status: item.status,
      totalRows: item.totalRows,
      successRows: item.successRows,
      failedRows: item.failedRows,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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
      domain: 'import-jobs',
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
      domain: 'import-jobs',
      action: 'meta',
      domains: [
        { value: '', label: 'すべてのドメイン' },
        ...Array.from(domainSet).sort().map((value) => ({
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
      domain: 'export-jobs',
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
      domain: 'export-jobs',
      action: 'meta',
      domains: [
        { value: '', label: 'すべてのドメイン' },
        ...Array.from(domainSet).sort().map((value) => ({
          value,
          label: value,
        })),
      ],
      formats: [
        { value: '', label: 'すべての形式' },
        ...Array.from(formatSet).sort().map((value) => ({
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
          delimiter: 'comma',
          headers: [],
        },
        rawRows: [],
        facts: [],
        charges: [],
        chargeSummary: {
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
