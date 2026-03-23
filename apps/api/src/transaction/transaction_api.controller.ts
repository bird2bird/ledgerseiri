import { Controller, Req } from '@nestjs/common';
import { TransactionController } from './transaction.controller';

@Controller('api')
export class TransactionApiController extends TransactionController {}
