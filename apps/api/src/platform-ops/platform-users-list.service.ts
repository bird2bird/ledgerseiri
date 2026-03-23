import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformUsersListService {
  constructor(private readonly prisma: PrismaService) {}

  async getList() {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      companyId: row.companyId,
      companyName: row.company?.name ?? null,
      createdAt: row.createdAt,
      assignmentStatus: row.companyId ? 'ASSIGNED' : 'UNASSIGNED',
    }));
  }
}
