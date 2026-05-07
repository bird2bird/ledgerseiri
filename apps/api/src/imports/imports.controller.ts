import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { DetectMonthConflictsDto } from './dto/detect-month-conflicts.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { CommitImportDto } from './dto/commit-import.dto';
import type { CashIncomePreviewDto } from './dto/cash-income-preview.dto';
import type { CashIncomeCommitDto } from './dto/cash-income-commit.dto';
import type { IncomeImportPreviewDto } from './dto/income-import-preview.dto';
import type { IncomeImportCommitDto } from './dto/income-import-commit.dto';
import type { ExpenseImportPreviewDto } from './dto/expense-import-preview.dto';
import type { ExpenseImportCommitFromJobDto } from './dto/expense-import-commit.dto';
import {
  assertAmazonSpApiSandboxImportJobReadModelControllerContract,
  buildAmazonSpApiSandboxImportJobReadModelControllerContract,
  normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery,
  type AmazonSpApiSandboxImportJobReadModelControllerQuery,
} from './dto/amazon-sp-api-sandbox-importjob-read-model-controller-contract.dto';
import {
  assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
  buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
} from './dto/amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract.dto';
import { assertAmazonSpApiSandboxEnvironmentGate } from './dto/amazon-sp-api-sandbox-internal-contract.dto';



@Controller('api/imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  // Step122-I: Amazon SP-API sandbox ImportJob read-model controller-disabled implementation shell.
  // This shell intentionally has no Nest route decorator and must not call the read-model service.
  async ['amazonSpApiSandboxImportJobReadModelControllerDisabledShell'](
    query: AmazonSpApiSandboxImportJobReadModelControllerQuery,
  ): Promise<never> {
    const contract = assertAmazonSpApiSandboxImportJobReadModelControllerContract(
      buildAmazonSpApiSandboxImportJobReadModelControllerContract(),
    );

    if (
      contract.controllerImplementedNow !== false ||
      contract.controllerRouteExposedNow !== false ||
      contract.frontendExposedNow !== false ||
      contract.writesDatabase !== false
    ) {
      throw new BadRequestException(
        'STEP122_I_CONTROLLER_DISABLED_SHELL_CONTRACT_DRIFT: read-model controller contract must remain disabled.',
      );
    }

    normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query);

    throw new BadRequestException(
      'STEP122_I_CONTROLLER_DISABLED_SHELL_BLOCKED: Amazon SP-API sandbox ImportJob read-model controller route is intentionally disabled.',
    );
  }



  // Step122-K: Amazon SP-API sandbox ImportJob read-model env-gated blocked controller route.
  // This route is intentionally blocked before any service call and must not return rows.
  @Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')
  amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute(
    @Query() query: AmazonSpApiSandboxImportJobReadModelControllerQuery,
  ): never {
    assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });

    const contract = assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(
      buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(),
    );

    if (
      contract.routeImplementedNow !== false ||
      contract.routeCallableNow !== false ||
      contract.serviceCallAllowedNow !== false ||
      contract.frontendExposedNow !== false ||
      contract.writesDatabase !== false
    ) {
      throw new BadRequestException(
        'STEP122_K_BLOCKED_ROUTE_CONTRACT_DRIFT: blocked route contract must remain non-callable and non-writing.',
      );
    }

    normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query);

    throw new BadRequestException(
      'STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN: Amazon SP-API sandbox ImportJob read-model controller route is env-gated but not open yet.',
    );
  }

  @Post('detect-month-conflicts')
  detectMonthConflicts(@Body() body: DetectMonthConflictsDto) {
    return this.service.detectMonthConflicts(body);
  }

  @Post('preview')
  preview(@Body() body: PreviewImportDto) {
    return this.service.previewImport(body);
  }

  @Post('cash-income/preview')
  previewCashIncome(@Body() body: CashIncomePreviewDto) {
    return this.service.previewCashIncomeImport(body);
  }

  @Post('cash-income/commit')
  commitCashIncome(@Body() body: CashIncomeCommitDto) {
    return this.service.commitCashIncomeContract(body);
  }

  // Step109-Z1-H9-1-EXPENSE-PREVIEW-COMMIT-CONTROLLER:
  // Two-step expense import API. Keep legacy expense/commit below for compatibility.
  @Post('expense/preview')
  previewExpenseImport(@Body() body: ExpenseImportPreviewDto) {
    return this.service.previewExpenseImportContract(body);
  }

  @Post('expense/:importJobId/commit')
  commitExpenseImportJob(
    @Param('importJobId') importJobId: string,
    @Body() body: ExpenseImportCommitFromJobDto,
  ) {
    return this.service.commitExpenseImportContract(importJobId, body);
  }

  // Step109-Z1-H5D-EXPENSE-COMMIT-CONTROLLER:
  // Commit ledger_scope validated expense CSV preview rows into Transaction.
  @Post('expense/commit')
  commitExpenseImport(@Body() body: any) {
    return this.service.commitExpenseImport(body);
  }

  // Step109-Z1-H8-1-INCOME-BACKEND-CONTROLLER:
  // Unified backend import contract for cash-income and other-income.
  // Frontend is not switched in H8-1; this endpoint is validated by curl/API tests first.
  @Post('income/preview')
  previewIncomeImport(@Body() body: IncomeImportPreviewDto) {
    return this.service.previewIncomeImportContract(body);
  }

  @Post('income/:importJobId/commit')
  commitIncomeImport(
    @Param('importJobId') importJobId: string,
    @Body() body: IncomeImportCommitDto
  ) {
    return this.service.commitIncomeImportContract(importJobId, body);
  }

  @Post(':importJobId/commit')
  commit(
    @Param('importJobId') importJobId: string,
    @Body() body: CommitImportDto
  ) {
    return this.service.commitImport(importJobId, body);
  }

  @Get('history')
  history(
    @Query('module') module?: string,
    @Query('companyId') companyId?: string
  ) {
    return this.service.listHistory({ module, companyId });
  }

  @Get(':importJobId/summary')
  summary(
    @Param('importJobId') importJobId: string,
    @Query('companyId') companyId?: string
  ) {
    return this.service.getImportSummary(importJobId, companyId);
  }
}
