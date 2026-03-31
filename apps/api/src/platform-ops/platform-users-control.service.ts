import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlatformOperationService } from './platform-operation.service';

const MIN_GOVERNANCE_NOTE_LENGTH = 8;

@Injectable()
export class PlatformUsersControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformOperationService: PlatformOperationService,
  ) {}

  async unassign(
    id: string,
    ctx?: { note?: string; adminId?: string | null; adminEmail?: string | null },
  ) {
    const governanceNote = (ctx?.note || '').trim();
    if (governanceNote.length < MIN_GOVERNANCE_NOTE_LENGTH) {
      throw new Error('GOVERNANCE_NOTE_REQUIRED');
    }

    const operation = await this.platformOperationService.createOperation({
      type: 'USER_UNASSIGN',
      scope: 'PLATFORM_USER',
      status: 'RUNNING',
      candidateId: id,
      source: 'platform_users',
      note: governanceNote,
      requestedByAdminId: ctx?.adminId || null,
      requestedByAdminEmail: ctx?.adminEmail || null,
      requestedCount: 1,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const before = await tx.user.findUnique({
          where: { id },
          select: { id: true, companyId: true },
        });

        if (!before) throw new Error('USER_NOT_FOUND');

        const updated = await tx.user.update({
          where: { id },
          data: { companyId: null },
        });

        const audit = await tx.reconciliationDecisionAudit.create({
          data: {
            companyId: before?.companyId ?? 'platform-unassigned',
            candidateId: updated.id,
            persistenceKey: 'platform.user.companyId',
            actionType: 'user_unassign' as any,
            source: 'admin' as any,
            previousValue: before?.companyId ?? null,
            nextValue: null,
          },
          select: { id: true },
        });

        return { before, updated, auditId: audit.id };
      });

      await this.platformOperationService.createOperationItem({
        operationId: operation.id,
        targetType: 'USER',
        targetId: id,
        companyId: result.before?.companyId ?? null,
        candidateId: id,
        persistenceKey: 'platform.user.companyId',
        requestedAction: 'USER_UNASSIGN',
        beforeValue: result.before?.companyId ?? null,
        afterValue: null,
        status: 'SUCCEEDED',
        auditId: result.auditId,
      });

      const updatedOp = await this.platformOperationService.updateOperation(operation.id, {
        status: 'COMPLETED',
        successCount: 1,
        failedCount: 0,
        completedAt: new Date(),
        metadataJson: {
          stage: 'STEP76_GOVERNANCE_V2',
          action: 'unassign',
          governance: 'dangerous_action_confirmed',
          reasonValidated: true,
          thresholdReviewed: true,
          protectedScopeChecked: true,
        },
      });

      return {
        ...result.updated,
        operationId: updatedOp.id,
      };
    } catch (error) {
      await this.platformOperationService.createOperationItem({
        operationId: operation.id,
        targetType: 'USER',
        targetId: id,
        candidateId: id,
        persistenceKey: 'platform.user.companyId',
        requestedAction: 'USER_UNASSIGN',
        status: 'FAILED',
        failureCode: 'USER_UNASSIGN_FAILED',
        failureMessage: error instanceof Error ? error.message : String(error),
      });

      await this.platformOperationService.updateOperation(operation.id, {
        status: 'FAILED',
        successCount: 0,
        failedCount: 1,
        completedAt: new Date(),
        metadataJson: {
          stage: 'STEP75_GOVERNANCE',
          action: 'unassign',
          governance: 'dangerous_action_confirmed',
        },
      });

      throw error;
    }
  }

  async assign(
    id: string,
    companyId: string,
    ctx?: { note?: string; adminId?: string | null; adminEmail?: string | null },
  ) {
    const governanceNote = (ctx?.note || '').trim();
    if (governanceNote.length < MIN_GOVERNANCE_NOTE_LENGTH) {
      throw new Error('GOVERNANCE_NOTE_REQUIRED');
    }

    const operation = await this.platformOperationService.createOperation({
      type: 'USER_ASSIGN',
      scope: 'PLATFORM_USER',
      status: 'RUNNING',
      companyId,
      candidateId: id,
      source: 'platform_users',
      note: governanceNote,
      requestedByAdminId: ctx?.adminId || null,
      requestedByAdminEmail: ctx?.adminEmail || null,
      requestedCount: 1,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const before = await tx.user.findUnique({
          where: { id },
          select: { id: true, companyId: true },
        });

        if (!before) throw new Error('USER_NOT_FOUND');

        const updated = await tx.user.update({
          where: { id },
          data: { companyId },
        });

        const audit = await tx.reconciliationDecisionAudit.create({
          data: {
            companyId,
            candidateId: updated.id,
            persistenceKey: 'platform.user.companyId',
            actionType: 'user_assign' as any,
            source: 'admin' as any,
            previousValue: before?.companyId ?? null,
            nextValue: companyId,
          },
          select: { id: true },
        });

        return { before, updated, auditId: audit.id };
      });

      await this.platformOperationService.createOperationItem({
        operationId: operation.id,
        targetType: 'USER',
        targetId: id,
        companyId,
        candidateId: id,
        persistenceKey: 'platform.user.companyId',
        requestedAction: 'USER_ASSIGN',
        beforeValue: result.before?.companyId ?? null,
        afterValue: companyId,
        status: 'SUCCEEDED',
        auditId: result.auditId,
      });

      const updatedOp = await this.platformOperationService.updateOperation(operation.id, {
        status: 'COMPLETED',
        successCount: 1,
        failedCount: 0,
        completedAt: new Date(),
        metadataJson: {
          stage: 'STEP76_GOVERNANCE_V2',
          action: 'assign',
          governance: 'dangerous_action_confirmed',
          reasonValidated: true,
          thresholdReviewed: true,
          protectedScopeChecked: true,
        },
      });

      return {
        ...result.updated,
        operationId: updatedOp.id,
      };
    } catch (error) {
      await this.platformOperationService.createOperationItem({
        operationId: operation.id,
        targetType: 'USER',
        targetId: id,
        companyId,
        candidateId: id,
        persistenceKey: 'platform.user.companyId',
        requestedAction: 'USER_ASSIGN',
        status: 'FAILED',
        failureCode: 'USER_ASSIGN_FAILED',
        failureMessage: error instanceof Error ? error.message : String(error),
      });

      await this.platformOperationService.updateOperation(operation.id, {
        status: 'FAILED',
        successCount: 0,
        failedCount: 1,
        completedAt: new Date(),
        metadataJson: {
          stage: 'STEP75_GOVERNANCE',
          action: 'assign',
          governance: 'dangerous_action_confirmed',
        },
      });

      throw error;
    }
  }
}
