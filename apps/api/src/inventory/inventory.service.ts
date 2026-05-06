import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type StockStatus = 'healthy' | 'low' | 'out' | 'negative';

type StockQuery = {
  storeId?: string;
  status?: string;
  q?: string;
};

type MovementQuery = {
  skuId?: string;
  skuCode?: string;
  storeId?: string;
  limit?: string;
};

type AuditIssuesQuery = {
  status?: string;
  reason?: string;
  sku?: string;
  importJobId?: string;
  businessMonth?: string;
  limit?: string;
  offset?: string;
};

type AuditIssueResolvePayload = {
  skuId?: string;
  skuCode?: string;
  note?: string;
};

type ManualAdjustmentPayload = {
  skuId?: string;
  skuCode?: string;
  type?: InventoryMovementType | string;
  quantity?: number | string;
  quantityDelta?: number | string;
  occurredAt?: string;
  memo?: string;
  sourceType?: string;
  sourceId?: string;
  importJobId?: string;
  sourceRowNo?: number | string;
  transactionId?: string;
  businessMonth?: string;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('No company found. Please create a company first.');
    }

    return company.id;
  }

  private parseInteger(value: unknown, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    const normalized =
      typeof value === 'string'
        ? value.replace(/[,\s]/g, '').replace(/[０-９]/g, (d) =>
            String.fromCharCode(d.charCodeAt(0) - 0xfee0),
          )
        : value;

    const n = Number(normalized);

    if (!Number.isInteger(n)) {
      throw new BadRequestException(`${fieldName} must be an integer.`);
    }

    return n;
  }

  private parseOptionalInteger(value: unknown, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.parseInteger(value, fieldName);
  }

  private normalizeMovementType(value: unknown): InventoryMovementType {
    const raw = String(value || 'ADJUST').toUpperCase();

    if (raw === InventoryMovementType.IN) return InventoryMovementType.IN;
    if (raw === InventoryMovementType.OUT) return InventoryMovementType.OUT;
    if (raw === InventoryMovementType.ADJUST) return InventoryMovementType.ADJUST;

    throw new BadRequestException('type must be IN, OUT, or ADJUST.');
  }

  private getStockStatus(quantity: number, reservedQty: number, alertLevel: number): StockStatus {
    const availableQty = quantity - reservedQty;

    if (quantity < 0) return 'negative';
    if (quantity <= 0) return 'out';
    if (availableQty <= alertLevel) return 'low';

    return 'healthy';
  }

  private getStockStatusLabel(status: StockStatus) {
    if (status === 'negative') return 'マイナス在庫';
    if (status === 'out') return '欠品';
    if (status === 'low') return '要補充';
    return '正常';
  }

  private toStockItem(row: any) {
    const quantity = Number(row.quantity ?? 0);
    const reservedQty = Number(row.reservedQty ?? 0);
    const availableQty = quantity - reservedQty;
    const alertLevel = Number(row.alertLevel ?? 0);
    const stockStatus = this.getStockStatus(quantity, reservedQty, alertLevel);

    return {
      id: row.id,
      skuId: row.sku.id,
      sku: row.sku.skuCode,
      skuCode: row.sku.skuCode,
      asin: row.sku.asin ?? null,
      externalSku: row.sku.externalSku ?? null,
      fulfillmentChannel: row.sku.fulfillmentChannel ?? 'FBA',
      name: row.sku.name?.trim() || row.sku.product?.name?.trim() || '-',
      productId: row.sku.product?.id ?? null,
      productName: row.sku.product?.name ?? null,
      brand: row.sku.product?.brand ?? null,
      category: row.sku.product?.category ?? null,
      store: row.sku.store?.name?.trim() || '未設定',
      storeId: row.sku.store?.id ?? null,
      quantity,
      reservedQty,
      availableQty,
      alertLevel,
      stockStatus,
      stockStatusLabel: this.getStockStatusLabel(stockStatus),
      isActive: row.sku.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listStocks(query: StockQuery = {}) {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.inventoryBalance.findMany({
      where: {
        companyId,
        sku: {
          ...(query.storeId ? { storeId: query.storeId } : {}),
          ...(query.q
            ? {
                OR: [
                  { skuCode: { contains: query.q, mode: 'insensitive' } },
                  { name: { contains: query.q, mode: 'insensitive' } },
                  { asin: { contains: query.q, mode: 'insensitive' } },
                  { externalSku: { contains: query.q, mode: 'insensitive' } },
                  { product: { name: { contains: query.q, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
      },
      select: {
        id: true,
        quantity: true,
        reservedQty: true,
        alertLevel: true,
        updatedAt: true,
        sku: {
          select: {
            id: true,
            skuCode: true,
            name: true,
            asin: true,
            externalSku: true,
            fulfillmentChannel: true,
            isActive: true,
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                category: true,
              },
            },
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const allItems = rows.map((row) => this.toStockItem(row));
    const status = query.status?.trim();

    const items = status
      ? allItems.filter((item) => item.stockStatus === status)
      : allItems;

    return {
      ok: true,
      domain: 'inventory',
      action: 'stocks',
      items,
      total: items.length,
      summary: this.buildSummary(allItems),
      message: 'inventory stocks loaded',
    };
  }

  async list() {
    return this.listStocks();
  }

  private buildSummary(items: Array<{ stockStatus: StockStatus; quantity: number; availableQty: number }>) {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.totalQuantity += item.quantity;
        acc.totalAvailable += item.availableQty;

        if (item.stockStatus === 'healthy') acc.healthy += 1;
        if (item.stockStatus === 'low') acc.lowStock += 1;
        if (item.stockStatus === 'out') acc.outOfStock += 1;
        if (item.stockStatus === 'negative') acc.negativeStock += 1;

        return acc;
      },
      {
        total: 0,
        healthy: 0,
        lowStock: 0,
        outOfStock: 0,
        negativeStock: 0,
        totalQuantity: 0,
        totalAvailable: 0,
      },
    );
  }

  async getMeta() {
    const companyId = await this.resolveCompanyId();

    const [stores, rows] = await Promise.all([
      this.prisma.store.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
        },
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.inventoryBalance.findMany({
        where: { companyId },
        select: {
          quantity: true,
          reservedQty: true,
          alertLevel: true,
          sku: {
            select: {
              id: true,
              skuCode: true,
              name: true,
              asin: true,
              externalSku: true,
              fulfillmentChannel: true,
              storeId: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((row) => {
      const quantity = Number(row.quantity ?? 0);
      const reservedQty = Number(row.reservedQty ?? 0);
      const availableQty = quantity - reservedQty;
      const alertLevel = Number(row.alertLevel ?? 0);
      const stockStatus = this.getStockStatus(quantity, reservedQty, alertLevel);

      return {
        stockStatus,
        quantity,
        availableQty,
      };
    });

    return {
      ok: true,
      domain: 'inventory',
      action: 'meta',
      stores: [
        { value: '', label: 'すべての店舗' },
        ...stores.map((store) => ({
          value: store.id,
          label: store.name,
        })),
      ],
      stockStatuses: [
        { value: '', label: 'すべての状態' },
        { value: 'healthy', label: '正常' },
        { value: 'low', label: '要補充' },
        { value: 'out', label: '欠品' },
        { value: 'negative', label: 'マイナス在庫' },
      ],
      summary: this.buildSummary(items),
      message: 'inventory meta loaded',
    };
  }

  async listMovements(query: MovementQuery = {}) {
    const companyId = await this.resolveCompanyId();

    const takeRaw = query.limit ? Number(query.limit) : 50;
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(Math.trunc(takeRaw), 1), 100) : 50;

    const skuWhere: any = {
      companyId,
      ...(query.storeId ? { storeId: query.storeId } : {}),
      ...(query.skuCode ? { skuCode: query.skuCode } : {}),
    };

    const rows = await this.prisma.inventoryMovement.findMany({
      where: {
        companyId,
        ...(query.skuId ? { skuId: query.skuId } : {}),
        ...((query.storeId || query.skuCode) ? { sku: skuWhere } : {}),
      },
      select: {
        id: true,
        companyId: true,
        skuId: true,
        type: true,
        quantity: true,
        occurredAt: true,
        sourceType: true,
        sourceId: true,
        importJobId: true,
        sourceRowNo: true,
        transactionId: true,
        businessMonth: true,
        memo: true,
        createdAt: true,
        sku: {
          select: {
            id: true,
            skuCode: true,
            name: true,
            asin: true,
            externalSku: true,
            fulfillmentChannel: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take,
    });

    return {
      ok: true,
      domain: 'inventory',
      action: 'movements',
      items: rows.map((row) => ({
        id: row.id,
        skuId: row.skuId,
        sku: row.sku.skuCode,
        skuCode: row.sku.skuCode,
        productName: row.sku.product?.name ?? null,
        storeId: row.sku.store?.id ?? null,
        store: row.sku.store?.name ?? '未設定',
        type: row.type,
        quantity: row.quantity,
        occurredAt: row.occurredAt.toISOString(),
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        importJobId: row.importJobId,
        sourceRowNo: row.sourceRowNo,
        transactionId: row.transactionId,
        businessMonth: row.businessMonth,
        memo: row.memo,
        createdAt: row.createdAt.toISOString(),
      })),
      total: rows.length,
      message: 'inventory movements loaded',
    };
  }

  private normalizeAuditIssueObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  async listAuditIssues(query: AuditIssuesQuery = {}) {
    const companyId = await this.resolveCompanyId();

    const normalizedStatus = String(query.status || 'OPEN').trim().toUpperCase();
    const status = normalizedStatus && normalizedStatus !== 'ALL' ? normalizedStatus : '';
    const reason = String(query.reason || '').trim();
    const sku = String(query.sku || '').trim();
    const importJobId = String(query.importJobId || '').trim();
    const businessMonth = String(query.businessMonth || '').trim();

    const limitRaw = query.limit ? Number(query.limit) : 50;
    const offsetRaw = query.offset ? Number(query.offset) : 0;

    const take = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100)
      : 50;
    const offset = Number.isFinite(offsetRaw) ? Math.max(Math.trunc(offsetRaw), 0) : 0;

    const where: Prisma.Sql[] = [
      Prisma.sql`sr."companyId" = ${companyId}`,
      Prisma.sql`sr."normalizedPayloadJson"->'inventoryAudit' IS NOT NULL`,
    ];

    if (status) {
      where.push(
        Prisma.sql`COALESCE(sr."normalizedPayloadJson"->'inventoryAudit'->>'status', '') = ${status}`,
      );
    }

    if (reason) {
      const reasonPattern = `%${reason}%`;
      where.push(Prisma.sql`(
        COALESCE(sr."normalizedPayloadJson"->'inventoryAudit'->>'reason', '') ILIKE ${reasonPattern}
        OR COALESCE(sr."normalizedPayloadJson"->'inventoryAudit'->>'code', '') ILIKE ${reasonPattern}
        OR COALESCE(sr."matchReason", '') ILIKE ${reasonPattern}
      )`);
    }

    if (sku) {
      const skuPattern = `%${sku}%`;
      where.push(Prisma.sql`(
        COALESCE(sr."normalizedPayloadJson"->'inventoryAudit'->>'sku', '') ILIKE ${skuPattern}
        OR COALESCE(sr."normalizedPayloadJson"->>'sku', '') ILIKE ${skuPattern}
        OR COALESCE(sr."normalizedPayloadJson"->>'skuCode', '') ILIKE ${skuPattern}
      )`);
    }

    if (importJobId) {
      where.push(Prisma.sql`sr."importJobId" = ${importJobId}`);
    }

    if (businessMonth) {
      where.push(Prisma.sql`sr."businessMonth" = ${businessMonth}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;

    const [rows, totalRows, summaryRows] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          id: string;
          importJobId: string;
          module: string;
          rowNo: number;
          businessMonth: string | null;
          matchStatus: string;
          matchReason: string | null;
          targetEntityType: string | null;
          targetEntityId: string | null;
          normalizedPayloadJson: unknown;
          createdAt: Date;
          filename: string | null;
          sourceType: string | null;
          importedAt: Date | null;
        }>
      >(Prisma.sql`
        SELECT
          sr."id",
          sr."importJobId",
          sr."module",
          sr."rowNo",
          sr."businessMonth",
          sr."matchStatus",
          sr."matchReason",
          sr."targetEntityType",
          sr."targetEntityId",
          sr."normalizedPayloadJson",
          sr."createdAt",
          ij."filename",
          ij."sourceType",
          ij."importedAt"
        FROM "ImportStagingRow" sr
        LEFT JOIN "ImportJob" ij ON ij."id" = sr."importJobId"
        ${whereSql}
        ORDER BY sr."createdAt" DESC, sr."rowNo" ASC
        LIMIT ${take}
        OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "ImportStagingRow" sr
        ${whereSql}
      `),
      this.prisma.$queryRaw<Array<{ status: string; count: number }>>(Prisma.sql`
        SELECT
          COALESCE(sr."normalizedPayloadJson"->'inventoryAudit'->>'status', 'UNKNOWN') AS status,
          COUNT(*)::int AS count
        FROM "ImportStagingRow" sr
        WHERE sr."companyId" = ${companyId}
          AND sr."normalizedPayloadJson"->'inventoryAudit' IS NOT NULL
        GROUP BY COALESCE(sr."normalizedPayloadJson"->'inventoryAudit'->>'status', 'UNKNOWN')
        ORDER BY status ASC
      `),
    ]);

    const items = rows.map((row) => {
      const payload = this.normalizeAuditIssueObject(row.normalizedPayloadJson);
      const audit = this.normalizeAuditIssueObject(payload.inventoryAudit);

      return {
        id: row.id,
        importJobId: row.importJobId,
        module: row.module,
        rowNo: row.rowNo,
        businessMonth: row.businessMonth,
        matchStatus: row.matchStatus,
        matchReason: row.matchReason,
        targetEntityType: row.targetEntityType,
        targetEntityId: row.targetEntityId,
        createdAt: row.createdAt.toISOString(),
        importJob: {
          filename: row.filename,
          sourceType: row.sourceType,
          importedAt: row.importedAt ? row.importedAt.toISOString() : null,
        },
        audit: {
          scope: audit.scope ?? 'inventory',
          status: audit.status ?? null,
          severity: audit.severity ?? null,
          code: audit.code ?? null,
          reason: audit.reason ?? null,
          sku: audit.sku ?? payload.sku ?? payload.skuCode ?? null,
          sourceType: audit.sourceType ?? null,
          sourceId: audit.sourceId ?? payload.orderId ?? payload.amazonOrderId ?? null,
          quantity: audit.quantity ?? payload.quantity ?? null,
          message: audit.message ?? null,
          createdAt: audit.createdAt ?? null,
          previousStatus: audit.previousStatus ?? null,
          resolvedAt: audit.resolvedAt ?? null,
          resolvedBy: audit.resolvedBy ?? null,
          resolutionAction: audit.resolutionAction ?? null,
          resolutionNote: audit.resolutionNote ?? null,
          linkedSkuId: audit.linkedSkuId ?? null,
          linkedSkuCode: audit.linkedSkuCode ?? null,
          linkedProductName: audit.linkedProductName ?? null,
          resolutionMovementId: audit.resolutionMovementId ?? null,
          closedReason: audit.closedReason ?? null,
        },
        source: {
          orderId: payload.orderId ?? payload.amazonOrderId ?? null,
          sku: payload.sku ?? payload.skuCode ?? null,
          productName: payload.productName ?? payload.rawLabel ?? null,
          quantity: payload.quantity ?? null,
          amount: payload.amount ?? payload.grossAmount ?? payload.netAmount ?? null,
        },
      };
    });

    const total = Number(totalRows[0]?.count ?? 0);
    const byStatus = summaryRows.map((row) => ({
      status: row.status,
      count: Number(row.count ?? 0),
    }));

    return {
      ok: true,
      domain: 'inventory',
      action: 'audit-issues',
      filters: {
        status: status || 'ALL',
        reason: reason || null,
        sku: sku || null,
        importJobId: importJobId || null,
        businessMonth: businessMonth || null,
      },
      items,
      total,
      page: {
        limit: take,
        offset,
        hasMore: offset + items.length < total,
      },
      summary: {
        totalIssues: byStatus.reduce((sum, row) => sum + row.count, 0),
        openIssues: byStatus
          .filter((row) => row.status === 'OPEN')
          .reduce((sum, row) => sum + row.count, 0),
        byStatus,
      },
      message: 'inventory audit issues loaded',
    };
  }

  private resolveAuditOccurredAt(values: unknown[], fallback: Date): Date {
    for (const value of values) {
      if (value === undefined || value === null || value === '') continue;

      const parsed = value instanceof Date ? value : new Date(String(value));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return fallback;
  }

  async resolveAuditIssue(auditIssueId: string, payload: unknown) {
    const body = (payload ?? {}) as AuditIssueResolvePayload;
    const companyId = await this.resolveCompanyId();

    const issueId = String(auditIssueId || '').trim();
    if (!issueId) {
      throw new BadRequestException('audit issue id is required.');
    }

    const skuId = String(body.skuId || '').trim();
    const skuCode = String(body.skuCode || '').trim();

    if (!skuId && !skuCode) {
      throw new BadRequestException('skuId or skuCode is required.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const issue = await tx.importStagingRow.findFirst({
        where: {
          id: issueId,
          companyId,
        },
        select: {
          id: true,
          companyId: true,
          importJobId: true,
          module: true,
          rowNo: true,
          businessMonth: true,
          matchStatus: true,
          matchReason: true,
          targetEntityType: true,
          targetEntityId: true,
          normalizedPayloadJson: true,
          createdAt: true,
          importJob: {
            select: {
              importedAt: true,
              filename: true,
              sourceType: true,
            },
          },
        },
      });

      if (!issue) {
        throw new NotFoundException('Inventory audit issue was not found.');
      }

      const normalizedPayload = this.normalizeAuditIssueObject(issue.normalizedPayloadJson);
      const currentAudit = this.normalizeAuditIssueObject(normalizedPayload.inventoryAudit);

      if (!currentAudit || Object.keys(currentAudit).length === 0) {
        throw new BadRequestException('ImportStagingRow does not contain inventoryAudit payload.');
      }

      const currentStatus = String(currentAudit.status || '').trim().toUpperCase();
      if (currentStatus && currentStatus !== 'OPEN') {
        throw new BadRequestException(`inventoryAudit is not OPEN. current status: ${currentStatus}`);
      }

      const sku = await tx.productSku.findFirst({
        where: {
          companyId,
          ...(skuId ? { id: skuId } : {}),
          ...(skuCode ? { skuCode } : {}),
        },
        select: {
          id: true,
          skuCode: true,
          name: true,
          companyId: true,
          storeId: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!sku) {
        throw new NotFoundException('ProductSku not found for this company.');
      }

      const rawQuantity = currentAudit.quantity ?? normalizedPayload.quantity;
      const quantity = Math.abs(this.parseInteger(rawQuantity, 'inventoryAudit.quantity'));

      if (quantity <= 0) {
        throw new BadRequestException('inventoryAudit.quantity must be greater than zero.');
      }

      const occurredAt = this.resolveAuditOccurredAt(
        [
          normalizedPayload.orderDate,
          normalizedPayload.occurredAt,
          currentAudit.createdAt,
          issue.importJob?.importedAt,
        ],
        issue.createdAt,
      );

      const movement = await tx.inventoryMovement.create({
        data: {
          companyId,
          skuId: sku.id,
          type: InventoryMovementType.OUT,
          quantity: -quantity,
          occurredAt,
          sourceType: 'INVENTORY_AUDIT_RESOLUTION',
          sourceId: issue.id,
          importJobId: issue.importJobId,
          sourceRowNo: issue.rowNo,
          transactionId: issue.targetEntityId,
          businessMonth: issue.businessMonth,
          memo: [
            '[inventory-audit-resolution]',
            `[audit_issue_id:${issue.id}]`,
            `[linked_sku:${sku.skuCode}]`,
            body.note?.trim() ? body.note.trim() : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
      });

      const currentBalance = await tx.inventoryBalance.findUnique({
        where: {
          companyId_skuId: {
            companyId,
            skuId: sku.id,
          },
        },
        select: {
          quantity: true,
          reservedQty: true,
          alertLevel: true,
        },
      });

      const nextQuantity = Number(currentBalance?.quantity ?? 0) - quantity;

      const balance = await tx.inventoryBalance.upsert({
        where: {
          companyId_skuId: {
            companyId,
            skuId: sku.id,
          },
        },
        create: {
          companyId,
          skuId: sku.id,
          quantity: nextQuantity,
          reservedQty: 0,
          alertLevel: 0,
        },
        update: {
          quantity: nextQuantity,
        },
        select: {
          id: true,
          quantity: true,
          reservedQty: true,
          alertLevel: true,
          updatedAt: true,
        },
      });

      const resolvedAt = new Date().toISOString();
      const nextAudit = {
        ...currentAudit,
        status: 'CLOSED',
        previousStatus: currentStatus || 'OPEN',
        resolvedAt,
        resolvedBy: 'system',
        resolutionAction: 'LINK_EXISTING_SKU_AND_DEDUCT',
        resolutionNote: body.note?.trim() || null,
        linkedSkuId: sku.id,
        linkedSkuCode: sku.skuCode,
        linkedProductName: sku.product?.name ?? sku.name ?? null,
        resolutionMovementId: movement.id,
        closedReason: 'RESOLVED_BY_SKU_MAPPING',
      };

      const nextPayload = {
        ...normalizedPayload,
        inventoryAudit: nextAudit,
      };

      const updatedIssue = await tx.importStagingRow.update({
        where: {
          id: issue.id,
        },
        data: {
          normalizedPayloadJson: nextPayload as Prisma.InputJsonValue,
          matchReason: `INVENTORY_AUDIT_RESOLVED:LINK_EXISTING_SKU:${sku.skuCode}`,
        },
        select: {
          id: true,
          importJobId: true,
          module: true,
          rowNo: true,
          businessMonth: true,
          matchStatus: true,
          matchReason: true,
          normalizedPayloadJson: true,
          createdAt: true,
        },
      });

      return {
        issue: updatedIssue,
        audit: nextAudit,
        sku,
        movement,
        balance,
        quantity,
      };
    });

    const balanceQuantity = Number(result.balance.quantity ?? 0);
    const reservedQty = Number(result.balance.reservedQty ?? 0);
    const alertLevel = Number(result.balance.alertLevel ?? 0);
    const availableQty = balanceQuantity - reservedQty;
    const stockStatus = this.getStockStatus(balanceQuantity, reservedQty, alertLevel);

    return {
      ok: true,
      domain: 'inventory',
      action: 'resolve-audit-issue',
      item: {
        auditIssueId: result.issue.id,
        importJobId: result.issue.importJobId,
        module: result.issue.module,
        rowNo: result.issue.rowNo,
        businessMonth: result.issue.businessMonth,
        matchStatus: result.issue.matchStatus,
        matchReason: result.issue.matchReason,
        audit: result.audit,
        sku: {
          id: result.sku.id,
          skuCode: result.sku.skuCode,
          name: result.sku.name ?? result.sku.product?.name ?? null,
          productName: result.sku.product?.name ?? null,
        },
        movement: {
          id: result.movement.id,
          type: result.movement.type,
          quantity: result.movement.quantity,
          occurredAt: result.movement.occurredAt.toISOString(),
          sourceType: result.movement.sourceType,
          sourceId: result.movement.sourceId,
        },
        balance: {
          id: result.balance.id,
          quantity: balanceQuantity,
          reservedQty,
          availableQty,
          alertLevel,
          stockStatus,
          stockStatusLabel: this.getStockStatusLabel(stockStatus),
          updatedAt: result.balance.updatedAt.toISOString(),
        },
      },
      message: 'inventory audit issue resolved',
    };
  }

  async createManualAdjustment(payload: unknown) {
    const body = (payload ?? {}) as ManualAdjustmentPayload;
    const companyId = await this.resolveCompanyId();

    const type = this.normalizeMovementType(body.type);
    const rawQuantity =
      body.quantityDelta !== undefined && body.quantityDelta !== null && body.quantityDelta !== ''
        ? this.parseInteger(body.quantityDelta, 'quantityDelta')
        : this.parseInteger(body.quantity, 'quantity');

    if (rawQuantity === 0) {
      throw new BadRequestException('quantity must not be zero.');
    }

    let delta = rawQuantity;
    if (type === InventoryMovementType.IN) {
      delta = Math.abs(rawQuantity);
    } else if (type === InventoryMovementType.OUT) {
      delta = -Math.abs(rawQuantity);
    }

    const sku = await this.prisma.productSku.findFirst({
      where: {
        companyId,
        ...(body.skuId ? { id: body.skuId } : {}),
        ...(body.skuCode ? { skuCode: body.skuCode } : {}),
      },
      select: {
        id: true,
        skuCode: true,
        name: true,
        companyId: true,
        storeId: true,
      },
    });

    if (!sku) {
      throw new NotFoundException('ProductSku not found for this company.');
    }

    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException('occurredAt must be a valid date.');
    }

    const sourceRowNo = this.parseOptionalInteger(body.sourceRowNo, 'sourceRowNo');

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.inventoryBalance.findUnique({
        where: {
          companyId_skuId: {
            companyId,
            skuId: sku.id,
          },
        },
        select: {
          id: true,
          quantity: true,
          reservedQty: true,
          alertLevel: true,
        },
      });

      const nextQuantity = Number(current?.quantity ?? 0) + delta;

      const movement = await tx.inventoryMovement.create({
        data: {
          companyId,
          skuId: sku.id,
          type,
          quantity: delta,
          occurredAt,
          sourceType: body.sourceType?.trim() || 'MANUAL',
          sourceId: body.sourceId?.trim() || null,
          importJobId: body.importJobId?.trim() || null,
          sourceRowNo: sourceRowNo ?? null,
          transactionId: body.transactionId?.trim() || null,
          businessMonth: body.businessMonth?.trim() || null,
          memo: body.memo?.trim() || null,
        },
      });

      const balance = await tx.inventoryBalance.upsert({
        where: {
          companyId_skuId: {
            companyId,
            skuId: sku.id,
          },
        },
        create: {
          companyId,
          skuId: sku.id,
          quantity: nextQuantity,
          reservedQty: 0,
          alertLevel: 0,
        },
        update: {
          quantity: nextQuantity,
        },
        select: {
          id: true,
          quantity: true,
          reservedQty: true,
          alertLevel: true,
          updatedAt: true,
        },
      });

      return { movement, balance };
    });

    const quantity = Number(result.balance.quantity ?? 0);
    const reservedQty = Number(result.balance.reservedQty ?? 0);
    const alertLevel = Number(result.balance.alertLevel ?? 0);
    const availableQty = quantity - reservedQty;
    const stockStatus = this.getStockStatus(quantity, reservedQty, alertLevel);

    return {
      ok: true,
      domain: 'inventory',
      action: 'manual-adjustment',
      item: {
        movementId: result.movement.id,
        balanceId: result.balance.id,
        skuId: sku.id,
        skuCode: sku.skuCode,
        type,
        quantityDelta: delta,
        quantity,
        reservedQty,
        availableQty,
        alertLevel,
        stockStatus,
        stockStatusLabel: this.getStockStatusLabel(stockStatus),
        occurredAt: result.movement.occurredAt.toISOString(),
      },
      message: 'inventory manual adjustment created',
    };
  }

  create(payload: unknown) {
    return this.createManualAdjustment(payload);
  }
}
