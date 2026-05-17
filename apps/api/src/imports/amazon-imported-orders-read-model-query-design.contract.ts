import {
  assertAmazonImportedOrdersReadModelQueryDesignContract,
  buildAmazonImportedOrdersReadModelQueryDesignContract,
  type AmazonImportedOrdersReadModelQueryDesignContract,
} from './dto/amazon-imported-orders-read-model-query-design-contract.dto';

export type AmazonImportedOrdersReadModelQueryDesignInput = {
  companyId: string;
  limit?: number;
};

export function defineAmazonImportedOrdersReadModelQueryDesign(
  input: AmazonImportedOrdersReadModelQueryDesignInput,
): AmazonImportedOrdersReadModelQueryDesignContract {
  const contract = buildAmazonImportedOrdersReadModelQueryDesignContract(input);
  assertAmazonImportedOrdersReadModelQueryDesignContract(contract);
  return contract;
}

export const AMAZON_IMPORTED_ORDERS_READ_MODEL_QUERY_DESIGN_STATUS = {
  step: 'Step150-I',
  designOnly: true,
  runtimeImplementedNow: false,
  controllerDisabledInStep150H: true,
  queriesPrismaNow: false,
  callsAmazon: false,
  writesDatabase: false,
  createsImportJob: false,
  createsSyncJob: false,
  createsSyncSegment: false,
} as const;
