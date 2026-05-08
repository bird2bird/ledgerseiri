import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { AmazonSpApiOauthStatePersistenceBridgeService } from './amazon-sp-api-oauth-state-persistence-bridge.service';
import { AmazonSpApiOauthAuthorizationUrlService } from './amazon-sp-api-oauth-authorization-url.service';
import { DetectMonthConflictsDto } from './dto/detect-month-conflicts.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { CommitImportDto } from './dto/commit-import.dto';
import type { CashIncomePreviewDto } from './dto/cash-income-preview.dto';
import type { CashIncomeCommitDto } from './dto/cash-income-commit.dto';
import type { IncomeImportPreviewDto } from './dto/income-import-preview.dto';
import type { IncomeImportCommitDto } from './dto/income-import-commit.dto';
import type { ExpenseImportPreviewDto } from './dto/expense-import-preview.dto';
import type { ExpenseImportCommitFromJobDto } from './dto/expense-import-commit.dto';
import type { AmazonSpApiSandboxImportJobReadModelDryRunResult } from './dto/amazon-sp-api-sandbox-importjob-read-model-dry-run-service-design.dto';
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
import { JwtAuthGuard } from '../auth/jwt.guard';


type Step122SAuthenticatedRequest = {
  user?: {
    id?: string;
    userId?: string;
    companyId?: string | null;
    email?: string;
  };
};


@Controller('api/imports')
export class ImportsController {
  constructor(
    private readonly service: ImportsService,
    private readonly amazonSpApiOauthStatePersistenceBridgeService: AmazonSpApiOauthStatePersistenceBridgeService,
    private readonly amazonSpApiOauthAuthorizationUrlService: AmazonSpApiOauthAuthorizationUrlService,
  ) {}

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



  // Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.
  // Step122-S: JWT guard is now enforced for this internal readonly endpoint.
  // Frontend remains unwired; writes, real SP-API, OAuth and token persistence remain disabled.
  @UseGuards(JwtAuthGuard)
  @Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')
  async amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Query() query: AmazonSpApiSandboxImportJobReadModelControllerQuery,
  ): Promise<AmazonSpApiSandboxImportJobReadModelDryRunResult> {
    assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });

    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP122_S_AUTH_COMPANY_REQUIRED: authenticated user must belong to a company to access Amazon SP-API sandbox ImportJob read-model.',
      );
    }

    let normalized: ReturnType<typeof normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery>;

    try {
      normalized = normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `STEP122_P_HTTP_QUERY_VALIDATION_BAD_REQUEST: ${message}`,
      );
    }

    return this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']({
      ...normalized,
      companyId,
      dryRun: true,
    });
  }



  // Step129-B: Amazon SP-API OAuth authorization URL route implementation.
  // This route returns a sanitized fake/sandbox authorization URL for the future frontend connect action.
  // It does not persist OAuth state, does not call token exchange, does not write token DB, and does not redirect.
  @UseGuards(JwtAuthGuard)
  @Get('amazon-sp-api/oauth/authorization-url')
  amazonSpApiOAuthAuthorizationUrlRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Query('storeId') storeId?: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('region') region?: string,
    @Query('returnTo') returnTo?: string,
    @Query('sandbox') sandbox?: string,
    @Query('forceReauthorize') forceReauthorize?: string,
    @Query('locale') locale?: string,
  ) {
    const companyId = String(req.user?.companyId || '').trim();

    const result = this.amazonSpApiOauthAuthorizationUrlService.buildAuthorizationUrl({
      companyId,
      storeId: String(storeId || '').trim(),
      marketplaceId: String(marketplaceId || '').trim(),
      region: String(region || '').trim(),
      returnTo: String(returnTo || '').trim(),
      sandbox: String(sandbox || 'true').trim().toLowerCase() !== 'false',
      forceReauthorize: String(forceReauthorize || '').trim().toLowerCase() === 'true',
      locale: String(locale || 'ja-JP').trim(),
    });

    if (!result.ok) {
      throw new BadRequestException(
        `STEP129_B_AUTHORIZATION_URL_BAD_REQUEST: ${result.messageRedacted}`,
      );
    }

    return result;
  }

  // Step127-B: Amazon SP-API OAuth callback route implementation boundary.
  // This route intentionally validates and sanitizes callback input only.
  // It does not call Amazon LWA, does not persist refresh/access tokens, and does not call real SP-API.
  @Get('amazon-sp-api/oauth/callback')
  amazonSpApiOAuthCallbackBoundary(
    @Query('state') state?: string,
    @Query('code') code?: string,
    @Query('spapi_oauth_code') spapiOauthCode?: string,
    @Query('selling_partner_id') sellingPartnerId?: string,
    @Query('error') callbackError?: string,
    @Query('error_description') callbackErrorDescription?: string,
  ) {
    const normalizedState = String(state || '').trim();
    const normalizedCode = String(code || '').trim();
    const normalizedSpapiOauthCode = String(spapiOauthCode || '').trim();
    const normalizedSellingPartnerId = String(sellingPartnerId || '').trim();
    const normalizedError = String(callbackError || '').trim();
    const normalizedErrorDescription = String(callbackErrorDescription || '').trim();

    const baseResponse = {
      source: 'amazon-sp-api-oauth-callback',
      routeImplementedNow: true,
      tokenExchangeHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      frontendAddedNow: false,
    } as const;

    if (normalizedError) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'callback_error',
        messageRedacted: 'Amazon OAuth callback returned an error.',
        error: normalizedError,
        errorDescriptionPresent: normalizedErrorDescription.length > 0,
      };
    }

    if (!normalizedState) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'missing_state',
        messageRedacted: 'Amazon OAuth callback is missing required state.',
      };
    }

    if (!normalizedCode && !normalizedSpapiOauthCode) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'missing_authorization_code',
        messageRedacted: 'Amazon OAuth callback is missing authorization code.',
        statePresent: true,
      };
    }

    if (!normalizedSellingPartnerId) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'missing_selling_partner_id',
        messageRedacted: 'Amazon OAuth callback is missing selling partner id.',
        statePresent: true,
        authorizationCodePresent: true,
      };
    }

    // Keep a concrete bridge-service dependency in the route without executing DB or HTTP work.
    // The full persistence plan requires encrypted token exchange output, which is intentionally unavailable in Step127-B.
    const bridgeServiceReady =
      typeof this.amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan === 'function' &&
      typeof this.amazonSpApiOauthStatePersistenceBridgeService.validateStatePayload === 'function';

    return {
      ...baseResponse,
      accepted: true,
      status: 'accepted_for_token_exchange_later',
      statePresent: true,
      authorizationCodePresent: true,
      spapiOauthCodeUsed: Boolean(normalizedSpapiOauthCode && !normalizedCode),
      sellingPartnerId: normalizedSellingPartnerId,
      bridgeServiceReady,
      sanitizedResult: {
        sellingPartnerId: normalizedSellingPartnerId,
        tokenExchangePending: true,
        tokenPersistencePending: true,
      },
    };
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
