import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformReconciliationOverrideService {
  constructor(private readonly prisma: PrismaService) {}

  async override(id: string, decision: string) {
    return this.prisma.reconciliationDecision.update({
      where: { id },
      data: {
        decision,
        updatedAt: new Date(),
      },
    });
  }
}
