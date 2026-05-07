import type { AmazonOrderNormalizedPayload } from '../amazon-order-normalized-contract';
import {
  type AmazonSpApiSandboxOverrideAuditSnapshot,
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
} from './amazon-sp-api-sandbox-override-audit-snapshot.dto';
import {
  type AmazonSpApiSandboxPersistencePreflightChecklist,
  assertAmazonSpApiSandboxPersistencePreflightChecklist,
} from './amazon-sp-api-sandbox-persistence-preflight-checklist.dto';
import { buildAmazonOrderCrossSourceDedupeKey } from './amazon-sp-api-sandbox-csv-dedupe-boundary.dto';

export const AMAZON_SP_API_SANDBOX_STAGED_IMPORTJOB_PERSISTENCE_PLAN_VERSION =
  'amazon-sp-api-sandbox-staged-importjob-persistence-plan-v1' as const;

export type AmazonSpApiSandboxPlannedImportJobData = {
  companyId: string;
  domain: 'store-orders';
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  filename: string;
  status: 'PENDING';
  totalRows: number;
  successRows: 0;
  failedRows: 0;
  fileMonthsJson: string[];
  importedAt: null;
  dryRunOnly: true;
  persistenceExecutionAllowed: false;
};

export type AmazonSpApiSandboxPlannedStagingRowData = {
  module: 'store-orders';
  rowNo: number;
  businessMonth: string | null;
  matchStatus: 'conflict_review_required' | 'new';
  matchReason:
    | 'STEP118_A_SP_API_SANDBOX_STAGED_PLAN_CONFLICT_REVIEW'
    | 'STEP118_A_SP_API_SANDBOX_STAGED_PLAN_NEW';
  dedupeHash: string;
  canonicalDedupeKey: string | null;
  normalizedPayloadJson: AmazonOrderNormalizedPayload & Record<string, unknown>;
  rawPayloadJson: Record<string, unknown>;
  overrideAuditSnapshot: AmazonSpApiSandboxOverrideAuditSnapshot | null;
};

export type AmazonSpApiSandboxStagedImportJobPersistencePlan = {
  version: typeof AMAZON_SP_API_SANDBOX_STAGED_IMPORTJOB_PERSISTENCE_PLAN_VERSION;
  planOnly: true;
  writesDatabase: false;
  currentExecutionAllowed: false;
  futureExecutionRequiresPreflight: true;
  companyId: string;
  filename: string;
  preflightChecklist: AmazonSpApiSandboxPersistencePreflightChecklist;
  plannedImportJob: AmazonSpApiSandboxPlannedImportJobData;
  plannedStagingRows: AmazonSpApiSandboxPlannedStagingRowData[];
  blockedNow: {
    createImportJob: true;
    createImportStagingRows: true;
    commitTransactions: true;
    overwriteExistingTransactions: true;
    deductInventory: true;
    controllerRoute: true;
    frontendRoute: true;
  };
  warnings: string[];
};

function uniqueSortedMonths(rows: Array<{ businessMonth: string | null }>): string[] {
  return Array.from(
    new Set(rows.map((row) => row.businessMonth).filter((value): value is string => Boolean(value))),
  ).sort();
}

function buildPlanDedupeHash(args: {
  companyId: string;
  canonicalDedupeKey: string | null;
  payload: AmazonOrderNormalizedPayload & Record<string, unknown>;
}): string {
  const base = [
    'step118-a-plan',
    args.companyId,
    args.canonicalDedupeKey || 'missing-canonical-key',
    args.payload.sourceType,
    args.payload.amazonOrderId || args.payload.orderId,
    args.payload.normalizedSellerSku || args.payload.sellerSku,
    args.payload.businessMonth,
    args.payload.quantity,
    args.payload.grossAmount,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }

  return `step118a-${hash.toString(16).padStart(8, '0')}`;
}

