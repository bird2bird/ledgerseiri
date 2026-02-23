import { Controller } from '@nestjs/common';
import { TransactionController } from './transaction.controller';

@Controller('api')
export class TransactionApiController extends TransactionController {}
