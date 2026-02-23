import { Controller } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';

@Controller('api')
export class DashboardApiController extends DashboardController {}
