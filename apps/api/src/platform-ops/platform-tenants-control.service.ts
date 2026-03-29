import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformTenantsControlService {
  constructor(private readonly prisma: PrismaService) {}

  async suspend(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.company.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      const updated = await tx.company.update({
        where: { id },
        data: { status: 'SUSPENDED' as any },
      });

      await tx.reconciliationDecisionAudit.create({
        data: {
          companyId: updated.id,
          candidateId: updated.id,
          persistenceKey: 'platform.company.status',
          actionType: 'tenant_suspend' as any,
          source: 'admin' as any,
          previousValue: before?.status ? String(before.status) : null,
          nextValue: 'SUSPENDED',
        },
      });

      return updated;
    });
  }

  async activate(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.company.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      const updated = await tx.company.update({
        where: { id },
        data: { status: 'ACTIVE' as any },
      });

      await tx.reconciliationDecisionAudit.create({
        data: {
          companyId: updated.id,
          candidateId: updated.id,
          persistenceKey: 'platform.company.status',
          actionType: 'tenant_activate' as any,
          source: 'admin' as any,
          previousValue: before?.status ? String(before.status) : null,
          nextValue: 'ACTIVE',
        },
      });

      return updated;
    });
  }
}
