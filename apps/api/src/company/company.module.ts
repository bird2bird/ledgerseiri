import { Module } from '@nestjs/common';
import { CompanyApiController } from "./company_api.controller";
import { CompanyController } from './company.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CompanyController, CompanyApiController],
  providers: [PrismaService],
})
export class CompanyModule {}
