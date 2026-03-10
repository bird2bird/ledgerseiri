import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryService {
  list() {
    return {
      ok: true,
      domain: 'inventory',
      action: 'list',
      items: [],
      message: 'inventory list skeleton ready',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'inventory',
      status: 'skeleton',
      message: 'inventory service is ready for Step 31/32 implementation',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'inventory',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'inventory create stub',
    };
  }
}
