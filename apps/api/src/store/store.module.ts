import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StoreApiController } from "./store_api.controller";
import { StoreController } from './store.controller';

@Module({
  controllers: [StoreController, StoreApiController],
  providers: [PrismaService],
})
export class StoreModule {}
