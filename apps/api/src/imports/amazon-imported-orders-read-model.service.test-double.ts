import {
  type AmazonImportedOrdersReadModelTestDoubleFilters,
  type AmazonImportedOrdersReadModelTestDoubleImportJob,
  type AmazonImportedOrdersReadModelTestDoubleDetailResult,
  type AmazonImportedOrdersReadModelTestDoubleListResult,
  type AmazonImportedOrdersTestDoubleStagingRow,
} from './dto/amazon-imported-orders-read-model-test-double-contract.dto';
import {
  mapAmazonImportedOrderDetailTestDouble,
  mapAmazonImportedOrdersTestDoubleList,
} from './amazon-imported-orders-read-model.mapper.test-double';

export type AmazonImportedOrdersReadModelTestDoubleServiceInput = {
  companyId: string;
  importJobs: AmazonImportedOrdersReadModelTestDoubleImportJob[];
  stagingRows: AmazonImportedOrdersTestDoubleStagingRow[];
};

export class AmazonImportedOrdersReadModelTestDoubleService {
  constructor(private readonly input: AmazonImportedOrdersReadModelTestDoubleServiceInput) {}

  listImportedOrders(
    filters: AmazonImportedOrdersReadModelTestDoubleFilters = { companyId: this.input.companyId },
  ): AmazonImportedOrdersReadModelTestDoubleListResult {
    return mapAmazonImportedOrdersTestDoubleList({
      companyId: this.input.companyId,
      importJobs: this.input.importJobs,
      stagingRows: this.input.stagingRows,
      filters: {
        ...filters,
        companyId: this.input.companyId,
      },
    });
  }

  getImportedOrderDetail(orderId: string): AmazonImportedOrdersReadModelTestDoubleDetailResult {
    return mapAmazonImportedOrderDetailTestDouble({
      companyId: this.input.companyId,
      orderId,
      importJobs: this.input.importJobs,
      stagingRows: this.input.stagingRows,
    });
  }
}

export const AMAZON_IMPORTED_ORDERS_READ_MODEL_TEST_DOUBLE_SERVICE_STATUS = {
  step: 'Step150-JK',
  testDoubleOnly: true,
  runtimeControllerWiredNow: false,
  queriesPrisma: false,
  callsAmazon: false,
  writesDatabase: false,
  createsImportJob: false,
  createsSyncJob: false,
  createsSyncSegment: false,
} as const;
