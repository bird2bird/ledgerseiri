import { Controller, Get, Query } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';

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
}
