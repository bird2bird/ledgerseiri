import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateReconciliationDecisionBatchDto } from "./dto/create-reconciliation-decision.dto";
import { ReconciliationDecisionService } from "./reconciliation-decision.service";

@Controller("reconciliation-decisions")
export class ReconciliationDecisionController {
  constructor(
    private readonly reconciliationDecisionService: ReconciliationDecisionService,
  ) {}

  @Post()
  submitBatch(@Body() dto: CreateReconciliationDecisionBatchDto) {
    return this.reconciliationDecisionService.submitBatch(dto);
  }

  @Get()
  listAll() {
    return this.reconciliationDecisionService.listAll();
  }

  @Get(":persistenceKey")
  findByPersistenceKey(@Param("persistenceKey") persistenceKey: string) {
    return this.reconciliationDecisionService.findByPersistenceKey(persistenceKey);
  }
}
