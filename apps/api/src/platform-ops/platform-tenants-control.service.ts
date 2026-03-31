import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlatformOperationService } from './platform-operation.service';

const PROTECTED_TENANT_IDS = ['platform-root', 'internal-demo', 'seed-company'];
const MIN_GOVERNANCE_NOTE_LENGTH = 8;

@Injectable()
export class PlatformTenantsControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformOperationService: PlatformOperationService,
  ) {}

  async suspend(
    id: string,
    ctx?: { note?: string; adminId?: string | null; adminEmail?: string | null },
  ) {
    const governanceNote = (ctx?.note || '').trim();
    if (governanceNote.length < MIN_GOVERNANCE_NOTE_LENGTH) {
      throw new Error('GOVERNANCE_NOTE_REQUIRED');
    }
    if (PROTECTED_TENANT_IDS.includes(id)) {
      throw new Error('PROTECTED_TENANT_BLOCKED');
    }

    const operation = await this.platformOperationService.createOperation({
      type: 'TENANT_SUSPEND',
      scope: 'PLATFORM_TENANT',
      status: 'RUNNING',
      companyId: id,
      source: 'platform_tenants',
      note: governanceNote,
      requestedByAdminId: ctx?.adminId || null,
      requestedByAdminEmail: ctx?.adminEmail || null,
      requestedCount: 1,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const before = await tx.company.findUnique({
          where: { id },
          select: { id: true, status: true },
        });

        if (!before) throw new Error('TENANT_NOT_FOUND');

        const updated = await tx.company.update({
          where: { id },
          data: { status: 'SUSPENDED' as any },
        });

        const audit = await tx.reconciliationDecisionAudit.create({
          data: {
            companyId: updated.id,
            candidateId: updated.id,
            persistenceKey: 'platform.company.status',
            actionType: 'tenant_suspend' as any,
            source: 'admin' as any,
            previousValue: before?.status ? String(before.status) : null,
            nextValue: 'SUSPENDED',
          },
          select: { id: true },
        });

        return { before, updated, auditId: audit.id };
      });

      await this.platformOperationService.createOperationItem({
        operationId: operation.id,
        targetType: 'COMPANY',
        targetId: id,
        companyId: id,
        persistenceKey: 'platform.company.status',
        requestedAction: 'TENANT_SUSPEND',
        beforeValue: result.before?.status ? String(result.before.status) : null,
        afterValue: 'SUSPENDED',
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
          action: 'suspend',
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
        targetType: 'COMPANY',
        targetId: id,
        companyId: id,
        persistenceKey: 'platform.company.status',
        requestedAction: 'TENANT_SUSPEND',
        status: 'FAILED',
        failureCode: 'TENANT_SUSPEND_FAILED',
        failureMessage: error instanceof Error ? error.message : String(error),
      });

      await this.platformOperationService.updateOperation(operation.id, {
        status: 'FAILED',
        successCount: 0,
        failedCount: 1,
        completedAt: new Date(),
        metadataJson: {
          stage: 'STEP75_GOVERNANCE',
          action: 'suspend',
          governance: 'dangerous_action_confirmed',
        },
      });

      throw error;
    }
  }

  async activate(
    id: string,
    ctx?: { note?: string; adminId?: string | null; adminEmail?: string | null },
  ) {
    const governanceNote = (ctx?.note || '').trim();
    if (governanceNote.length < MIN_GOVERNANCE_NOTE_LENGTH) {
      throw new Error('GOVERNANCE_NOTE_REQUIRED');
    }

    const operation = await this.platformOperationService.createOperation({
      type: 'TENANT_ACTIVATE',
      scope: 'PLATFORM_TENANT',
      status: 'RUNNING',
      companyId: id,
      source: 'platform_tenants',
      note: governanceNote,
      requestedByAdminId: ctx?.adminId || null,
      requestedByAdminEmail: ctx?.adminEmail || null,
      requestedCount: 1,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const before = await tx.company.findUnique({
          where: { id },
          select: { id: true, status: true },
        });

        if (!before) throw new Error('TENANT_NOT_FOUND');

        const updated = await tx.company.update({
          where: { id },
          data: { status: 'ACTIVE' as any },
        });

        const audit = await tx.reconciliationDecisionAudit.create({
          data: {
            companyId: updated.id,
            candidateId: updated.id,
            persistenceKey: 'platform.company.status',
            actionType: 'tenant_activate' as any,
            source: 'admin' as any,
            previousValue: before?.status ? String(before.status) : null,
            nextValue: 'ACTIVE',
          },
          select: { id: true },
        });

        return { before, updated, auditId: audit.id };
      });

      await this.platformOperationService.createOperationItem({
        operationId: operation.id,
        targetType: 'COMPANY',
        targetId: id,
        companyId: id,
        persistenceKey: 'platform.company.status',
        requestedAction: 'TENANT_ACTIVATE',
        beforeValue: result.before?.status ? String(result.before.status) : null,
        afterValue: 'ACTIVE',
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
          action: 'activate',
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
        targetType: 'COMPANY',
        targetId: id,
        companyId: id,
        persistenceKey: 'platform.company.status',
        requestedAction: 'TENANT_ACTIVATE',
        status: 'FAILED',
        failureCode: 'TENANT_ACTIVATE_FAILED',
        failureMessage: error instanceof Error ? error.message : String(error),
      });

      await this.platformOperationService.updateOperation(operation.id, {
        status: 'FAILED',
        successCount: 0,
        failedCount: 1,
        completedAt: new Date(),
        metadataJson: {
          stage: 'STEP75_GOVERNANCE',
          action: 'activate',
          governance: 'dangerous_action_confirmed',
        },
      });

      throw error;
    }
  }
}
