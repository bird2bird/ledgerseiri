import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PlanUpper = 'STARTER' | 'STANDARD' | 'PREMIUM';

/**
 * Change this value when needed:
 * 'STARTER' | 'STANDARD' | 'PREMIUM'
 */
const PLAN: PlanUpper = 'STANDARD';

function getLimits(plan: PlanUpper) {
  if (plan === 'PREMIUM') {
    return {
      maxStores: 10,
      invoiceStorageMb: 5 * 1024,
      aiChatMonthly: 50,
      aiInvoiceOcrMonthly: 100,
    };
  }

  if (plan === 'STANDARD') {
    return {
      maxStores: 3,
      invoiceStorageMb: 1024,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
    };
  }

  return {
    maxStores: 1,
    invoiceStorageMb: 200,
    aiChatMonthly: 0,
    aiInvoiceOcrMonthly: 0,
  };
}

async function main() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!company) {
    throw new Error('No company found. Please create a company first.');
  }

  const limits = getLimits(PLAN);

  const sub = await prisma.workspaceSubscription.upsert({
    where: {
      companyId: company.id,
    },
    update: {
      planCode: PLAN,
      status: 'ACTIVE',
      maxStores: limits.maxStores,
      invoiceStorageMb: limits.invoiceStorageMb,
      aiChatMonthly: limits.aiChatMonthly,
      aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
    },
    create: {
      companyId: company.id,
      planCode: PLAN,
      status: 'ACTIVE',
      maxStores: limits.maxStores,
      invoiceStorageMb: limits.invoiceStorageMb,
      aiChatMonthly: limits.aiChatMonthly,
      aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
    },
  });

  console.log('Seeded workspace subscription:');
  console.log(
    JSON.stringify(
      {
        companyId: company.id,
        companyName: company.name,
        subscription: sub,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
