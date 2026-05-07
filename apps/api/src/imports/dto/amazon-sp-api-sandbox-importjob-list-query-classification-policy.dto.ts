import {
  type AmazonSpApiSandboxImportCenterVisibilityContract,
  assertAmazonSpApiSandboxImportCenterVisibilityContract,
} from './amazon-sp-api-sandbox-import-center-visibility-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_CLASSIFICATION_POLICY_VERSION =
  'amazon-sp-api-sandbox-importjob-list-query-classification-policy-v1' as const;

export type AmazonSpApiSandboxImportJobListClassification =
  | 'AMAZON_SP_API_SANDBOX_PENDING_REVIEW'
  | 'AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING'
  | 'NON_SP_API_IMPORT_JOB'
  | 'INVALID_SP_API_SANDBOX_IMPORT_JOB';

export type AmazonSpApiSandboxImportJobListQueryClassificationPolicy = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_CLASSIFICATION_POLICY_VERSION;
  module: 'store-orders';
  domain: 'income';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  policyOnly: true;
  controllerExposed: false;
  frontendExposed: false;
  writesDatabase: false;

  sourceVisibilityContract: AmazonSpApiSandboxImportCenterVisibilityContract;

  listQueryPolicy: {
    mayIncludeInImportCenterListEventually: true;
    mayExposeViaControllerNow: false;
    mayExposeViaFrontendNow: false;
    requiredSourceType: 'amazon-sp-api-sandbox';
    requiredModule: 'store-orders';
    requiredStatus: 'PENDING';
    requiredSuccessRows: 0;
    requiredFailedRows: 0;
    requiredImportedAt: null;
    requiredStagingTargetEntityId: null;
  };

  classificationRules: {
    pendingReviewRule: {
      classification: 'AMAZON_SP_API_SANDBOX_PENDING_REVIEW';
      sourceType: 'amazon-sp-api-sandbox';
      module: 'store-orders';
      status: 'PENDING';
      successRows: 0;
      failedRows: 0;
      importedAt: null;
      targetEntityId: null;
      displayLifecycle: 'pending-review';
      displayStatus: 'PENDING';
    };
    uncommittedStagingRule: {
      classification: 'AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING';
      sourceType: 'amazon-sp-api-sandbox';
      hasStagingRows: true;
      targetEntityId: null;
      transactionRows: 0;
      inventoryMovementRows: 0;
    };
    invalidCommittedRule: {
      classification: 'INVALID_SP_API_SANDBOX_IMPORT_JOB';
      invalidIfSuccessRowsGreaterThanZero: true;
      invalidIfFailedRowsGreaterThanZero: true;
      invalidIfImportedAtNotNull: true;
      invalidIfTargetEntityIdNotNull: true;
    };
  };

  listItemPresentation: {
    sourceBadge: 'SP-API sandbox';
    lifecycleBadge: 'Pending review';
    commitBadge: 'Not committed';
    inventoryBadge: 'Inventory not executed';
    primaryAction: 'view-only';
    destructiveActionAllowed: false;
    commitActionAllowed: false;
    inventoryActionAllowed: false;
    overwriteActionAllowed: false;
    realSpApiActionAllowed: false;
    oauthActionAllowed: false;
  };

  blockedNow: {
    controllerRoute: true;
    frontendRoute: true;
    commitSales: true;
    executeInventory: true;
    overwriteTransactions: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForListQueryClassificationDesign: true;
    readyForListQueryImplementation: false;
    readyForControllerExposure: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export type AmazonSpApiSandboxImportJobListCandidate = {
  sourceType: string | null;
  module: string | null;
  status: string | null;
  successRows: number | null;
  failedRows: number | null;
  importedAt: Date | string | null;
  stagingRows: number;
  stagingTargetEntityIds: Array<string | null>;
  transactionRows?: number;
  inventoryMovementRows?: number;
};

export type AmazonSpApiSandboxImportJobListClassificationResult = {
  classification: AmazonSpApiSandboxImportJobListClassification;
  visibleAsPendingReview: boolean;
  displayLifecycle: 'pending-review' | 'non-sp-api' | 'invalid';
  displayStatus: 'PENDING' | 'NON_SP_API' | 'INVALID';
  badges: string[];
  allowedActions: {
    viewOnly: boolean;
    commitSales: false;
    executeInventory: false;
    overwriteTransactions: false;
    realSpApi: false;
    oauth: false;
  };
  reason: string;
};

export function buildAmazonSpApiSandboxImportJobListQueryClassificationPolicy(args: {
  visibilityContract: AmazonSpApiSandboxImportCenterVisibilityContract;
}): AmazonSpApiSandboxImportJobListQueryClassificationPolicy {
  const visibilityContract = assertAmazonSpApiSandboxImportCenterVisibilityContract(
    args.visibilityContract,
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_CLASSIFICATION_POLICY_VERSION,
    module: 'store-orders',
    domain: 'income',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    policyOnly: true,
    controllerExposed: false,
    frontendExposed: false,
    writesDatabase: false,

    sourceVisibilityContract: visibilityContract,

    listQueryPolicy: {
      mayIncludeInImportCenterListEventually: true,
      mayExposeViaControllerNow: false,
      mayExposeViaFrontendNow: false,
      requiredSourceType: 'amazon-sp-api-sandbox',
      requiredModule: 'store-orders',
      requiredStatus: 'PENDING',
      requiredSuccessRows: 0,
      requiredFailedRows: 0,
      requiredImportedAt: null,
      requiredStagingTargetEntityId: null,
    },

    classificationRules: {
      pendingReviewRule: {
        classification: 'AMAZON_SP_API_SANDBOX_PENDING_REVIEW',
        sourceType: 'amazon-sp-api-sandbox',
        module: 'store-orders',
        status: 'PENDING',
        successRows: 0,
        failedRows: 0,
        importedAt: null,
        targetEntityId: null,
        displayLifecycle: 'pending-review',
        displayStatus: 'PENDING',
      },
      uncommittedStagingRule: {
        classification: 'AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING',
        sourceType: 'amazon-sp-api-sandbox',
        hasStagingRows: true,
        targetEntityId: null,
        transactionRows: 0,
        inventoryMovementRows: 0,
      },
      invalidCommittedRule: {
        classification: 'INVALID_SP_API_SANDBOX_IMPORT_JOB',
        invalidIfSuccessRowsGreaterThanZero: true,
        invalidIfFailedRowsGreaterThanZero: true,
        invalidIfImportedAtNotNull: true,
        invalidIfTargetEntityIdNotNull: true,
      },
    },

    listItemPresentation: {
      sourceBadge: 'SP-API sandbox',
      lifecycleBadge: 'Pending review',
      commitBadge: 'Not committed',
      inventoryBadge: 'Inventory not executed',
      primaryAction: 'view-only',
      destructiveActionAllowed: false,
      commitActionAllowed: false,
      inventoryActionAllowed: false,
      overwriteActionAllowed: false,
      realSpApiActionAllowed: false,
      oauthActionAllowed: false,
    },

    blockedNow: {
      controllerRoute: true,
      frontendRoute: true,
      commitSales: true,
      executeInventory: true,
      overwriteTransactions: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForListQueryClassificationDesign: true,
      readyForListQueryImplementation: false,
      readyForControllerExposure: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function classifyAmazonSpApiSandboxImportJobListCandidate(
  candidate: AmazonSpApiSandboxImportJobListCandidate,
): AmazonSpApiSandboxImportJobListClassificationResult {
  if (candidate.sourceType !== 'amazon-sp-api-sandbox') {
    return {
      classification: 'NON_SP_API_IMPORT_JOB',
      visibleAsPendingReview: false,
      displayLifecycle: 'non-sp-api',
      displayStatus: 'NON_SP_API',
      badges: [],
      allowedActions: {
        viewOnly: true,
        commitSales: false,
        executeInventory: false,
        overwriteTransactions: false,
        realSpApi: false,
        oauth: false,
      },
      reason: 'candidate sourceType is not amazon-sp-api-sandbox',
    };
  }

  const hasCommittedCounters =
    Number(candidate.successRows || 0) > 0 ||
    Number(candidate.failedRows || 0) > 0 ||
    candidate.importedAt !== null;

  const hasCommittedTargets = candidate.stagingTargetEntityIds.some((value) => value !== null);

  if (
    candidate.module !== 'store-orders' ||
    candidate.status !== 'PENDING' ||
    hasCommittedCounters ||
    hasCommittedTargets
  ) {
    return {
      classification: 'INVALID_SP_API_SANDBOX_IMPORT_JOB',
      visibleAsPendingReview: false,
      displayLifecycle: 'invalid',
      displayStatus: 'INVALID',
      badges: ['SP-API sandbox', 'Invalid visibility state'],
      allowedActions: {
        viewOnly: true,
        commitSales: false,
        executeInventory: false,
        overwriteTransactions: false,
        realSpApi: false,
        oauth: false,
      },
      reason: 'SP-API sandbox ImportJob must remain store-orders/PENDING/uncommitted with null targetEntityId',
    };
  }

  return {
    classification:
      candidate.stagingRows > 0
        ? 'AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING'
        : 'AMAZON_SP_API_SANDBOX_PENDING_REVIEW',
    visibleAsPendingReview: true,
    displayLifecycle: 'pending-review',
    displayStatus: 'PENDING',
    badges: [
      'SP-API sandbox',
      'Pending review',
      'Not committed',
      'Inventory not executed',
    ],
    allowedActions: {
      viewOnly: true,
      commitSales: false,
      executeInventory: false,
      overwriteTransactions: false,
      realSpApi: false,
      oauth: false,
    },
    reason: 'SP-API sandbox ImportJob is visible only as pending review / uncommitted staging',
  };
}

export function assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy(
  policy: AmazonSpApiSandboxImportJobListQueryClassificationPolicy,
): AmazonSpApiSandboxImportJobListQueryClassificationPolicy {
  if (policy.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_CLASSIFICATION_POLICY_VERSION) {
    throw new Error('Step122-B list query classification policy violation: version mismatch.');
  }

  if (policy.policyOnly !== true || policy.writesDatabase !== false) {
    throw new Error('Step122-B list query classification policy violation: policy-only and non-writing required.');
  }

  if (policy.controllerExposed !== false || policy.frontendExposed !== false) {
    throw new Error('Step122-B list query classification policy violation: controller/frontend must remain disabled.');
  }

  if (
    policy.listItemPresentation.commitActionAllowed !== false ||
    policy.listItemPresentation.inventoryActionAllowed !== false ||
    policy.listItemPresentation.overwriteActionAllowed !== false ||
    policy.listItemPresentation.realSpApiActionAllowed !== false ||
    policy.listItemPresentation.oauthActionAllowed !== false
  ) {
    throw new Error('Step122-B list query classification policy violation: dangerous list actions must remain disabled.');
  }

  for (const [key, blocked] of Object.entries(policy.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-B list query classification policy violation: blockedNow.${key} must remain true.`);
    }
  }

  return policy;
}
