import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { reviewAmazonSpApiOrdersFinalCommit } from './amazon-sp-api-orders-final-commit-review.service';
import {
  assertAmazonSpApiOrdersTransactionCommitDisabledContract,
  type AmazonSpApiOrdersTransactionCommitDisabledResult,
} from './dto/amazon-sp-api-orders-transaction-commit-disabled-contract.dto';

export async function buildAmazonSpApiOrdersTransactionCommitDisabledResult(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
  explicitOperatorConfirmation?: boolean;
  finalReviewAccepted?: boolean;
}): Promise<AmazonSpApiOrdersTransactionCommitDisabledResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();
  const explicitOperatorConfirmation = args.explicitOperatorConfirmation === true;
  const finalReviewAccepted = args.finalReviewAccepted === true;

  if (!companyId) {
    throw new ForbiddenException(
      'STEP151_S_TRANSACTION_COMMIT_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException(
      'STEP151_S_TRANSACTION_COMMIT_IMPORT_JOB_ID_REQUIRED: importJobId is required.',
    );
  }

  const finalReview = await reviewAmazonSpApiOrdersFinalCommit({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  return assertAmazonSpApiOrdersTransactionCommitDisabledContract({
    source: 'amazon-sp-api-orders-transaction-commit-disabled',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/transaction-commit',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    disabled: true,
    accepted: false,
    reason: 'STEP151_S_TRANSACTION_COMMIT_DISABLED_UNTIL_REAL_WRITE_STEP',

    importJobId,
    explicitOperatorConfirmation,
    finalReviewAccepted,

    requiresExplicitOperatorConfirmation: true,
    requiresFinalReviewAccepted: true,
    requiresFinalReviewCanCommit: true,

    finalReview,

    wouldCreateTransactionRows: finalReview.willCreateTransactionRows,
    wouldCreateIncomeTransactionRows: finalReview.willCreateTransactionRows,
    wouldLinkImportJob: true,
    wouldUseImportStagingRowsAsEvidence: true,
    wouldUseDedupeHash: true,

    writesDatabase: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    createsTransactionNow: false,
    createsInventoryMovementNow: false,
    createsExpenseTransactionNow: false,
    touchesInventoryNow: false,
    historicalSyncNow: false,
    settlementOrFeeImportNow: false,
    bankReconciliationNow: false,
  });
}
