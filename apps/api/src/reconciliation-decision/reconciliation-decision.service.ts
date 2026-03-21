import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateReconciliationDecisionBatchDto } from "./dto/create-reconciliation-decision.dto";

@Injectable()
export class ReconciliationDecisionService {
  constructor(private readonly prisma: PrismaService) {}

  async submitBatch(args: {
    dto: CreateReconciliationDecisionBatchDto;
    companyId: string;
  }) {
    const { dto, companyId } = args;
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
        }),
      ),
    );

    return {
      acceptedCount: rows.length,
      submittedAt: submittedAt.toISOString(),
      persistenceKeys: rows.map((row: any) => row.persistenceKey),
    };
  }

  async listAll(args: { companyId: string }) {
    return this.prisma.reconciliationDecision.findMany({
      where: {
        companyId: args.companyId,
      },
      orderBy: {
        submittedAt: "desc",
      },
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
