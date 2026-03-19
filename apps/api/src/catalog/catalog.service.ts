import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CatalogService {
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

    const rows = await this.prisma.productSku.findMany({
      where: {
        companyId,
      },
      select: {
        id: true,
        skuCode: true,
        isActive: true,
        name: true,
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
            isActive: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    const items = rows.map((row) => ({
      id: row.id,
      name: row.name?.trim() || row.product?.name?.trim() || '-',
      sku: row.skuCode,
      store: row.store?.name?.trim() || '未設定',
      status: row.isActive ? '販売中' : '停止中',
      productId: row.product?.id ?? null,
      storeId: row.store?.id ?? null,
      brand: row.product?.brand ?? null,
      category: row.product?.category ?? null,
    }));

    return {
      ok: true,
      domain: 'products',
      action: 'list',
      items,
      total: items.length,
      message: 'products list loaded',
    };
  }

  async getMeta() {
    const companyId = await this.resolveCompanyId();

    const [stores, counts] = await Promise.all([
      this.prisma.store.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
        },
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.productSku.groupBy({
        by: ['isActive'],
        where: { companyId },
        _count: {
          _all: true,
        },
      }),
    ]);

    const activeCount =
      counts.find((x) => x.isActive === true)?._count._all ?? 0;
    const inactiveCount =
      counts.find((x) => x.isActive === false)?._count._all ?? 0;

    return {
      ok: true,
      domain: 'products',
      action: 'meta',
      stores: [
        { value: '', label: 'すべての店舗' },
        ...stores.map((store) => ({
          value: store.id,
          label: store.name,
        })),
      ],
      statuses: [
        { value: '', label: 'すべての状態' },
        { value: 'active', label: '販売中' },
        { value: 'inactive', label: '停止中' },
      ],
      summary: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
      },
      message: 'products meta loaded',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'products',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'products create stub',
    };
  }
}
