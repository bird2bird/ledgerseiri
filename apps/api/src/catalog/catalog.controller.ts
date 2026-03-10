import { Body, Controller, Get, Post } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('api/products')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
