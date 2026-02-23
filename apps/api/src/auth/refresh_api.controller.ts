import { Controller } from '@nestjs/common';
import { RefreshController } from './refresh.controller';

// Same logic, different prefix
@Controller('/api/auth')
export class RefreshApiController extends RefreshController {}
