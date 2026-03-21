import { Module } from "@nestjs/common";
import { ReconciliationDecisionController } from "./reconciliation-decision.controller";
import { ReconciliationDecisionService } from "./reconciliation-decision.service";
import { PrismaService } from "../prisma.service";

@Module({
  
  controllers: [ReconciliationDecisionController],
  providers: [ReconciliationDecisionService, PrismaService],
  exports: [ReconciliationDecisionService],
})
export class ReconciliationDecisionModule {}
