const { PrismaClient } = require('@prisma/client');

function normalize(type, amount) {
  const abs = Math.abs(Number(amount || 0));
  if (type === 'SALE') return abs;
  if (type === 'FBA_FEE' || type === 'AD' || type === 'REFUND') return -abs;
  return Number(amount || 0);
}

async function main() {
  const prisma = new PrismaClient();
  const all = await prisma.transaction.findMany({
    select: { id: true, type: true, amount: true },
  });

  let changed = 0;
  for (const t of all) {
    const next = normalize(t.type, t.amount);
    if (next !== t.amount) {
      await prisma.transaction.update({
        where: { id: t.id },
        data: { amount: next },
      });
      changed++;
    }
  }

  console.log(`done. total=${all.length}, changed=${changed}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
