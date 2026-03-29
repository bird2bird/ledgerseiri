import { ForbiddenException } from '@nestjs/common';

export const PLAN_LIMIT_REACHED_MESSAGE = 'PLAN_LIMIT_REACHED';

export function throwPlanLimitReached(): never {
  throw new ForbiddenException(PLAN_LIMIT_REACHED_MESSAGE);
}
