import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type JobDomain = 'import-jobs' | 'export-jobs';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!company) {
      throw new Error('No company found. Please create a company first.');
    }

    return company.id;
  }

  private mapImportJob(item: {
    id: string;
    companyId: string;
    domain: string;
    filename: string;
    status: string;
    totalRows: number | null;
    successRows: number | null;
    failedRows: number | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      companyId: item.companyId,
      domain: item.domain,
      filename: item.filename,
      status: item.status,
      totalRows: item.totalRows,
      successRows: item.successRows,
      failedRows: item.failedRows,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private mapExportJob(item: {
    id: string;
    companyId: string;
    domain: string;
    format: string;
    status: string;
    filterJson: unknown;
    fileUrl: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      companyId: item.companyId,
      domain: item.domain,
      format: item.format,
      status: item.status,
      filterJson: item.filterJson,
      fileUrl: item.fileUrl,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listImportJobs() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.importJob.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      ok: true,
      domain: 'import-jobs',
      action: 'list',
      items: rows.map((item) => this.mapImportJob(item)),
      total: rows.length,
      message: 'import-jobs loaded',
    };
  }

  async getImportMeta() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.importJob.findMany({
      where: { companyId },
      select: {
        domain: true,
        status: true,
      },
    });

    const domainSet = new Set<string>();
    let pending = 0;
    let processing = 0;
    let succeeded = 0;
    let failed = 0;

    for (const row of rows) {
      if (row.domain) domainSet.add(row.domain);

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING') pending += 1;
      else if (status === 'PROCESSING') processing += 1;
      else if (status === 'SUCCEEDED') succeeded += 1;
      else if (status === 'FAILED') failed += 1;
    }

    return {
      ok: true,
      domain: 'import-jobs',
      action: 'meta',
      domains: [
        { value: '', label: 'すべてのドメイン' },
        ...Array.from(domainSet).sort().map((value) => ({
          value,
          label: value,
        })),
      ],
      statuses: [
        { value: '', label: 'すべての状態' },
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PROCESSING', label: 'PROCESSING' },
        { value: 'SUCCEEDED', label: 'SUCCEEDED' },
        { value: 'FAILED', label: 'FAILED' },
      ],
      summary: {
        total: rows.length,
        pending,
        processing,
        succeeded,
        failed,
      },
      message: 'import-jobs meta loaded',
    };
  }

  async listExportJobs() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.exportJob.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      ok: true,
      domain: 'export-jobs',
      action: 'list',
      items: rows.map((item) => this.mapExportJob(item)),
      total: rows.length,
      message: 'export-jobs loaded',
    };
  }

  async getExportMeta() {
    const companyId = await this.resolveCompanyId();

    const rows = await this.prisma.exportJob.findMany({
      where: { companyId },
      select: {
        domain: true,
        status: true,
        format: true,
      },
    });

    const domainSet = new Set<string>();
    const formatSet = new Set<string>();
    let pending = 0;
    let processing = 0;
    let succeeded = 0;
    let failed = 0;

    for (const row of rows) {
      if (row.domain) domainSet.add(row.domain);
      if (row.format) formatSet.add(row.format);

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING') pending += 1;
      else if (status === 'PROCESSING') processing += 1;
      else if (status === 'SUCCEEDED') succeeded += 1;
      else if (status === 'FAILED') failed += 1;
    }

    return {
      ok: true,
      domain: 'export-jobs',
      action: 'meta',
      domains: [
        { value: '', label: 'すべてのドメイン' },
        ...Array.from(domainSet).sort().map((value) => ({
          value,
          label: value,
        })),
      ],
      formats: [
        { value: '', label: 'すべての形式' },
        ...Array.from(formatSet).sort().map((value) => ({
          value,
          label: value.toUpperCase(),
        })),
      ],
      statuses: [
        { value: '', label: 'すべての状態' },
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PROCESSING', label: 'PROCESSING' },
        { value: 'SUCCEEDED', label: 'SUCCEEDED' },
        { value: 'FAILED', label: 'FAILED' },
      ],
      summary: {
        total: rows.length,
        pending,
        processing,
        succeeded,
        failed,
      },
      message: 'export-jobs meta loaded',
    };
  }

  createImportJob(payload: unknown) {
    return {
      ok: true,
      domain: 'import-jobs',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'import-jobs create stub',
    };
  }

  createExportJob(payload: unknown) {
    return {
      ok: true,
      domain: 'export-jobs',
      action: 'create',
      payload,
      mode: 'stub',
      message: 'export-jobs create stub',
    };
  }
}
