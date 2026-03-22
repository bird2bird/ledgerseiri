import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { CreateReconciliationDecisionBatchDto } from "./dto/create-reconciliation-decision.dto";
import { ReconciliationDecisionService } from "./reconciliation-decision.service";
import { ReconciliationDecisionQueryDto } from "./dto/reconciliation-decision-query.dto";

function normalizeCompanyId(value?: string): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function resolveCompanyId(args: {
  headerCompanyId?: string;
  queryCompanyId?: string;
}): string {
  const headerCompanyId = normalizeCompanyId(args.headerCompanyId);
  const queryCompanyId = normalizeCompanyId(args.queryCompanyId);

  if (headerCompanyId && queryCompanyId && headerCompanyId !== queryCompanyId) {
    throw new BadRequestException("companyId mismatch between header and query");
  }

  const resolved = headerCompanyId || queryCompanyId;
  if (!resolved) {
    throw new BadRequestException("companyId is required");
  }

  return resolved;
}


@Controller("api/reconciliation-decisions")
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
    @Query() query?: ReconciliationDecisionQueryDto,
  ) {
    return this.reconciliationDecisionService.listAll({
      companyId: resolveCompanyId({
        headerCompanyId,
        queryCompanyId: query?.companyId,
      }),
      page: query?.page,
      limit: query?.limit,
      decision: query?.decision,
      candidateId: query?.candidateId,
      persistenceKey: query?.persistenceKey,
    });
  }

  @Get("metrics/summary")
  getMetrics(
    @Headers("x-company-id") headerCompanyId?: string,
    @Query("companyId") queryCompanyId?: string,
  ) {
    return this.reconciliationDecisionService.getMetrics({
      companyId: resolveCompanyId({ headerCompanyId, queryCompanyId }),
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
