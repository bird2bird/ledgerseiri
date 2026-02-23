import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class CompanyController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('company')
  async createCompany(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const company = await this.prisma.company.create({
      data: {
        name: body.name || 'My Company',
        fiscalMonthStart: Number(body.fiscalMonthStart) || 1,
        timezone: body.timezone || 'Asia/Tokyo',
        currency: body.currency || 'JPY',
        users: { connect: { id: userId } },
      },
    });

    // 把 user.companyId 关联起来（显式）
    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return company;
  }

  @UseGuards(JwtAuthGuard)
  @Get('company')
  async getMyCompany(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return { company: null, stores: [] };

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    const stores = await this.prisma.store.findMany({ where: { companyId: user.companyId } });
    return { company, stores };
  }}
