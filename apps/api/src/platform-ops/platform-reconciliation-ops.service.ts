import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type GetOpsSummaryArgs = {
  companyId?: string;
  candidateId?: string;
  persistenceKey?: string;
};

@Injectable()
export class PlatformReconciliationOpsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpsSummary(args: GetOpsSummaryArgs) {
    const where: any = {
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

    const rows = await this.prisma.reconciliationDecisionAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        actionType: true,
        source: true,
        previousValue: true,
        nextValue: true,
        createdAt: true,
      },
    });

    const totalAuditRows = rows.length;
    const changedRows = rows.filter(
      (row) => (row.previousValue ?? null) !== (row.nextValue ?? null),
    ).length;
    const adminRows = rows.filter((row) => row.source === 'admin').length;
    const overrideRows = rows.filter(
      (row) =>
        row.actionType === 'override_approve' ||
        row.actionType === 'override_reject',
    ).length;
    const failedSignals = rows.filter(
      (row) => row.actionType === 'override_reject' || row.actionType === 'batch_reject',
    ).length;
    const actionableSignals = Math.max(changedRows - failedSignals, 0);
    const latestAuditAt = rows[0]?.createdAt?.toISOString() ?? null;

    return {
      totalAuditRows,
      changedRows,
      adminRows,
      overrideRows,
      failedSignals,
      actionableSignals,
      latestAuditAt,
      filters: {
        companyId: args.companyId ?? null,
        candidateId: args.candidateId ?? null,
        persistenceKey: args.persistenceKey ?? null,
      },
    };
  }
}
