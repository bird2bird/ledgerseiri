Step 32C Prisma migration
Name: 20260311_step32c_invoice_payment_alignment

Use cases:
1) Current production DB (already manually patched):
   npx prisma migrate resolve --applied 20260311_step32c_invoice_payment_alignment

2) New environment / fresh deployment:
   npx prisma migrate deploy

This migration aligns:
- InvoiceStatus enum
- Invoice.invoiceNumber -> invoiceNo
- Invoice total/subtotal/tax -> totalAmount
- PaymentReceipt.updatedAt removal
