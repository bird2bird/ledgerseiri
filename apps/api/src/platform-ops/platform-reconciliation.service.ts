import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      totalDecisions,
      avgConfidenceAgg,
      decisions30d,
      totalAudits,
      audits30d,
      latestDecision,
      groupedDecisions,
    ] = await this.prisma.$transaction([
      this.prisma.reconciliationDecision.count(),
      this.prisma.reconciliationDecision.aggregate({
        _avg: { confidence: true },
      }),
      this.prisma.reconciliationDecision.count({
        where: { submittedAt: { gte: since } },
      }),
      this.prisma.reconciliationDecisionAudit.count(),
      this.prisma.reconciliationDecisionAudit.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.reconciliationDecision.findFirst({
        orderBy: { submittedAt: 'desc' },
        select: { submittedAt: true },
      }),
      this.prisma.reconciliationDecision.groupBy({
        by: ['decision'],
        _count: true,
        orderBy: { decision: "asc" },
      }),
    ]);

    return {
      totalDecisions,
      avgConfidence: avgConfidenceAgg._avg.confidence ?? 0,
      decisions30d,
      totalAudits,
      audits30d,
      latestSubmittedAt: latestDecision?.submittedAt?.toISOString() ?? null,
      decisionBreakdown: groupedDecisions.map((row) => ({
        decision: row.decision,
        count:
          typeof row._count === 'object' && row._count !== null
            ? (row._count as any).decision ?? 0
            : 0,
      })),
    };
  }
}
