import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceService {
  list() {
    return {
      ok: true,
      domain: 'invoices',
      action: 'list',
      items: [],
      message: 'invoices list skeleton ready',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'invoices',
      status: 'skeleton',
      message: 'invoices service is ready for Step 31/32 implementation',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'invoices',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'invoices create stub',
    };
  }
}
