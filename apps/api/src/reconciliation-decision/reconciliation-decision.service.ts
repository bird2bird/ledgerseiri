import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateReconciliationDecisionBatchDto } from "./dto/create-reconciliation-decision.dto";

@Injectable()
export class ReconciliationDecisionService {
  constructor(private readonly prisma: PrismaService) {}

  async submitBatch(dto: CreateReconciliationDecisionBatchDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("items must not be empty");
    }

    const submittedAt = new Date(dto.submittedAt);

    const rows = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.reconciliationDecision.upsert({
          where: {
            persistenceKey: item.persistenceKey,
          },
          update: {
            candidateId: item.candidateId,
            decision: item.decision,
            confidence: item.confidence,
            submittedAt,
          },
          create: {
            candidateId: item.candidateId,
            decision: item.decision,
            persistenceKey: item.persistenceKey,
            confidence: item.confidence,
            submittedAt,
          },
        }),
      ),
    );

    return {
      acceptedCount: rows.length,
      submittedAt: submittedAt.toISOString(),
      persistenceKeys: rows.map((row: any) => row.persistenceKey),
    };
  }

  async listAll() {
    return this.prisma.reconciliationDecision.findMany({
      orderBy: {
        submittedAt: "desc",
      },
    });
  }

  async findByPersistenceKey(persistenceKey: string) {
    return this.prisma.reconciliationDecision.findUnique({
      where: {
        persistenceKey,
      },
    });
  }
}
