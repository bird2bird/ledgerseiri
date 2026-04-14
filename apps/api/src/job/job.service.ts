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
  store?: string | null;
  fulfillment?: string | null;
  rawLabel: string;
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

      const amount = this.parseAmount(
        this.pickField(headerToValue, [
          'item-price',
          'principal',
          'amount',
          'item subtotal',
          'subtotal',
          '売上',
          '金額',
        ])
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
      ]);

      if (!(orderId || sku || productName)) {
        failedRows += 1;
        continue;
      }

      const fact: AmazonPreviewFact = {
        rowNo,
        orderId,
        orderDate: orderDate || null,
        sku,
        productName,
        quantity,
        amount,
        store: store || null,
        fulfillment: fulfillment || null,
        rawLabel: productName || sku || orderId || '注文',
      };

      facts.push(fact);
      totalAmount += amount;
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
      rawRows: rawRows.slice(0, 20),
      facts: facts.slice(0, 20),
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
