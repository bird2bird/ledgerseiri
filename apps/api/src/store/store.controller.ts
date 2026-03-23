import { Body, Controller, Get, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class StoreController {
  constructor(private prisma: PrismaService) {}

  private async getStoreLimit(companyId: string): Promise<number> {
    const row = await this.prisma.workspaceSubscription.findUnique({
      where: { companyId },
      select: { maxStores: true },
    });

    if (typeof row?.maxStores === 'number' && row.maxStores > 0) {
      return row.maxStores;
    }

    return 1;
  }

  private async assertStoreCreateAllowed(companyId: string): Promise<void> {
    const [used, limit] = await Promise.all([
      this.prisma.store.count({ where: { companyId } }),
      this.getStoreLimit(companyId),
    ]);

    if (used >= limit) {
      throw new ForbiddenException('PLAN_LIMIT_REACHED');
    }
  }

  // 读取当前用户公司下的全部店铺
  @Get('store')
  async listStores(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return { stores: [] };

    const stores = await this.prisma.store.findMany({
      where: { companyId: user.companyId },
    });

    return { stores };
  }

  // 创建店铺（归属到当前用户 companyId）
  @Post('store')
  async createStore(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) {
      return { error: 'No company yet. Create company first.' };
    }

    await this.assertStoreCreateAllowed(user.companyId);

    const store = await this.prisma.store.create({
      data: {
        companyId: user.companyId,
        name: body.name || 'Amazon JP Store',
        platform: body.platform || 'AMAZON',
        region: body.region || 'JP',
      },
    });

    return store;
  }
}
