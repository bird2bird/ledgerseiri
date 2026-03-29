import { PrismaService } from '../prisma.service';

export type WorkspacePlanCode = 'STARTER' | 'STANDARD' | 'PREMIUM';

export type WorkspaceEffectiveLimits = {
  planCode: WorkspacePlanCode;
  maxStores: number;
  monthlyTransactions: number;
  invoiceStorageMb: number;
  aiChatMonthly: number;
  aiInvoiceOcrMonthly: number;
  historyMonths: number;
};

export async function readWorkspacePlanCode(
  prisma: PrismaService,
  companyId: string
): Promise<WorkspacePlanCode> {
  const row = await prisma.workspaceSubscription.findUnique({
    where: { companyId },
    select: { planCode: true },
  });

  const raw = String(row?.planCode ?? 'STARTER').trim().toUpperCase();

  if (raw === 'PREMIUM') return 'PREMIUM';
  if (raw === 'STANDARD') return 'STANDARD';
  return 'STARTER';
}

export function resolveWorkspaceLimits(planCode: WorkspacePlanCode): WorkspaceEffectiveLimits {
  if (planCode === 'PREMIUM') {
    return {
      planCode,
      maxStores: 10,
      monthlyTransactions: Number.MAX_SAFE_INTEGER,
      invoiceStorageMb: 5 * 1024,
      aiChatMonthly: 50,
      aiInvoiceOcrMonthly: 100,
      historyMonths: 24,
    };
  }

  if (planCode === 'STANDARD') {
    return {
      planCode,
      maxStores: 3,
      monthlyTransactions: 2000,
      invoiceStorageMb: 1024,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
      historyMonths: 24,
    };
  }

  return {
    planCode: 'STARTER',
    maxStores: 1,
    monthlyTransactions: 100,
    invoiceStorageMb: 200,
    aiChatMonthly: 0,
    aiInvoiceOcrMonthly: 0,
    historyMonths: 12,
  };
}

export async function readWorkspaceLimits(
  prisma: PrismaService,
  companyId: string
): Promise<WorkspaceEffectiveLimits> {
  const planCode = await readWorkspacePlanCode(prisma, companyId);
  return resolveWorkspaceLimits(planCode);
}
