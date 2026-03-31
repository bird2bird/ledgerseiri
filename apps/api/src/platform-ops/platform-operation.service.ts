import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type PlatformOperationTypeValue =
  | 'RECONCILIATION_BATCH_OVERRIDE'
  | 'TENANT_SUSPEND'
  | 'TENANT_ACTIVATE'
  | 'USER_ASSIGN'
  | 'USER_UNASSIGN';

type PlatformOperationScopeValue =
  | 'RECONCILIATION'
  | 'PLATFORM_TENANT'
  | 'PLATFORM_USER';

type PlatformOperationStatusValue =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL_FAILED'
  | 'FAILED';

type PlatformOperationItemStatusValue =
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED';

type CreatePlatformOperationArgs = {
  type: PlatformOperationTypeValue;
  scope: PlatformOperationScopeValue;
  status?: PlatformOperationStatusValue;
  requestedDecision?: string | null;
  requestedByAdminId?: string | null;
  requestedByAdminEmail?: string | null;
  companyId?: string | null;
  candidateId?: string | null;
  persistenceKey?: string | null;
  source?: string | null;
  note?: string | null;
  metadataJson?: any;
  requestedCount?: number;
  successCount?: number;
  failedCount?: number;
  completedAt?: Date | null;
};

type CreatePlatformOperationItemArgs = {
  operationId: string;
  targetType: string;
  targetId: string;
  companyId?: string | null;
  candidateId?: string | null;
  persistenceKey?: string | null;
  requestedAction: string;
  beforeValue?: string | null;
  afterValue?: string | null;
  status: PlatformOperationItemStatusValue;
  failureCode?: string | null;
  failureMessage?: string | null;
  auditId?: string | null;
};

