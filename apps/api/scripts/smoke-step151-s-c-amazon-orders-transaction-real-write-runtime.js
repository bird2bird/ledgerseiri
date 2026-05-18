const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const marker = `step151-s-c-${Date.now()}`;
  const companyName = `Step151-S-C Company ${marker}`;
  const storeName = `Step151-S-C Amazon JP ${marker}`;
  const skuCode = `STEP151-S-C-SKU-${marker}`;
  const aliasSku = `STEP151-S-C-ALIAS-${marker}`;
  const normalizedAliasSku = aliasSku.replace(/\s+/g, '').toUpperCase();
  const amazonOrderId = `ORDER-${marker}`;
  const orderItemId = `ITEM-${marker}`;
  const dedupeHash = `step151-s-c-dedupe-${marker}`;
  const filename = `step151-s-c-amazon-orders-${marker}.json`;

  let companyId = null;
  let storeId = null;
  let productId = null;
  let productSkuId = null;
  let importJobId = null;
  const createdTransactionIds = [];

  try {
    const path = require('path');
    const fs = require('fs');

    const moduleCandidates = [
      path.resolve(__dirname, '../dist/imports/amazon-sp-api-orders-transaction-commit.service.js'),
      path.resolve(__dirname, '../dist/src/imports/amazon-sp-api-orders-transaction-commit.service.js'),
      path.resolve(__dirname, '../dist/apps/api/src/imports/amazon-sp-api-orders-transaction-commit.service.js'),
    ];

    const modulePath = moduleCandidates.find((candidate) => fs.existsSync(candidate));

    if (!modulePath) {
      throw new Error(
        `compiled transaction commit service not found. tried=${moduleCandidates.join(', ')}`,
      );
    }

    const mod = require(modulePath);

    if (typeof mod.commitAmazonSpApiOrdersIncomeTransactions !== 'function') {
      throw new Error(
        `commitAmazonSpApiOrdersIncomeTransactions export missing from compiled dist module=${modulePath}`,
      );
    }

    const beforeTransactionCount = await prisma.transaction.count();
    const beforeInventoryMovementCount = await prisma.inventoryMovement.count();

    const company = await prisma.company.create({
      data: {
        name: companyName,
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
      },
      select: { id: true },
    });
    companyId = company.id;

    const store = await prisma.store.create({
      data: {
        companyId,
        name: storeName,
        platform: 'AMAZON',
        region: 'JP',
      },
      select: { id: true },
    });
    storeId = store.id;

    const product = await prisma.product.create({
      data: {
        companyId,
        name: `Step151-S-C Product ${marker}`,
        brand: 'LedgerSeiriSmoke',
        category: 'runtime-smoke',
      },
      select: { id: true },
    });
    productId = product.id;

    const productSku = await prisma.productSku.create({
      data: {
        companyId,
        productId,
        storeId,
        skuCode,
        name: `Step151-S-C SKU ${marker}`,
        asin: `ASIN${String(Date.now()).slice(-8)}`,
        externalSku: aliasSku,
        fulfillmentChannel: 'FBA',
      },
      select: { id: true },
    });
    productSkuId = productSku.id;

    await prisma.productSkuAlias.create({
      data: {
        companyId,
        skuId: productSkuId,
        storeId,
        sourceType: 'AMAZON_ORDER_IMPORT',
        aliasSku,
        normalizedAliasSku,
        note: 'Step151-S-C runtime smoke alias',
      },
    });

    const importJob = await prisma.importJob.create({
      data: {
        companyId,
        domain: 'store-orders',
        module: 'store-orders',
        sourceType: 'amazon-sp-api-orders',
        filename,
        status: 'SUCCEEDED',
        totalRows: 1,
        successRows: 1,
        failedRows: 0,
        importedAt: new Date(),
      },
      select: { id: true },
    });
    importJobId = importJob.id;

    await prisma.importStagingRow.create({
      data: {
        importJobId,
        companyId,
        module: 'store-orders',
        rowNo: 1,
        businessMonth: '2026-05',
        rawPayloadJson: {
          marker,
          amazonOrderId,
          orderItemId,
          sellerSku: aliasSku,
          itemPriceAmount: 3210,
        },
        normalizedPayloadJson: {
          rowKind: 'order-item',
          stagingLevel: 'item',
          amazonOrderId,
          orderItemId,
          sellerSku: aliasSku,
          asin: `ASIN${String(Date.now()).slice(-8)}`,
          itemPriceAmount: 3210,
          quantityOrdered: 1,
          orderStatus: 'SHIPPED',
        },
        dedupeHash,
        matchStatus: 'PENDING_REVIEW',
        matchReason: 'STEP151_S_C_RUNTIME_SMOKE',
        targetEntityType: null,
        targetEntityId: null,
      },
    });

    const first = await mod.commitAmazonSpApiOrdersIncomeTransactions({
      prisma,
      companyId,
      importJobId,
      explicitOperatorConfirmation: true,
      finalReviewAccepted: true,
    });

    if (first.source !== 'amazon-sp-api-orders-transaction-commit') {
      throw new Error(`unexpected source: ${first.source}`);
    }
    if (first.createdTransactionRows !== 1) {
      throw new Error(`expected first commit to create 1 transaction, got ${first.createdTransactionRows}`);
    }
    if (first.skippedRows !== 0) {
      throw new Error(`expected first commit skippedRows=0, got ${first.skippedRows}`);
    }
    if (first.createsInventoryMovementNow !== false || first.inventoryWriteNow !== false) {
      throw new Error('Step151-S-C scope drift: inventory write flag changed');
    }
    if (first.createsExpenseTransactionNow !== false) {
      throw new Error('Step151-S-C scope drift: expense transaction flag changed');
    }
    if (first.settlementOrFeeImportNow !== false || first.bankReconciliationNow !== false) {
      throw new Error('Step151-S-C scope drift: settlement/bank flags changed');
    }

    createdTransactionIds.push(...first.created.map((row) => row.transactionId));

    const afterFirstTransactionCount = await prisma.transaction.count();
    const afterFirstInventoryMovementCount = await prisma.inventoryMovement.count();

    if (afterFirstTransactionCount !== beforeTransactionCount + 1) {
      throw new Error(
        `Transaction count mismatch after first commit: before=${beforeTransactionCount} after=${afterFirstTransactionCount}`,
      );
    }

    if (afterFirstInventoryMovementCount !== beforeInventoryMovementCount) {
      throw new Error(
        `InventoryMovement count changed unexpectedly: before=${beforeInventoryMovementCount} after=${afterFirstInventoryMovementCount}`,
      );
    }

    const createdTx = await prisma.transaction.findFirst({
      where: {
        companyId,
        dedupeHash,
      },
      select: {
        id: true,
        companyId: true,
        storeId: true,
        type: true,
        direction: true,
        sourceType: true,
        amount: true,
        currency: true,
        externalRef: true,
        importJobId: true,
        sourceRowNo: true,
        sourceFileName: true,
        businessMonth: true,
      },
    });

    if (!createdTx) {
      throw new Error('created Transaction not found by companyId + dedupeHash');
    }

    if (createdTx.type !== 'SALE') throw new Error(`unexpected type=${createdTx.type}`);
    if (createdTx.direction !== 'INCOME') throw new Error(`unexpected direction=${createdTx.direction}`);
    if (createdTx.sourceType !== 'STORE_ORDER') throw new Error(`unexpected sourceType=${createdTx.sourceType}`);
    if (createdTx.amount !== 3210) throw new Error(`unexpected amount=${createdTx.amount}`);
    if (createdTx.currency !== 'JPY') throw new Error(`unexpected currency=${createdTx.currency}`);
    if (createdTx.storeId !== storeId) throw new Error(`unexpected storeId=${createdTx.storeId}`);
    if (createdTx.importJobId !== importJobId) throw new Error(`unexpected importJobId=${createdTx.importJobId}`);
    if (createdTx.sourceRowNo !== 1) throw new Error(`unexpected sourceRowNo=${createdTx.sourceRowNo}`);
    if (createdTx.sourceFileName !== 'amazon-sp-api-orders') {
      throw new Error(`unexpected sourceFileName=${createdTx.sourceFileName}`);
    }

    let secondBlockedAsExpected = false;

    try {
      await mod.commitAmazonSpApiOrdersIncomeTransactions({
        prisma,
        companyId,
        importJobId,
        explicitOperatorConfirmation: true,
        finalReviewAccepted: true,
      });
    } catch (err) {
      const message = err && err.message ? String(err.message) : String(err);
      secondBlockedAsExpected =
        message.includes('STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_BLOCKED') ||
        message.includes('TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH');
      if (!secondBlockedAsExpected) {
        throw err;
      }
    }

    if (!secondBlockedAsExpected) {
      throw new Error('second commit did not block as duplicate');
    }

    const afterSecondTransactionCount = await prisma.transaction.count();
    const afterSecondInventoryMovementCount = await prisma.inventoryMovement.count();

    if (afterSecondTransactionCount !== afterFirstTransactionCount) {
      throw new Error(
        `duplicate guard failed: afterFirst=${afterFirstTransactionCount} afterSecond=${afterSecondTransactionCount}`,
      );
    }

    if (afterSecondInventoryMovementCount !== beforeInventoryMovementCount) {
      throw new Error(
        `InventoryMovement changed after duplicate attempt: before=${beforeInventoryMovementCount} afterSecond=${afterSecondInventoryMovementCount}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          step: 'Step151-S-C',
          importJobId,
          companyId,
          createdTransactionRows: first.createdTransactionRows,
          duplicateSecondCommitBlocked: true,
          transactionCountBefore: beforeTransactionCount,
          transactionCountAfterFirst: afterFirstTransactionCount,
          transactionCountAfterSecond: afterSecondTransactionCount,
          inventoryMovementCountBefore: beforeInventoryMovementCount,
          inventoryMovementCountAfterFirst: afterFirstInventoryMovementCount,
          inventoryMovementCountAfterSecond: afterSecondInventoryMovementCount,
          createdTransaction: createdTx,
        },
        null,
        2,
      ),
    );

    console.log('[OK] Step151-S-C transaction real-write runtime smoke passed.');
  } finally {
    /**
     * Cleanup fixture rows only.
     * Order matters because of relations.
     */
    if (companyId) {
      await prisma.transaction.deleteMany({
        where: {
          companyId,
          OR: [
            { dedupeHash },
            { id: { in: createdTransactionIds } },
          ],
        },
      });

      if (importJobId) {
        await prisma.importStagingRow.deleteMany({ where: { companyId, importJobId } });
        await prisma.importJob.deleteMany({ where: { companyId, id: importJobId } });
      }

      if (productSkuId) {
        await prisma.productSkuAlias.deleteMany({ where: { companyId, skuId: productSkuId } });
        await prisma.inventoryMovement.deleteMany({ where: { companyId, skuId: productSkuId } });
        await prisma.inventoryBalance.deleteMany({ where: { companyId, skuId: productSkuId } });
        await prisma.productSku.deleteMany({ where: { companyId, id: productSkuId } });
      }

      if (productId) {
        await prisma.product.deleteMany({ where: { companyId, id: productId } });
      }

      if (storeId) {
        await prisma.store.deleteMany({ where: { companyId, id: storeId } });
      }

      await prisma.company.deleteMany({ where: { id: companyId } });
    }

    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[NG] Step151-S-C transaction real-write runtime smoke failed.');
  console.error(err);
  process.exit(1);
});
