import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { CreateReconciliationDecisionBatchDto } from "./dto/create-reconciliation-decision.dto";
import { ReconciliationDecisionService } from "./reconciliation-decision.service";

function resolveCompanyId(args: {
  headerCompanyId?: string;
  queryCompanyId?: string;
}): string {
  return args.headerCompanyId || args.queryCompanyId || "demo-company";
}


@Controller("reconciliation-decisions")
export class ReconciliationDecisionController {
  constructor(
    private readonly reconciliationDecisionService: ReconciliationDecisionService,
  ) {}

  @Post()
  submitBatch(
    @Body() dto: CreateReconciliationDecisionBatchDto,
    @Headers("x-company-id") headerCompanyId?: string,
    @Query("companyId") queryCompanyId?: string,
  ) {
    return this.reconciliationDecisionService.submitBatch({
      dto,
      companyId: resolveCompanyId({ headerCompanyId, queryCompanyId }),
    });
  }

  @Get()
  listAll(
    @Headers("x-company-id") headerCompanyId?: string,
    @Query("companyId") queryCompanyId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reconciliationDecisionService.listAll({
      companyId: resolveCompanyId({ headerCompanyId, queryCompanyId }),
      limit,
    });
  }

  @Get(":persistenceKey")
  findByPersistenceKey(
    @Param("persistenceKey") persistenceKey: string,
    @Headers("x-company-id") headerCompanyId?: string,
    @Query("companyId") queryCompanyId?: string,
  ) {
    return this.reconciliationDecisionService.findByPersistenceKey({
      persistenceKey,
      companyId: resolveCompanyId({ headerCompanyId, queryCompanyId }),
    });
  }
}
