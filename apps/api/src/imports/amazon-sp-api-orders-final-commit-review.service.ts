import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  projectAmazonSpApiOrdersCombinedDryRun,
} from './amazon-sp-api-orders-combined-dry-run-projection.service';
import {
  assertAmazonSpApiOrdersFinalCommitReviewContract,
  type AmazonSpApiOrdersFinalCommitReviewResult,
} from './dto/amazon-sp-api-orders-final-commit-review-contract.dto';

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

export async function reviewAmazonSpApiOrdersFinalCommit(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
}): Promise<AmazonSpApiOrdersFinalCommitReviewResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();

  if (!companyId) {
    throw new ForbiddenException(
      'STEP151_R_FINAL_COMMIT_REVIEW_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException(
      'STEP151_R_FINAL_COMMIT_REVIEW_IMPORT_JOB_ID_REQUIRED: importJobId is required.',
    );
  }

  const combined = await projectAmazonSpApiOrdersCombinedDryRun({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  const blockers = uniqueStrings(combined.combined.blockers);
  const warnings = uniqueStrings(combined.combined.warnings);
  const transactionExcludedRows = combined.combined.transactionExcludedRows;
  const inventoryExcludedRows = combined.combined.inventoryExcludedRows;
  const blockedRows = Math.max(transactionExcludedRows, inventoryExcludedRows);
  const willCreateTransactionRows = combined.combined.transactionDraftRows;
  const willCreateInventoryMovementRows = combined.combined.inventoryMovementDraftRows;

  const finalCanCommit =
    willCreateTransactionRows > 0 &&
    willCreateInventoryMovementRows > 0 &&
    blockedRows === 0 &&
    blockers.length === 0;

  return assertAmazonSpApiOrdersFinalCommitReviewContract({
    source: 'amazon-sp-api-orders-final-commit-review',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/final-commit-review',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    dryRun: true,
    reviewOnly: true,
    importJobId,

    writesDatabase: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    createsTransactionNow: false,
    createsInventoryMovementNow: false,
    historicalSyncNow: false,

    requiresExplicitConfirmation: true,
    finalCanCommit,

    willCreateTransactionRows,
    willCreateInventoryMovementRows,
    blockedRows,
    transactionExcludedRows,
    inventoryExcludedRows,
    amountTotal: combined.combined.amountTotal,
    quantityTotal: combined.combined.quantityTotal,

    blockers,
    warnings,

    transactionDraftsPreview: combined.transaction.drafts.slice(0, 10),
    inventoryDraftsPreview: combined.inventory.drafts.slice(0, 10),

    combined,
  });
}