@Injectable()
export class PlatformOperationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOperation(args: CreatePlatformOperationArgs) {
    return this.prisma.platformOperation.create({
      data: {
        type: args.type as any,
        scope: args.scope as any,
        status: (args.status ?? 'PENDING') as any,
        requestedDecision: args.requestedDecision ?? null,
        requestedByAdminId: args.requestedByAdminId ?? null,
        requestedByAdminEmail: args.requestedByAdminEmail ?? null,
        companyId: args.companyId ?? null,
        candidateId: args.candidateId ?? null,
        persistenceKey: args.persistenceKey ?? null,
        source: args.source ?? null,
        note: args.note ?? null,
        metadataJson: args.metadataJson ?? null,
        requestedCount: args.requestedCount ?? 0,
        successCount: args.successCount ?? 0,
        failedCount: args.failedCount ?? 0,
        completedAt: args.completedAt ?? null,
      },
    });
  }

  async updateOperation(
    id: string,
    patch: Partial<{
      status: PlatformOperationStatusValue;
      successCount: number;
      failedCount: number;
      completedAt: Date | null;
      metadataJson: any;
    }>
  ) {
    return this.prisma.platformOperation.update({
      where: { id },
      data: {
        ...(patch.status ? { status: patch.status as any } : {}),
        ...(patch.successCount !== undefined ? { successCount: patch.successCount } : {}),
        ...(patch.failedCount !== undefined ? { failedCount: patch.failedCount } : {}),
        ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {}),
        ...(patch.metadataJson !== undefined ? { metadataJson: patch.metadataJson } : {}),
      },
    });
  }

  async createOperationItem(args: CreatePlatformOperationItemArgs) {
    return this.prisma.platformOperationItem.create({
      data: {
        operationId: args.operationId,
        targetType: args.targetType,
        targetId: args.targetId,
        companyId: args.companyId ?? null,
        candidateId: args.candidateId ?? null,
        persistenceKey: args.persistenceKey ?? null,
        requestedAction: args.requestedAction,
        beforeValue: args.beforeValue ?? null,
        afterValue: args.afterValue ?? null,
        status: args.status as any,
        failureCode: args.failureCode ?? null,
        failureMessage: args.failureMessage ?? null,
        auditId: args.auditId ?? null,
      },
    });
  }

  async listOperations(args?: {
    scope?: string;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const parsedPage = Number(args?.page ?? 1);
    const parsedLimit = Number(args?.limit ?? 20);

    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 20;

    const where: any = {
      ...(args?.scope ? { scope: args.scope as any } : {}),
      ...(args?.status ? { status: args.status as any } : {}),
    };

    const q = (args?.q || '').trim();
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { type: { equals: q as any } },
        { scope: { equals: q as any } },
        { status: { equals: q as any } },
        { requestedDecision: { contains: q, mode: 'insensitive' } },
        { companyId: { contains: q, mode: 'insensitive' } },
        { candidateId: { contains: q, mode: 'insensitive' } },
        { persistenceKey: { contains: q, mode: 'insensitive' } },
        { source: { contains: q, mode: 'insensitive' } },
        { note: { contains: q, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.platformOperation.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);

    const items = await this.prisma.platformOperation.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      skip: (safePage - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page: safePage,
      limit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      filters: {
        scope: args?.scope ?? null,
        status: args?.status ?? null,
        q: q || null,
      },
    };
  }

  async getOperation(id: string) {
    return this.prisma.platformOperation.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { processedAt: 'asc' },
        },
      },
    });
  }

  async getOperationWithItems(id: string) {
    return this.prisma.platformOperation.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { processedAt: 'asc' },
        },
      },
    });
  }

  async listFailedTargetIds(operationId: string) {
    const rows = await this.prisma.platformOperationItem.findMany({
      where: {
        operationId,
        status: 'FAILED' as any,
      },
      orderBy: { processedAt: 'asc' },
      select: {
        targetId: true,
      },
    });

    return rows.map((row) => row.targetId);
  }


  async getOperationAuditLinks(id: string) {
    const operation = await this.prisma.platformOperation.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { processedAt: 'asc' },
        },
      },
    });

    if (!operation) {
      return {
        operation: null,
        auditIds: [],
        items: [],
      };
    }

    const auditIds = Array.from(
      new Set(
        (operation.items || [])
          .map((item) => item.auditId)
          .filter(Boolean)
      )
    );

    return {
      operation: {
        id: operation.id,
        scope: operation.scope,
        type: operation.type,
        status: operation.status,
      },
      auditIds,
      items: operation.items.map((item) => ({
        id: item.id,
        targetId: item.targetId,
        auditId: item.auditId,
        status: item.status,
      })),
    };
  }



  async getMetrics() {
    const operations = await this.prisma.platformOperation.findMany({
      include: {
        items: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: 500,
    });

    const total = operations.length;
    const running = operations.filter((x) => x.status === 'RUNNING').length;
    const completed = operations.filter((x) => x.status === 'COMPLETED').length;
    const partialFailed = operations.filter((x) => x.status === 'PARTIAL_FAILED').length;
    const failed = operations.filter((x) => x.status === 'FAILED').length;

    const retryCapable = operations.filter((op) =>
      (op.items || []).some((item) => item.status === 'FAILED')
    ).length;

    const scopeMap = new Map<string, number>();
    const failureCodeMap = new Map<string, number>();

    for (const op of operations) {
      scopeMap.set(op.scope, (scopeMap.get(op.scope) || 0) + 1);
      for (const item of op.items || []) {
        if (item.failureCode) {
          failureCodeMap.set(item.failureCode, (failureCodeMap.get(item.failureCode) || 0) + 1);
        }
      }
    }

    const byScope = Array.from(scopeMap.entries()).map(([scope, count]) => ({
      scope,
      count,
    }));

    const topFailureCodes = Array.from(failureCodeMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      running,
      completed,
      partialFailed,
      failed,
      retryCapable,
      byScope,
      topFailureCodes,
    };
  }



  async getAnalytics() {
    const operations = await this.prisma.platformOperation.findMany({
      include: {
        items: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: 500,
    });

    const recentWindow = operations.slice(0, 30);

    const failureTrend = recentWindow.map((op) => ({
      id: op.id,
      requestedAt: op.requestedAt,
      scope: op.scope,
      failedCount: op.failedCount ?? 0,
      successCount: op.successCount ?? 0,
      status: op.status,
    }));

    const scopeStatusMap = new Map<string, number>();
    const retryStatsMap = new Map<string, { total: number; retryCapable: number; successful: number }>();
    const failureCodeMap = new Map<string, number>();
    const failingTargetMap = new Map<string, { targetId: string; count: number; scope: string; lastFailureCode: string | null }>();
    const noisyCompanyMap = new Map<string, number>();
    const noisyCandidateMap = new Map<string, number>();

    for (const op of operations) {
      const scopeStatusKey = `${op.scope}__${op.status}`;
      scopeStatusMap.set(scopeStatusKey, (scopeStatusMap.get(scopeStatusKey) || 0) + 1);

      if (!retryStatsMap.has(op.scope)) {
        retryStatsMap.set(op.scope, { total: 0, retryCapable: 0, successful: 0 });
      }
      const retryStats = retryStatsMap.get(op.scope)!;
      retryStats.total += 1;

      let opHasFailedItems = false;
      let opHasSuccess = (op.successCount ?? 0) > 0;

      for (const item of op.items || []) {
        if (item.status === 'FAILED') {
          opHasFailedItems = true;

          if (item.failureCode) {
            failureCodeMap.set(item.failureCode, (failureCodeMap.get(item.failureCode) || 0) + 1);
          }

          const targetKey = `${op.scope}__${item.targetId}`;
          const prev = failingTargetMap.get(targetKey) || {
            targetId: item.targetId,
            count: 0,
            scope: op.scope,
            lastFailureCode: item.failureCode ?? null,
          };
          prev.count += 1;
          prev.lastFailureCode = item.failureCode ?? prev.lastFailureCode;
          failingTargetMap.set(targetKey, prev);

          if (item.companyId) {
            noisyCompanyMap.set(item.companyId, (noisyCompanyMap.get(item.companyId) || 0) + 1);
          }
          if (item.candidateId) {
            noisyCandidateMap.set(item.candidateId, (noisyCandidateMap.get(item.candidateId) || 0) + 1);
          }
        }
      }

      if (opHasFailedItems) {
        retryStats.retryCapable += 1;
      }
      if (opHasSuccess && !opHasFailedItems) {
        retryStats.successful += 1;
      }
    }

    const scopeByStatus = Array.from(scopeStatusMap.entries()).map(([key, count]) => {
      const [scope, status] = key.split('__');
      return { scope, status, count };
    });

    const retryPerformanceByScope = Array.from(retryStatsMap.entries()).map(([scope, stats]) => ({
      scope,
      total: stats.total,
      retryCapable: stats.retryCapable,
      successful: stats.successful,
      successRate: stats.total > 0 ? Number(((stats.successful / stats.total) * 100).toFixed(1)) : 0,
    }));

    const topFailureCodes = Array.from(failureCodeMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentFailingTargets = Array.from(failingTargetMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const noisyCompanies = Array.from(noisyCompanyMap.entries())
      .map(([companyId, count]) => ({ companyId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const noisyCandidates = Array.from(noisyCandidateMap.entries())
      .map(([candidateId, count]) => ({ candidateId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      failureTrend,
      scopeByStatus,
      retryPerformanceByScope,
      topFailureCodes,
      recentFailingTargets,
      noisyCompanies,
      noisyCandidates,
    };
  }

}
