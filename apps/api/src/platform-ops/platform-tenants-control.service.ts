import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformTenantsControlService {
  constructor(private readonly prisma: PrismaService) {}

  async suspend(id: string) {
    return this.prisma.company.update({
      where: { id },
      data: { status: 'SUSPENDED' as any },
    });
  }

  async activate(id: string) {
    return this.prisma.company.update({
      where: { id },
      data: { status: 'ACTIVE' as any },
    });
  }
}
