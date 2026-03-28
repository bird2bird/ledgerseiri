import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { WorkspaceService } from './workspace.service';

@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('context')
  async getContext(
    @Query('slug') slug?: string,
    @Query('plan') plan?: string,
    @Query('locale') locale?: string,
  ) {
    return this.workspaceService.getContext({
      slug,
      plan,
      locale,
    });
  }

  @Get('usage')
  async getUsage(
    @Query('slug') slug?: string,
    @Query('plan') plan?: string,
    @Query('locale') locale?: string,
  ) {
    return this.workspaceService.getUsage({
      slug,
      plan,
      locale,
    });
  }
}
