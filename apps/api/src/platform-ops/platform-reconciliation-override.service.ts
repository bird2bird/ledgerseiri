import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformReconciliationOverrideService {
  constructor(private readonly prisma: PrismaService) {}

  async override(id: string, decision: string) {
    return this.prisma.$transaction(async (tx) => {
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

      const updated = await tx.reconciliationDecision.update({
        where: { id },
        data: {
          decision,
          updatedAt: new Date(),
        },
      });

      await tx.reconciliationDecisionAudit.create({
        data: {
          companyId: updated.companyId,
          candidateId: updated.candidateId,
          persistenceKey: updated.persistenceKey ?? null,
          actionType: decision === 'APPROVED' ? 'override_approve' as any : 'override_reject' as any,
          source: 'admin' as any,
          previousValue: before?.decision ?? null,
          nextValue: updated.decision,
        },
      });

      return updated;
    });
  }
}
