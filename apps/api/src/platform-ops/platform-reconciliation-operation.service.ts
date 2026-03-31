import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlatformOperationService } from './platform-operation.service';

const MAX_BATCH_OVERRIDE_SIZE = 20;
const MIN_GOVERNANCE_NOTE_LENGTH = 8;

@Injectable()
export class PlatformReconciliationOperationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformOperationService: PlatformOperationService,
  ) {}

  async batchOverride(args: {
    ids: string[];
    decision: string;
    dryRun?: boolean;
    note?: string;
    adminId?: string | null;
    adminEmail?: string | null;
  }) {
    const ids = Array.from(new Set((args.ids || []).filter(Boolean)));
    const decision = args.decision;
    const dryRun = !!args.dryRun;
    const governanceNote = (args.note || '').trim();

    if (governanceNote.length < MIN_GOVERNANCE_NOTE_LENGTH) {
      throw new Error('GOVERNANCE_NOTE_REQUIRED');
    }
    if (ids.length > MAX_BATCH_OVERRIDE_SIZE) {
      throw new Error('BATCH_THRESHOLD_EXCEEDED');
    }

    if (dryRun) {
      const candidates = await this.prisma.reconciliationDecision.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          companyId: true,
          candidateId: true,
          decision: true,
          persistenceKey: true,
        },
      });

      return {
        dryRun: true,
        requested: ids.length,
        found: candidates.length,
        missing: ids.filter((id) => !candidates.some((x) => x.id === id)),
        preview: candidates.map((row) => ({
          id: row.id,
          companyId: row.companyId,
          candidateId: row.candidateId,
          currentDecision: row.decision,
          nextDecision: decision,
          persistenceKey: row.persistenceKey,
        })),
      };
    }

    const operation = await this.platformOperationService.createOperation({
      type: 'RECONCILIATION_BATCH_OVERRIDE',
      scope: 'RECONCILIATION',
      status: 'RUNNING',
      requestedDecision: decision,
      requestedByAdminId: args.adminId || null,
      requestedByAdminEmail: args.adminEmail || null,
      source: 'review_queue',
      note: governanceNote,
      requestedCount: ids.length,
    });

    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const before = await tx.reconciliationDecision.findUnique({
            where: { id },
            select: {
              id: true,
              companyId: true,
              candidateId: true,
              persistenceKey: true,
              decision: true,
            },
          });

          if (!before) throw new Error('NOT_FOUND');

          const updated = await tx.reconciliationDecision.update({
            where: { id },
            data: {
              decision,
              updatedAt: new Date(),
            },
          });

          const audit = await tx.reconciliationDecisionAudit.create({
            data: {
              companyId: updated.companyId,
              candidateId: updated.candidateId,
              persistenceKey: updated.persistenceKey ?? null,
              actionType: decision === 'APPROVED' ? ('override_approve' as any) : ('override_reject' as any),
              source: 'admin' as any,
              previousValue: before.decision ?? null,
              nextValue: updated.decision,
            },
            select: { id: true },
          });

          return { before, updated, auditId: audit.id };
        });

        await this.platformOperationService.createOperationItem({
          operationId: operation.id,
          targetType: 'RECONCILIATION_DECISION',
          targetId: id,
          companyId: result.updated.companyId,
          candidateId: result.updated.candidateId,
          persistenceKey: result.updated.persistenceKey ?? null,
          requestedAction: `BATCH_OVERRIDE_${decision}`,
          beforeValue: result.before.decision ?? null,
          afterValue: result.updated.decision,
          status: 'SUCCEEDED',
          auditId: result.auditId,
        });

        success += 1;
      } catch (error) {
        await this.platformOperationService.createOperationItem({
          operationId: operation.id,
          targetType: 'RECONCILIATION_DECISION',
          targetId: id,
          requestedAction: `BATCH_OVERRIDE_${decision}`,
          status: 'FAILED',
          failureCode: 'EXECUTION_ERROR',
          failureMessage: error instanceof Error ? error.message : String(error),
        });
        failed += 1;
      }
    }

    const status =
      failed === 0 ? 'COMPLETED' :
      success === 0 ? 'FAILED' :
      'PARTIAL_FAILED';

    const updatedOp = await this.platformOperationService.updateOperation(operation.id, {
      status: status as any,
      successCount: success,
      failedCount: failed,
      completedAt: new Date(),
      metadataJson: {
        stage: 'STEP76_GOVERNANCE_V2',
        governance: 'batch_override_confirmed',
        reasonValidated: true,
        thresholdReviewed: true,
        protectedScopeChecked: true,
        maxBatchOverrideSize: MAX_BATCH_OVERRIDE_SIZE,
      },
    });

    return {
      dryRun: false,
      operation: updatedOp,
      success,
      failed,
    };
  }

  async retryFailed(operationId: string) {
    const failedTargetIds = await this.platformOperationService.listFailedTargetIds(operationId);
    const source = await this.platformOperationService.getOperation(operationId);

    if (!source) throw new Error('OPERATION_NOT_FOUND');

    return this.batchOverride({
      ids: failedTargetIds,
      decision: source.requestedDecision || 'APPROVED',
      dryRun: false,
      note: `retry failed from ${operationId}`,
      adminId: source.requestedByAdminId || null,
      adminEmail: source.requestedByAdminEmail || null,
    });
  }
}
