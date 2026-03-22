import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateReconciliationDecisionAuditRecord } from "./reconciliation-decision-audit.types";

@Injectable()
export class ReconciliationDecisionAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(records: CreateReconciliationDecisionAuditRecord[]) {
    if (!records.length) {
      return { count: 0 };
    }

    return this.prisma.reconciliationDecisionAudit.createMany({
      data: records.map((record) => ({
        companyId: record.companyId,
        candidateId: record.candidateId,
        persistenceKey: record.persistenceKey ?? null,
        actionType: record.actionType,
        previousValue: record.previousValue ?? null,
        nextValue: record.nextValue ?? null,
        source: record.source,
      })),
    });
  }

  async createManyInTx(
    tx: Prisma.TransactionClient,
    records: CreateReconciliationDecisionAuditRecord[],
  ) {
    if (!records.length) {
      return { count: 0 };
    }

    return tx.reconciliationDecisionAudit.createMany({
      data: records.map((record) => ({
        companyId: record.companyId,
        candidateId: record.candidateId,
        persistenceKey: record.persistenceKey ?? null,
        actionType: record.actionType,
        previousValue: record.previousValue ?? null,
        nextValue: record.nextValue ?? null,
        source: record.source,
      })),
    });
  }
}
