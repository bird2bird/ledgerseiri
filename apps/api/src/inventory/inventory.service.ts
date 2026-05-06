import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryMovementType } from '@prisma/client';
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
