import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class StoreController {
  constructor(private prisma: PrismaService) {}

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
