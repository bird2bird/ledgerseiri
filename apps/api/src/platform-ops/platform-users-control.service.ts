import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformUsersControlService {
  constructor(private readonly prisma: PrismaService) {}

  async unassign(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { companyId: null },
    });
  }

  async assign(id: string, companyId: string) {
    return this.prisma.user.update({
      where: { id },
      data: { companyId },
    });
  }
}
