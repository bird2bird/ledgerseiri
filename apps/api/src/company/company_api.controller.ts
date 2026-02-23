import { Controller } from '@nestjs/common';
import { CompanyController } from './company.controller';

@Controller('api')
export class CompanyApiController extends CompanyController {}
