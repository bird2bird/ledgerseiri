import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateReconciliationDecisionBatchDto } from "./dto/create-reconciliation-decision.dto";
import { ReconciliationDecisionAuditService } from "./reconciliation-decision-audit.service";

@Injectable()
export class ReconciliationDecisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: ReconciliationDecisionAuditService,
  ) {}

  async submitBatch(args: {
    dto: CreateReconciliationDecisionBatchDto;
    companyId: string;
  }) {
    const { dto, companyId } = args;

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("reconciliation decision items must not be empty");
    }

    const submittedAt = new Date(dto.submittedAt);
    if (Number.isNaN(submittedAt.getTime())) {
      throw new BadRequestException("submittedAt must be a valid ISO date string");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const persistenceKeys = dto.items.map((item) => item.persistenceKey);

      const existingRows = await tx.reconciliationDecision.findMany({
        where: {
          companyId,
          persistenceKey: {
            in: persistenceKeys,
          },
        },
      });

      const existingByPersistenceKey = new Map(
        existingRows.map((row) => [row.persistenceKey, row]),
      );

      const rows = [];
      for (const item of dto.items) {
        const row = await tx.reconciliationDecision.upsert({
          where: {
            persistenceKey: item.persistenceKey,
          },
          update: {
            companyId,
            candidateId: item.candidateId,
            decision: item.decision,
            confidence: item.confidence,
            submittedAt,
          },
          create: {
            companyId,
            candidateId: item.candidateId,
            decision: item.decision,
            persistenceKey: item.persistenceKey,
            confidence: item.confidence,
            submittedAt,
          },
        });

        rows.push(row);
      }

      await this.auditService.createManyInTx(
        tx,
        dto.items.map((item) => {
          const prev = existingByPersistenceKey.get(item.persistenceKey);
          return {
            companyId,
            candidateId: item.candidateId,
            persistenceKey: item.persistenceKey,
            actionType: "submit" as const,
            previousValue: prev?.decision ?? null,
            nextValue: item.decision,
            source: "api" as const,
          };
        }),
      );

      return rows;
    });

    return {
      acceptedCount: result.length,
      submittedAt: submittedAt.toISOString(),
      persistenceKeys: result.map((row) => row.persistenceKey),
    };
  }

  async listAll(args: {
    companyId: string;
    page?: string;
    limit?: string;
    decision?: string;
    candidateId?: string;
    persistenceKey?: string;
  }) {
    const parsedPage = Number(args.page ?? 1);
    const parsedLimit = Number(args.limit ?? 50);

    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 200))
      : 50;

    const where = {
      companyId: args.companyId,
      ...(args.decision ? { decision: args.decision } : {}),
      ...(args.candidateId
        ? {
            candidateId: {
              contains: args.candidateId,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(args.persistenceKey
        ? {
            persistenceKey: {
              contains: args.persistenceKey,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const total = await this.prisma.reconciliationDecision.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const items = await this.prisma.reconciliationDecision.findMany({
      where,
      orderBy: {
        submittedAt: "desc",
      },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page: safePage,
      limit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      filters: {
        decision: args.decision ?? null,
        candidateId: args.candidateId ?? null,
        persistenceKey: args.persistenceKey ?? null,
      },
    };
  }

  async getMetrics(args: { companyId: string }) {
    const [totalDecisions, approvedCount, rejectedCount, auditRows] =
      await this.prisma.$transaction([
        this.prisma.reconciliationDecision.count({
          where: { companyId: args.companyId },
        }),
        this.prisma.reconciliationDecision.count({
          where: { companyId: args.companyId, decision: "approved" },
        }),
        this.prisma.reconciliationDecision.count({
          where: { companyId: args.companyId, decision: "rejected" },
        }),
        this.prisma.reconciliationDecisionAudit.findMany({
          where: { companyId: args.companyId },
          select: {
            previousValue: true,
            nextValue: true,
            actionType: true,
          },
        }),
      ]);

    const totalAudits = auditRows.length;
    const changedDecisionCount = auditRows.filter(
      (row) => (row.previousValue ?? null) !== (row.nextValue ?? null),
    ).length;

    const unchangedDecisionCount = auditRows.filter(
      (row) => (row.previousValue ?? null) === (row.nextValue ?? null),
    ).length;

    const autoApplyCount = auditRows.filter(
      (row) => row.actionType === "auto_apply",
    ).length;

    const approveRate =
      totalDecisions > 0 ? approvedCount / totalDecisions : 0;
    const rejectRate =
      totalDecisions > 0 ? rejectedCount / totalDecisions : 0;
    const changeRate =
      totalAudits > 0 ? changedDecisionCount / totalAudits : 0;

    return {
      totalDecisions,
      approvedCount,
      rejectedCount,
      approveRate,
      rejectRate,
      totalAudits,
      changedDecisionCount,
      unchangedDecisionCount,
      changeRate,
      autoApplyCount,
    };
  }

  async getMetricsInsights(args: { companyId: string }) {
    const [decisions, audits] = await this.prisma.$transaction([
      this.prisma.reconciliationDecision.findMany({
        where: { companyId: args.companyId },
        select: {
          candidateId: true,
          decision: true,
          confidence: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "asc" },
      }),
      this.prisma.reconciliationDecisionAudit.findMany({
        where: { companyId: args.companyId },
        select: {
          candidateId: true,
          actionType: true,
          previousValue: true,
          nextValue: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const now = new Date();
    const trendDays: Array<{
      date: string;
      totalDecisions: number;
      approvedCount: number;
      rejectedCount: number;
      approveRate: number;
    }> = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);

      const rows = decisions.filter(
        (row) => row.submittedAt.toISOString().slice(0, 10) === key,
      );

      const totalDecisions = rows.length;
      const approvedCount = rows.filter((row) => row.decision === "approved").length;
      const rejectedCount = rows.filter((row) => row.decision === "rejected").length;
      const approveRate = totalDecisions > 0 ? approvedCount / totalDecisions : 0;

      trendDays.push({
        date: key,
        totalDecisions,
        approvedCount,
        rejectedCount,
        approveRate,
      });
    }

    const confidenceHigh = decisions.filter((row) => row.confidence >= 0.9).length;
    const confidenceMid = decisions.filter(
      (row) => row.confidence >= 0.6 && row.confidence < 0.9,
    ).length;
    const confidenceLow = decisions.filter((row) => row.confidence < 0.6).length;

    const autoApplyCandidates = new Set(
      audits
        .filter((row) => row.actionType === "auto_apply")
        .map((row) => row.candidateId),
    );

    let overriddenAutoApplyCount = 0;
    for (const candidateId of autoApplyCandidates) {
      const rows = audits.filter((row) => row.candidateId === candidateId);
      const firstAutoApplyIndex = rows.findIndex((row) => row.actionType === "auto_apply");
      const laterChanged = rows.slice(firstAutoApplyIndex + 1).some(
        (row) => (row.previousValue ?? null) !== (row.nextValue ?? null),
      );
      if (laterChanged) overriddenAutoApplyCount += 1;
    }

    const autoApplyCount = autoApplyCandidates.size;
    const autoApplySuccessCount = Math.max(0, autoApplyCount - overriddenAutoApplyCount);
    const autoApplySuccessRate =
      autoApplyCount > 0 ? autoApplySuccessCount / autoApplyCount : 0;

    return {
      trends: trendDays,
      confidenceDistribution: {
        high: confidenceHigh,
        mid: confidenceMid,
        low: confidenceLow,
      },
      aiQuality: {
        autoApplyCount,
        overriddenAutoApplyCount,
        autoApplySuccessCount,
        autoApplySuccessRate,
      },
    };
  }

  async findByPersistenceKey(args: {
    persistenceKey: string;
    companyId: string;
  }) {
    return this.prisma.reconciliationDecision.findFirst({
      where: {
        persistenceKey: args.persistenceKey,
        companyId: args.companyId,
      },
    });
  }
}
