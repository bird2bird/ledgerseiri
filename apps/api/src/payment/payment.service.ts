import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  list() {
    return {
      ok: true,
      domain: 'payments',
      action: 'list',
      items: [],
      message: 'payments list skeleton ready',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'payments',
      status: 'skeleton',
      message: 'payments service is ready for Step 31/32 implementation',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'payments',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'payments create stub',
    };
  }
}
