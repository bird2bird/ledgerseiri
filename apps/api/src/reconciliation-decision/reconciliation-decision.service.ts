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

  async listAll(args: { companyId: string; limit?: string }) {
    const parsedLimit = Number(args.limit ?? 50);
    const take = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 200))
      : 50;

    return this.prisma.reconciliationDecision.findMany({
      where: {
        companyId: args.companyId,
      },
      orderBy: {
        submittedAt: "desc",
      },
      take,
    });
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
