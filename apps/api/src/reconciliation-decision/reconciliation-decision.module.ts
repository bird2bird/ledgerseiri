import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { ReconciliationDecisionController } from "./reconciliation-decision.controller";
import { ReconciliationDecisionService } from "./reconciliation-decision.service";
import { ReconciliationDecisionAuditService } from "./reconciliation-decision-audit.service";

@Module({
  controllers: [ReconciliationDecisionController],
  providers: [
    ReconciliationDecisionService,
    ReconciliationDecisionAuditService,
    PrismaService,
  ],
  exports: [ReconciliationDecisionService],
})
export class ReconciliationDecisionModule {}
