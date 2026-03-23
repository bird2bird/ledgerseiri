import { Controller } from '@nestjs/common';
import { PlatformAuthController } from './platform-auth.controller';

@Controller('api/platform-auth')
export class PlatformAuthApiController extends PlatformAuthController {}
