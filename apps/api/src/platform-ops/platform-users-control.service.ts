import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformUsersControlService {
  constructor(private readonly prisma: PrismaService) {}

  async unassign(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id },
        select: { id: true, companyId: true },
      });

      const updated = await tx.user.update({
        where: { id },
        data: { companyId: null },
      });

      await tx.reconciliationDecisionAudit.create({
        data: {
          companyId: before?.companyId ?? 'platform-unassigned',
          candidateId: updated.id,
          persistenceKey: 'platform.user.companyId',
          actionType: 'user_unassign' as any,
          source: 'admin' as any,
          previousValue: before?.companyId ?? null,
          nextValue: null,
        },
      });

      return updated;
    });
  }

  async assign(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id },
        select: { id: true, companyId: true },
      });

      const updated = await tx.user.update({
        where: { id },
        data: { companyId },
      });

      await tx.reconciliationDecisionAudit.create({
        data: {
          companyId,
          candidateId: updated.id,
          persistenceKey: 'platform.user.companyId',
          actionType: 'user_assign' as any,
          source: 'admin' as any,
          previousValue: before?.companyId ?? null,
          nextValue: companyId,
        },
      });

      return updated;
    });
  }
}
