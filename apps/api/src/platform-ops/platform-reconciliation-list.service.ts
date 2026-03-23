import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformReconciliationListService {
  constructor(private readonly prisma: PrismaService) {}

  async getList() {
    const rows = await this.prisma.reconciliationDecision.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        companyId: true,
        candidateId: true,
        decision: true,
        persistenceKey: true,
        confidence: true,
        submittedAt: true,
        createdAt: true,
      },
    });

    return rows;
  }
}
