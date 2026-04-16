import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DetectMonthConflictsDto } from './dto/detect-month-conflicts.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { CommitImportDto } from './dto/commit-import.dto';

type MonthStat = {
  month: string;
  existingCount: number;
};

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeMonthToken(raw: string): string | null {
    const normalized = String(raw || '').trim();
    const match = normalized.match(/(20\d{2})[-_/]?([01]?\d)/);
    if (!match) return null;

    const year = match[1];
    const monthNum = Number(match[2]);
    if (monthNum < 1 || monthNum > 12) return null;

    return `${year}-${String(monthNum).padStart(2, '0')}`;
  }

  private extractMonths(args: {
    filename?: string;
    csvText?: string;
    workbookBase64?: string;
  }): string[] {
    const candidates = [
      String(args.filename || ''),
      String(args.csvText || '').slice(0, 5000),
      String(args.workbookBase64 || '').slice(0, 5000),
    ];

    const found = new Set<string>();

    for (const input of candidates) {
      const matches = input.match(/20\d{2}[-_/]?(0[1-9]|1[0-2])/g) || [];
      for (const item of matches) {
        const month = this.normalizeMonthToken(item);
        if (month) found.add(month);
      }
    }

    return Array.from(found).sort();
  }

  private async resolveCompanyId(explicitCompanyId?: string): Promise<string> {
    const normalized = String(explicitCompanyId || '').trim();
    if (normalized) return normalized;

    const firstCompany = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!firstCompany?.id) {
      throw new NotFoundException('No company found for imports skeleton');
    }

    return firstCompany.id;
  }

  async detectMonthConflicts(dto: DetectMonthConflictsDto) {
    const companyId = await this.resolveCompanyId(dto.companyId);
    const fileMonths = this.extractMonths(dto);

    if (fileMonths.length === 0) {
      return {
        ok: true,
        action: 'detect-month-conflicts',
        module: dto.module || 'store-orders',
        companyId,
        sourceType: dto.sourceType || 'amazon-csv',
        fileMonths: [],
        existingMonths: [],
        conflictMonths: [],
        hasConflict: false,
        monthStats: [] as MonthStat[],
        message: 'no month tokens detected in filename/csvText yet',
      };
    }

    const existingRows = await this.prisma.transaction.findMany({
      where: {
        companyId,
        businessMonth: {
          in: fileMonths,
        },
      },
      select: {
        businessMonth: true,
      },
    });

    const monthCountMap = new Map<string, number>();
    for (const row of existingRows) {
      const month = String(row.businessMonth || '').trim();
      if (!month) continue;
      monthCountMap.set(month, (monthCountMap.get(month) || 0) + 1);
    }

    const existingMonths = Array.from(monthCountMap.keys()).sort();
    const conflictMonths = fileMonths.filter((month) => monthCountMap.has(month));
    const monthStats: MonthStat[] = conflictMonths.map((month) => ({
      month,
      existingCount: monthCountMap.get(month) || 0,
    }));

    return {
      ok: true,
      action: 'detect-month-conflicts',
      module: dto.module || 'store-orders',
      companyId,
      sourceType: dto.sourceType || 'amazon-csv',
      fileMonths,
      existingMonths,
      conflictMonths,
      hasConflict: conflictMonths.length > 0,
      monthStats,
      message:
        conflictMonths.length > 0
          ? 'month conflicts detected'
          : 'no month conflicts detected',
    };
  }

  async previewImport(dto: PreviewImportDto) {
    const companyId = await this.resolveCompanyId(dto.companyId);
    const detect = await this.detectMonthConflicts(dto);

    const created = await this.prisma.importJob.create({
      data: {
        companyId,
        domain: dto.module || 'store-orders',
        module: dto.module || 'store-orders',
        sourceType: dto.sourceType || 'amazon-csv',
        filename: String(dto.filename || 'import-preview.csv'),
        fileHash: null,
        status: 'PENDING',
        monthConflictPolicy: dto.monthConflictPolicy || 'skip_existing_months',
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        deletedRowCount: 0,
        fileMonthsJson: detect.fileMonths,
        conflictMonthsJson: detect.conflictMonths,
        errorMessage: null,
      },
      select: {
        id: true,
        companyId: true,
        domain: true,
        filename: true,
        status: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ok: true,
      action: 'preview',
      module: dto.module || 'store-orders',
      companyId,
      sourceType: dto.sourceType || 'amazon-csv',
      importJobId: created.id,
      job: created,
      summary: {
        totalRows: 0,
        validRows: 0,
        newRows: 0,
        duplicateRows: 0,
        conflictRows: 0,
        errorRows: 0,
      },
      fileMonths: detect.fileMonths,
      existingMonths: detect.existingMonths,
      conflictMonths: detect.conflictMonths,
      monthConflictPolicy: dto.monthConflictPolicy || 'skip_existing_months',
      rows: [],
      message: 'imports preview skeleton created',
    };
  }

  async commitImport(importJobId: string, dto: CommitImportDto) {
    const companyId = await this.resolveCompanyId(dto.companyId);

    const found = await this.prisma.importJob.findFirst({
      where: {
        id: importJobId,
        companyId,
      },
      select: {
        id: true,
        companyId: true,
        status: true,
      },
    });

    if (!found) {
      throw new NotFoundException(`ImportJob not found: ${importJobId}`);
    }

    const updated = await this.prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'SUCCEEDED',
        monthConflictPolicy: dto.monthConflictPolicy || 'skip_existing_months',
        importedAt: new Date(),
      },
      select: {
        id: true,
        companyId: true,
        domain: true,
        filename: true,
        status: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        importedAt: true,
      },
    });

    return {
      ok: true,
      action: 'commit',
      companyId,
      importJobId,
      monthConflictPolicy: dto.monthConflictPolicy || 'skip_existing_months',
      importedRows: 0,
      duplicateRows: 0,
      conflictRows: 0,
      errorRows: 0,
      deletedRows: 0,
      status: updated.status,
      job: updated,
      message: 'imports commit skeleton completed',
    };
  }

  async listHistory(args: { module?: string; companyId?: string }) {
    const companyId = await this.resolveCompanyId(args.companyId);

    const rows = await this.prisma.importJob.findMany({
      where: {
        companyId,
        ...(args.module ? { module: args.module } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        companyId: true,
        domain: true,
        module: true,
        sourceType: true,
        filename: true,
        fileHash: true,
        status: true,
        monthConflictPolicy: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
        deletedRowCount: true,
        fileMonthsJson: true,
        conflictMonthsJson: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        importedAt: true,
      },
    });

    return {
      ok: true,
      action: 'history',
      companyId,
      module: args.module || null,
      total: rows.length,
      items: rows,
      message: 'imports history loaded',
    };
  }
}
