import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreatePlatformOperationArgs = {
  type: 'RECONCILIATION_BATCH_OVERRIDE';
  scope: 'RECONCILIATION';
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED';
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
  status: 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
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
      status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED';
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

  async listOperations(scope?: 'RECONCILIATION', limit = 20) {
    return this.prisma.platformOperation.findMany({
      where: scope ? { scope: scope as any } : undefined,
      orderBy: { requestedAt: 'desc' },
      take: Math.max(1, Math.min(limit, 100)),
    });
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

}
