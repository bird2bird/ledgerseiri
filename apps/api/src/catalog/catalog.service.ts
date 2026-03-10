import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  list() {
    return {
      ok: true,
      domain: 'products',
      action: 'list',
      items: [],
      message: 'products list skeleton ready',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'products',
      status: 'skeleton',
      message: 'products service is ready for Step 31/32 implementation',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'products',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'products create stub',
    };
  }
}
