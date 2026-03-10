import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionCategoryService {
  list() {
    return {
      ok: true,
      domain: 'transaction-categories',
      action: 'list',
      items: [],
      message: 'transaction-categories list skeleton ready',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'transaction-categories',
      status: 'skeleton',
      message: 'transaction-categories service is ready for Step 31/32 implementation',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'transaction-categories',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'transaction-categories create stub',
    };
  }
}
