import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  projectAmazonSpApiOrdersReadyRowsToTransactionDryRun,
} from './amazon-sp-api-orders-transaction-dry-run-projection.service';
import {
  projectAmazonSpApiOrdersReadyRowsToInventoryDryRun,
} from './amazon-sp-api-orders-inventory-dry-run-projection.service';
import {
  assertAmazonSpApiOrdersCombinedDryRunProjectionContract,
  type AmazonSpApiOrdersCombinedDryRunProjectionResult,
} from './dto/amazon-sp-api-orders-combined-dry-run-projection-contract.dto';

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

export async function projectAmazonSpApiOrdersCombinedDryRun(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
}): Promise<AmazonSpApiOrdersCombinedDryRunProjectionResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();

  if (!companyId) {
    throw new ForbiddenException(
      'STEP151_Q_COMBINED_PROJECTION_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException(
      'STEP151_Q_COMBINED_PROJECTION_IMPORT_JOB_ID_REQUIRED: importJobId is required.',
    );
  }

  const transaction = await projectAmazonSpApiOrdersReadyRowsToTransactionDryRun({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  const inventory = await projectAmazonSpApiOrdersReadyRowsToInventoryDryRun({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  return assertAmazonSpApiOrdersCombinedDryRunProjectionContract({
    source: 'amazon-sp-api-orders-combined-dry-run-projection',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/combined-dry-run-projection',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    dryRun: true,
    importJobId,
    writesDatabase: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    createsTransactionNow: false,
    createsInventoryMovementNow: false,
    historicalSyncNow: false,
    transaction,
    inventory,
    combined: {
      transactionDraftRows: transaction.projectedTransactionRows,
      inventoryMovementDraftRows: inventory.projectedInventoryMovementRows,
      transactionExcludedRows: transaction.excludedRows,
      inventoryExcludedRows: inventory.excludedRows,
      amountTotal: transaction.amountTotal,
      quantityTotal: inventory.quantityTotal,
      blockers: uniqueStrings([...transaction.blockers, ...inventory.blockers]),
      warnings: uniqueStrings([...transaction.warnings, ...inventory.warnings]),
    },
  });
}
