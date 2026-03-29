import { Injectable } from '@nestjs/common';
import { PlatformReconciliationOverrideService } from './platform-reconciliation-override.service';

@Injectable()
export class PlatformReconciliationBatchService {
  constructor(
    private readonly overrideService: PlatformReconciliationOverrideService,
  ) {}

  async batchOverride(ids: string[], decision: string) {
    const normalizedIds = Array.from(
      new Set(
        (ids || [])
          .map((id) => String(id || '').trim())
          .filter(Boolean),
      ),
    );

    let success = 0;
    let failed = 0;
    const failedIds: string[] = [];

    for (const id of normalizedIds) {
      try {
        await this.overrideService.override(id, decision);
        success += 1;
      } catch {
        failed += 1;
        failedIds.push(id);
      }
    }

    return {
      attempted: normalizedIds.length,
      success,
      failed,
      failedIds,
    };
  }
}
