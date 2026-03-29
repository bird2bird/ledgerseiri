import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type GetListArgs = {
  page?: string;
  limit?: string;
  q?: string;
  actionType?: string;
  source?: string;
  changed?: string;
  companyId?: string;
  candidateId?: string;
  persistenceKey?: string;
};

@Injectable()
export class PlatformReconciliationListService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(args: GetListArgs) {
    const parsedPage = Number(args.page ?? 1);
    const parsedLimit = Number(args.limit ?? 20);

    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 20;

    const where: any = {
      ...(args.actionType ? { actionType: args.actionType } : {}),
      ...(args.source ? { source: args.source } : {}),
      ...(args.companyId
        ? {
            companyId: {
              contains: args.companyId,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(args.candidateId
        ? {
            candidateId: {
              contains: args.candidateId,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(args.persistenceKey
        ? {
            persistenceKey: {
              contains: args.persistenceKey,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    if (args.q) {
      const q = args.q.trim();
      if (q) {
        where.OR = [
          { companyId: { contains: q, mode: 'insensitive' } },
          { candidateId: { contains: q, mode: 'insensitive' } },
          { persistenceKey: { contains: q, mode: 'insensitive' } },
          { previousValue: { contains: q, mode: 'insensitive' } },
          { nextValue: { contains: q, mode: 'insensitive' } },
          { actionType: { contains: q, mode: 'insensitive' } },
          { source: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const rows = await this.prisma.reconciliationDecisionAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const normalized = rows
      .map((row) => ({
        id: row.id,
        companyId: row.companyId,
        candidateId: row.candidateId,
        persistenceKey: row.persistenceKey ?? null,
        actionType: row.actionType,
        source: row.source,
        previousValue: row.previousValue ?? null,
        nextValue: row.nextValue ?? null,
        changed: (row.previousValue ?? null) !== (row.nextValue ?? null),
        createdAt: row.createdAt.toISOString(),
        submittedAt: row.createdAt.toISOString(),
      }))
      .filter((row) => {
        if (!args.changed) return true;
        if (args.changed === 'true') return row.changed === true;
        if (args.changed === 'false') return row.changed === false;
        return true;
      });

    const total = normalized.length;
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = normalized.slice(start, start + limit);

    return {
      items,
      total,
      page: safePage,
      limit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      filters: {
        q: args.q ?? null,
        actionType: args.actionType ?? null,
        source: args.source ?? null,
        changed: args.changed ?? null,
        companyId: args.companyId ?? null,
        candidateId: args.candidateId ?? null,
        persistenceKey: args.persistenceKey ?? null,
      },
    };
  }
}
