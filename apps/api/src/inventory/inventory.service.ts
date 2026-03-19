import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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

  async list() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.inventoryBalance.findMany({
      where: { companyId },
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

    const items = rows.map((row) => {
      const quantity = Number(row.quantity ?? 0);
      const reservedQty = Number(row.reservedQty ?? 0);
      const availableQty = quantity - reservedQty;
      const alertLevel = Number(row.alertLevel ?? 0);

      let stockStatus = '正常';
      if (quantity <= 0) {
        stockStatus = '欠品';
      } else if (availableQty <= alertLevel) {
        stockStatus = '要補充';
      }

      return {
        id: row.id,
        skuId: row.sku.id,
        sku: row.sku.skuCode,
        name: row.sku.name?.trim() || row.sku.product?.name?.trim() || '-',
        store: row.sku.store?.name?.trim() || '未設定',
        storeId: row.sku.store?.id ?? null,
        quantity,
        reservedQty,
        availableQty,
        alertLevel,
        stockStatus,
        isActive: row.sku.isActive,
        updatedAt: row.updatedAt.toISOString(),
      };
    });

    return {
      ok: true,
      domain: 'inventory',
      action: 'list',
      items,
      total: items.length,
      message: 'inventory balances loaded',
    };
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
        },
      }),
    ]);

    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;

    for (const row of rows) {
      const quantity = Number(row.quantity ?? 0);
      const reservedQty = Number(row.reservedQty ?? 0);
      const alertLevel = Number(row.alertLevel ?? 0);
      const availableQty = quantity - reservedQty;

      if (quantity <= 0) {
        outOfStock += 1;
      } else if (availableQty <= alertLevel) {
        lowStock += 1;
      } else {
        healthy += 1;
      }
    }

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
      ],
      summary: {
        total: rows.length,
        healthy,
        lowStock,
        outOfStock,
      },
      message: 'inventory meta loaded',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'inventory',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'inventory create stub',
    };
  }
}
