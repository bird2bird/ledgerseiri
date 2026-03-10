import { Injectable } from '@nestjs/common';

@Injectable()
export class JobService {
  list() {
    return {
      ok: true,
      domain: 'jobs',
      action: 'list',
      items: [],
      message: 'jobs list skeleton ready',
    };
  }

  getMeta() {
    return {
      ok: true,
      domain: 'jobs',
      status: 'skeleton',
      message: 'jobs service is ready for Step 31/32 implementation',
    };
  }

  create(payload: unknown) {
    return {
      ok: true,
      domain: 'jobs',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'jobs create stub',
    };
  }
}
