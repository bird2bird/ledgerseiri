# Database Schema (Prisma / PostgreSQL)

本文档基于 `apps/api/prisma/schema.prisma`（当前仓库版本）生成，用于：
- 统一理解当前数据模型
- 作为后续模块拆分/迭代的“单一事实来源（SSOT）”
- 为 API Contract / Dashboard 指标口径提供数据基础

---

## 1. 数据源与约定

- ORM: Prisma
- DB: PostgreSQL
- `datasource.url`: `env("DATABASE_URL")`
- 货币金额：当前 `Transaction.amount` 使用 **Int（JPY 无小数）**
- 时区：Company 默认 `Asia/Tokyo`

---

## 2. ER 关系概览（文字版）

- Company 1 ── * User
- Company 1 ── * Store
- Store   1 ── * Transaction
- User    1 ── * RefreshSession
- User    1 ── * PasswordResetToken
- PgSession：用于 `connect-pg-simple` 的 session 表（Prisma 仅“保留映射”，避免被 db push 删除）

---

## 3. 模型明细

### 3.1 User

字段：
- `id: String` (PK, cuid)
- `email: String` (Unique)
- `password: String`（已哈希存储，算法以 AuthService 实现为准）
- `companyId: String?`（可为空，表示用户尚未绑定公司/租户）
- `createdAt: DateTime`（default now）

关系：
- `company: Company?`  (User.companyId -> Company.id)
- `refreshSessions: RefreshSession[]`
- `passwordResetTokens: PasswordResetToken[]`

设计含义：
- 这是当前系统的“登录主体”
- Company 是租户边界（后续 RBAC / 多公司切换将围绕此扩展）

---

### 3.2 Company

字段：
- `id: String` (PK, cuid)
- `name: String`
- `fiscalMonthStart: Int`（default 1）
- `timezone: String`（default "Asia/Tokyo"）
- `currency: String`（default "JPY"）
- `createdAt: DateTime`（default now）

关系：
- `users: User[]`
- `stores: Store[]`

设计含义：
- Company 是租户单位，Store / Transaction 都必须可追溯到 Company

---

### 3.3 Store

字段：
- `id: String` (PK, cuid)
- `companyId: String`（FK）
- `name: String`
- `platform: String`（default "AMAZON"）
- `region: String`（default "JP"）
- `createdAt: DateTime`

关系：
- `company: Company` (Store.companyId -> Company.id)
- `transactions: Transaction[]`

设计含义：
- 一个 Company 可关联多个 Store（多店铺、多平台预留）
- platform/region 当前以字符串保存（后续可枚举化）

---

### 3.4 TransactionType (enum)

枚举：
- `SALE`
- `FBA_FEE`
- `AD`
- `REFUND`
- `OTHER`

设计含义：
- Dashboard 聚合指标会按 type 分类
- 后续可扩展：`COGS`、`SHIPPING`、`TAX` 等

---

### 3.5 Transaction

字段：
- `id: String` (PK, cuid)
- `storeId: String`（FK）
- `type: TransactionType`
- `amount: Int`（JPY integer, no decimals）
- `currency: String`（default "JPY"）
- `occurredAt: DateTime`
- `memo: String?`
- `createdAt: DateTime`（default now）

索引：
- `@@index([storeId, occurredAt])`（用于按店铺+时间范围查询）
- `@@index([type])`（用于按类型过滤/聚合）

设计含义：
- 这是核心流水表（将来可引入 sourceType/sourceId 支撑对账与导入）

---

### 3.6 RefreshSession

字段：
- `id: String` (PK, cuid)
- `userId: String`（FK）
- `jti: String`（Unique）
- `createdAt: DateTime`
- `expiresAt: DateTime`
- `revokedAt: DateTime?`
- `replacedByJti: String?`

关系：
- `user: User` (onDelete: Cascade)

索引：
- `@@index([userId])`
- `@@index([expiresAt])`

设计含义：
- 用于 Refresh Token rotation / 复用检测（replay/reuse detection）
- `replacedByJti` 用于追踪 token 链路

---

### 3.7 PgSession（@@map("session")）

字段：
- `sid: String` (PK, VarChar)
- `sess: Json` (Json)
- `expire: DateTime` (Timestamp(6))

索引：
- `@@index([expire], map: "IDX_session_expire")`

设计含义：
- 这是 `connect-pg-simple` 的 session 表映射
- 注释已说明：**不要让 Prisma db push 删除它**

---

### 3.8 PasswordResetToken

字段：
- `id: String` (PK, cuid)
- `userId: String`（FK）
- `tokenHash: String`（Unique）
- `createdAt: DateTime`
- `expiresAt: DateTime`
- `usedAt: DateTime?`

关系：
- `user: User` (onDelete: Cascade)

索引：
- `@@index([userId])`
- `@@index([expiresAt])`

设计含义：
- 密码重置采用 tokenHash（不存明文 token）
- usedAt 支撑一次性使用

---

## 4. 已知待补充（建议后续补齐）

为了让文档成为长期 SSOT，建议后续补齐：
- 各字段的业务含义（例如 Transaction.amount 的正负号规则）
- 多币种策略（amount 与 currency 的一致性校验）
- Store 平台枚举化/约束（避免脏数据）
- Company/User 的权限模型（Owner/Admin/Member）


## Workspace Subscription (Draft)

### Enums

- `PlanCode`
  - `STARTER`
  - `STANDARD`
  - `PREMIUM`

- `SubscriptionStatus`
  - `ACTIVE`
  - `TRIALING`
  - `PAST_DUE`
  - `CANCELED`

### Model: `WorkspaceSubscription`

Purpose:
- store the current paid plan for one company/workspace
- provide limits and entitlement source-of-truth for frontend gating

Fields:
- `id: String @id`
- `companyId: String @unique`
- `planCode: PlanCode`
- `status: SubscriptionStatus`
- `currentPeriodEnd: DateTime?`
- `maxStores: Int`
- `invoiceStorageMb: Int`
- `aiChatMonthly: Int`
- `aiInvoiceOcrMonthly: Int`
- `createdAt: DateTime`
- `updatedAt: DateTime`

Relation:
- one `Company` has zero or one `WorkspaceSubscription`

Initial rollout note:
- V1 keeps plan limits in DB as explicit columns for simplicity.
- entitlements are derived in application layer from `planCode`.
- future Stripe integration may add provider fields such as:
  - `provider`
  - `providerCustomerId`
  - `providerSubscriptionId`
