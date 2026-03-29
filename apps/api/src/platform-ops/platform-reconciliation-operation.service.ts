import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlatformOperationService } from './platform-operation.service';

type BatchOverrideArgs = {
  ids: string[];
  decision: 'APPROVED' | 'REJECTED';
  source?: string;
  note?: string;
  requestedByAdminId?: string | null;
  requestedByAdminEmail?: string | null;
};

@Injectable()
export class PlatformReconciliationOperationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformOperationService: PlatformOperationService,
  ) {}

  async batchOverride(args: BatchOverrideArgs) {
    const ids = Array.from(new Set((args.ids || []).filter(Boolean)));
    const requestedCount = ids.length;

    const operation = await this.platformOperationService.createOperation({
      type: 'RECONCILIATION_BATCH_OVERRIDE',
      scope: 'RECONCILIATION',
      status: 'RUNNING',
      requestedDecision: args.decision,
      requestedByAdminId: args.requestedByAdminId ?? null,
      requestedByAdminEmail: args.requestedByAdminEmail ?? null,
      source: args.source ?? 'review_queue',
      note: args.note ?? null,
      requestedCount,
    });

    const items: any[] = [];
    const failedIds: string[] = [];

    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const current = await tx.reconciliationDecision.findUnique({
            where: { id },
            select: {
              id: true,
              companyId: true,
              candidateId: true,
              persistenceKey: true,
              decision: true,
            },
          });

          if (!current) {
            return {
              kind: 'NOT_FOUND' as const,
              id,
            };
          }

          const updated = await tx.reconciliationDecision.update({
            where: { id: current.id },
            data: {
              decision: args.decision,
              updatedAt: new Date(),
            },
            select: {
              id: true,
              companyId: true,
              candidateId: true,
              persistenceKey: true,
              decision: true,
            },
          });

          const audit = await tx.reconciliationDecisionAudit.create({
            data: {
              companyId: updated.companyId,
              candidateId: updated.candidateId,
              persistenceKey: updated.persistenceKey ?? null,
              actionType:
                args.decision === 'APPROVED'
                  ? ('override_approve' as any)
                  : ('override_reject' as any),
              source: 'admin' as any,
              previousValue: current.decision ?? null,
              nextValue: updated.decision,
            },
            select: {
              id: true,
            },
          });

          return {
            kind: 'UPDATED' as const,
            current,
            updated,
            auditId: audit.id,
          };
        });

        if (result.kind === 'NOT_FOUND') {
          failed += 1;
          failedIds.push(id);

          const item = await this.platformOperationService.createOperationItem({
            operationId: operation.id,
            targetType: 'RECONCILIATION_DECISION',
            targetId: id,
            requestedAction:
              args.decision === 'APPROVED'
                ? 'OVERRIDE_APPROVE'
                : 'OVERRIDE_REJECT',
            status: 'FAILED',
            failureCode: 'NOT_FOUND',
            failureMessage: 'Reconciliation decision not found',
          });

          items.push(item);
          continue;
        }

        success += 1;

        const item = await this.platformOperationService.createOperationItem({
          operationId: operation.id,
          targetType: 'RECONCILIATION_DECISION',
          targetId: result.updated.id,
          companyId: result.updated.companyId,
          candidateId: result.updated.candidateId,
          persistenceKey: result.updated.persistenceKey ?? null,
          requestedAction:
            args.decision === 'APPROVED'
              ? 'OVERRIDE_APPROVE'
              : 'OVERRIDE_REJECT',
          beforeValue: result.current.decision,
          afterValue: result.updated.decision,
          status: 'SUCCEEDED',
          auditId: result.auditId,
        });

        items.push(item);
      } catch (error) {
        failed += 1;
        failedIds.push(id);

        const item = await this.platformOperationService.createOperationItem({
          operationId: operation.id,
          targetType: 'RECONCILIATION_DECISION',
          targetId: id,
          requestedAction:
            args.decision === 'APPROVED'
              ? 'OVERRIDE_APPROVE'
              : 'OVERRIDE_REJECT',
          status: 'FAILED',
          failureCode: 'EXECUTION_ERROR',
          failureMessage: error instanceof Error ? error.message : String(error),
        });

        items.push(item);
      }
    }

    const finalStatus =
      failed === 0
        ? 'COMPLETED'
        : success > 0
        ? 'PARTIAL_FAILED'
        : 'FAILED';

    const updatedOperation = await this.platformOperationService.updateOperation(
      operation.id,
      {
        status: finalStatus,
        successCount: success,
        failedCount: failed,
        completedAt: new Date(),
        metadataJson: {
          stage: 'E2_REAL_EXECUTION',
          source: args.source ?? 'review_queue',
        },
      },
    );

    return {
      operation: updatedOperation,
      items,
      summary: {
        attempted: requestedCount,
        success,
        failed,
        failedIds,
      },
    };
  }


  async retryFailed(operationId: string) {
    const original = await this.platformOperationService.getOperationWithItems(operationId);

    if (!original) {
      throw new Error('PLATFORM_OPERATION_NOT_FOUND');
    }

    const failedIds = await this.platformOperationService.listFailedTargetIds(operationId);

    if (!failedIds.length) {
      return {
        operation: original,
        items: [],
        summary: {
          attempted: 0,
          success: 0,
          failed: 0,
          failedIds: [],
        },
      };
    }

    const decision =
      original.requestedDecision === 'REJECTED' ? 'REJECTED' : 'APPROVED';

    return this.batchOverride({
      ids: failedIds,
      decision,
      source: original.source ?? 'operations_center',
      note: `retry failed from operation ${operationId}`,
      requestedByAdminId: original.requestedByAdminId ?? null,
      requestedByAdminEmail: original.requestedByAdminEmail ?? null,
    });
  }

}
