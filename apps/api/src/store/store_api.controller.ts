import { Controller } from '@nestjs/common';
import { StoreController } from './store.controller';

@Controller('api')
export class StoreApiController extends StoreController {}
