import {
  buildAmazonSpApiOrdersDryRunPreview,
  type AmazonSpApiOrdersDryRunInput,
  type AmazonSpApiOrdersDryRunPreviewEnvelope,
  type AmazonSpApiOrdersDryRunRegion,
} from './amazon-sp-api-orders-dry-run-fixture';

export type AmazonSpApiOrdersPreviewServiceRequest = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: AmazonSpApiOrdersDryRunRegion;
  createdAfter: string;
  createdBefore: string;
  orderStatuses?: readonly string[];
  dryRun: true;
};

export type AmazonSpApiOrdersPreviewServiceResult = AmazonSpApiOrdersDryRunPreviewEnvelope & {
  service: 'AmazonSpApiOrdersPreviewService';
  previewMode: 'dry-run-fixture';
  serviceWritesDatabase: false;
  serviceCallsAmazon: false;
  controllerRouteUsed: false;
};

export class AmazonSpApiOrdersPreviewService {
  previewDryRun(request: AmazonSpApiOrdersPreviewServiceRequest): AmazonSpApiOrdersPreviewServiceResult {
    this.assertPreviewRequest(request);

    const preview = buildAmazonSpApiOrdersDryRunPreview({
      companyId: request.companyId,
      storeId: request.storeId,
      marketplaceId: request.marketplaceId,
      region: request.region,
      createdAfter: request.createdAfter,
      createdBefore: request.createdBefore,
      orderStatuses: request.orderStatuses,
      dryRun: true,
    });

    return {
      ...preview,
      service: 'AmazonSpApiOrdersPreviewService',
      previewMode: 'dry-run-fixture',
      serviceWritesDatabase: false,
      serviceCallsAmazon: false,
      controllerRouteUsed: false,
    };
  }

  private assertPreviewRequest(request: AmazonSpApiOrdersPreviewServiceRequest): void {
    if (!request) {
      throw new Error('Step140-J preview service violation: request is required.');
    }

    const requiredStringFields: Array<keyof Pick<
      AmazonSpApiOrdersPreviewServiceRequest,
      'companyId' | 'storeId' | 'marketplaceId' | 'region' | 'createdAfter' | 'createdBefore'
    >> = ['companyId', 'storeId', 'marketplaceId', 'region', 'createdAfter', 'createdBefore'];

    for (const field of requiredStringFields) {
      const value = request[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`Step140-J preview service violation: ${field} is required.`);
      }
    }

    if (request.dryRun !== true) {
      throw new Error('Step140-J preview service violation: dryRun must be true.');
    }

    if (!['FE', 'NA', 'EU'].includes(request.region)) {
      throw new Error('Step140-J preview service violation: region must be FE, NA, or EU.');
    }

    const createdAfter = Date.parse(request.createdAfter);
    const createdBefore = Date.parse(request.createdBefore);

    if (!Number.isFinite(createdAfter)) {
      throw new Error('Step140-J preview service violation: createdAfter must be an ISO datetime.');
    }

    if (!Number.isFinite(createdBefore)) {
      throw new Error('Step140-J preview service violation: createdBefore must be an ISO datetime.');
    }

    if (createdAfter >= createdBefore) {
      throw new Error('Step140-J preview service violation: createdAfter must be before createdBefore.');
    }

    if (request.orderStatuses && !Array.isArray(request.orderStatuses)) {
      throw new Error('Step140-J preview service violation: orderStatuses must be an array when provided.');
    }

    if (request.orderStatuses?.some((status) => typeof status !== 'string' || status.trim().length === 0)) {
      throw new Error('Step140-J preview service violation: orderStatuses must contain non-empty strings.');
    }
  }
}

export function buildAmazonSpApiOrdersPreviewService(): AmazonSpApiOrdersPreviewService {
  return new AmazonSpApiOrdersPreviewService();
}

export function previewAmazonSpApiOrdersDryRun(
  request: AmazonSpApiOrdersPreviewServiceRequest,
): AmazonSpApiOrdersPreviewServiceResult {
  return buildAmazonSpApiOrdersPreviewService().previewDryRun(request);
}

export type {
  AmazonSpApiOrdersDryRunInput,
  AmazonSpApiOrdersDryRunPreviewEnvelope,
};
