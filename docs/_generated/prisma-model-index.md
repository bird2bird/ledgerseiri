# Prisma Model Index

Source: apps/api/prisma/schema.prisma
Generated at: 2026-02-23T20:35:54+08:00



## model User

-   id        String   @id @default(cuid())
-   email     String   @unique
-   password  String
-   companyId String?
-   company   Company? @relation(fields: [companyId], references: [id])
-   createdAt DateTime @default(now())
-   refreshSessions RefreshSession[]
-   passwordResetTokens PasswordResetToken[]

## model Company

-   id              String   @id @default(cuid())
-   name            String
-   fiscalMonthStart Int     @default(1)
-   timezone        String   @default("Asia/Tokyo")
-   currency        String   @default("JPY")
-   users           User[]
-   stores          Store[]
-   createdAt       DateTime @default(now())

## model Store

-   id        String   @id @default(cuid())
-   companyId String
-   company   Company  @relation(fields: [companyId], references: [id])
-   name      String
-   platform  String   @default("AMAZON")
-   region    String   @default("JP")
-   createdAt DateTime @default(now())
-   transactions Transaction[]

## enum TransactionType

- SALE
- FBA_FEE
- AD
- REFUND
- OTHER

## model Transaction

-   id         String           @id @default(cuid())
-   storeId    String
-   store      Store            @relation(fields: [storeId], references: [id])
-   type       TransactionType
-   amount     Int
-   currency   String           @default("JPY")
-   occurredAt DateTime
-   memo       String?
-   createdAt  DateTime         @default(now())

## model RefreshSession

-   id            String   @id @default(cuid())
-   userId        String
-   jti           String   @unique
-   createdAt     DateTime @default(now())
-   expiresAt     DateTime
-   revokedAt     DateTime?
-   replacedByJti String?
-   user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

## model PgSession

-   sid    String   @id @db.VarChar
-   sess   Json @db.Json
-   expire DateTime @db.Timestamp(6)

## model PasswordResetToken

-   id         String   @id @default(cuid())
-   userId     String
-   tokenHash  String   @unique
-   createdAt  DateTime @default(now())
-   expiresAt  DateTime
-   usedAt     DateTime?
-   user User @relation(fields: [userId], references: [id], onDelete: Cascade)