export function buildAmazonSpApiSandboxStagedImportJobPersistencePlan(args: {
  companyId: string;
  filename: string;
  previewRows: Array<{
    rowNo: number;
    businessMonth: string | null;
    dedupeHash?: string;
    payload: AmazonOrderNormalizedPayload & Record<string, unknown>;
  }>;
  preflightChecklist: AmazonSpApiSandboxPersistencePreflightChecklist;
  overrideAuditSnapshots?: AmazonSpApiSandboxOverrideAuditSnapshot[];
}): AmazonSpApiSandboxStagedImportJobPersistencePlan {
  const preflightChecklist = assertAmazonSpApiSandboxPersistencePreflightChecklist(
    args.preflightChecklist,
  );

  const snapshots = (args.overrideAuditSnapshots || []).map((snapshot) =>
    assertAmazonSpApiSandboxOverrideAuditSnapshot(snapshot),
  );

  const snapshotByCanonicalKey = new Map<string, AmazonSpApiSandboxOverrideAuditSnapshot>();
  for (const snapshot of snapshots) {
    if (snapshot.canonicalKey) {
      snapshotByCanonicalKey.set(snapshot.canonicalKey, snapshot);
    }
  }

  const plannedStagingRows: AmazonSpApiSandboxPlannedStagingRowData[] = args.previewRows.map(
    (row, index) => {
      const key = buildAmazonOrderCrossSourceDedupeKey({ payload: row.payload });
      const snapshot = key.canonicalKey ? snapshotByCanonicalKey.get(key.canonicalKey) || null : null;
      const matchStatus = snapshot ? 'conflict_review_required' : 'new';
      const dedupeHash =
        row.dedupeHash ||
        buildPlanDedupeHash({
          companyId: args.companyId,
          canonicalDedupeKey: key.canonicalKey,
          payload: row.payload,
        });

      return {
        module: 'store-orders',
        rowNo: row.rowNo || index + 1,
        businessMonth: row.businessMonth || row.payload.businessMonth || null,
        matchStatus,
        matchReason: snapshot
          ? 'STEP118_A_SP_API_SANDBOX_STAGED_PLAN_CONFLICT_REVIEW'
          : 'STEP118_A_SP_API_SANDBOX_STAGED_PLAN_NEW',
        dedupeHash,
        canonicalDedupeKey: key.canonicalKey,
        normalizedPayloadJson: {
          ...row.payload,
          importJobId: null,
          sourceFileName: args.filename,
          dedupeHash,
          canonicalDedupeKey: key.canonicalKey,
          step118PlanOnly: true,
        },
        rawPayloadJson: {
          sourceType: row.payload.sourceType,
          amazonOrderId: row.payload.amazonOrderId,
          orderId: row.payload.orderId,
          sellerSku: row.payload.sellerSku,
          normalizedSellerSku: row.payload.normalizedSellerSku,
          businessMonth: row.businessMonth || row.payload.businessMonth || null,
          quantity: row.payload.quantity,
          grossAmount: row.payload.grossAmount,
          step118PlanOnly: true,
        },
        overrideAuditSnapshot: snapshot,
      };
    },
  );

  const warnings: string[] = [];

  if (preflightChecklist.currentPersistenceAllowed !== false) {
    warnings.push('UNEXPECTED_PREFLIGHT_PERSISTENCE_ALLOWED');
  }

  if (preflightChecklist.summary.readyForPersistence !== false) {
    warnings.push('UNEXPECTED_READY_FOR_PERSISTENCE');
  }

  if (plannedStagingRows.some((row) => !row.canonicalDedupeKey)) {
    warnings.push('MISSING_CANONICAL_DEDUPE_KEY');
  }

  if (plannedStagingRows.some((row) => row.overrideAuditSnapshot)) {
    warnings.push('OVERRIDE_AUDIT_SNAPSHOT_ATTACHED_FOR_REVIEW_ONLY');
  }

  const fileMonthsJson = uniqueSortedMonths(plannedStagingRows);

  return {
    version: AMAZON_SP_API_SANDBOX_STAGED_IMPORTJOB_PERSISTENCE_PLAN_VERSION,
    planOnly: true,
    writesDatabase: false,
    currentExecutionAllowed: false,
    futureExecutionRequiresPreflight: true,
    companyId: args.companyId,
    filename: args.filename,
    preflightChecklist,
    plannedImportJob: {
      companyId: args.companyId,
      domain: 'store-orders',
      module: 'store-orders',
      sourceType: 'amazon-sp-api-sandbox',
      filename: args.filename,
      status: 'PENDING',
      totalRows: plannedStagingRows.length,
      successRows: 0,
      failedRows: 0,
      fileMonthsJson,
      importedAt: null,
      dryRunOnly: true,
      persistenceExecutionAllowed: false,
    },
    plannedStagingRows,
    blockedNow: {
      createImportJob: true,
      createImportStagingRows: true,
      commitTransactions: true,
      overwriteExistingTransactions: true,
      deductInventory: true,
      controllerRoute: true,
      frontendRoute: true,
    },
    warnings,
  };
}

export function assertAmazonSpApiSandboxStagedImportJobPersistencePlan(
  plan: AmazonSpApiSandboxStagedImportJobPersistencePlan,
): AmazonSpApiSandboxStagedImportJobPersistencePlan {
  if (plan.version !== AMAZON_SP_API_SANDBOX_STAGED_IMPORTJOB_PERSISTENCE_PLAN_VERSION) {
    throw new Error('Step118-A plan violation: version mismatch.');
  }

  if (plan.planOnly !== true) {
    throw new Error('Step118-A plan violation: planOnly must be true.');
  }

  if (plan.writesDatabase !== false) {
    throw new Error('Step118-A plan violation: writesDatabase must be false.');
  }

  if (plan.currentExecutionAllowed !== false) {
    throw new Error('Step118-A plan violation: currentExecutionAllowed must be false.');
  }

  if (plan.plannedImportJob.persistenceExecutionAllowed !== false) {
    throw new Error('Step118-A plan violation: planned ImportJob execution must remain disabled.');
  }

  if (plan.plannedImportJob.dryRunOnly !== true) {
    throw new Error('Step118-A plan violation: planned ImportJob must remain dryRunOnly.');
  }

  if (plan.plannedImportJob.status !== 'PENDING') {
    throw new Error('Step118-A plan violation: planned ImportJob status must be PENDING.');
  }

  for (const [key, blocked] of Object.entries(plan.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step118-A plan violation: blockedNow.${key} must remain true.`);
    }
  }

  return plan;
}
