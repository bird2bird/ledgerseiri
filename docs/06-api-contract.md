# API Contract (NestJS)

本文档基于当前代码扫描结果（Controller decorators）生成，用于：
- 前后端对齐路由与职责边界
- 后续分模块开发避免“上下文丢失导致冲突”
- 为 API 网关（/api 前缀）、同域 cookie、CSRF 等机制提供索引

> 注意：此文档目前来自 `@Controller/@Get/@Post/...` 的静态扫描；  
> 参数校验、DTO、返回结构细节需要结合各 Controller 代码逐步补齐（下一步我们可以自动化提取）。

---

## 1. 基础约定（当前推断）

- API 服务：NestJS（apps/api）
- Web：Next.js（apps/web），同域反代（Nginx）
- 路由存在两种风格：
  1) 业务路由直接挂在根（如 `/transaction`、`/company`）
  2) API 前缀路由（如 `/api/auth/*`、`/api/*`）——通常用于给前端 fetch 的稳定入口

---

## 2. 路由总览（已确认的 decorator 级别路径）

### 2.1 Health

存在两个 health 路由定义（建议后续统一一个）：
- `GET /health`（apps/api/src/health.controller.ts）
- `GET /health`（apps/api/src/app.controller.ts）

> 风险：重复路由可能导致维护混乱（但通常不会影响运行；后注册的 handler 可能覆盖/并存，取决于 Nest 路由解析）。  
> 建议后续：保留 `HealthController` 一个即可。

---

### 2.2 Auth（会话/登录态）

#### A) 认证核心（/auth 前缀）

来自 `apps/api/src/auth/auth.controller.ts`：
- `POST /auth/register`
- `POST /auth/login`
- `GET  /auth/me`

用途（推断）：
- register/login：创建用户并建立登录态（cookie/session/jwt 具体以实现为准）
- me：返回当前用户信息（用于前端判断登录态）

#### B) Refresh / Logout（/auth 前缀）

来自 `apps/api/src/auth/refresh.controller.ts`：
- `POST /auth/refresh`
- `POST /auth/logout`

用途（推断）：
- refresh：刷新 access/session（配合 RefreshSession 表做 rotation）
- logout：注销会话（可能同时清 cookie + revoke refresh session）

#### C) CSRF + Session utilities（/auth 前缀）

来自 `apps/api/src/security/session.controller.ts`：
- `GET  /auth/csrf`
- `GET  /auth/session-me`
- `POST /auth/session-logout`

用途（推断）：
- csrf：获取 CSRF token（前端写入 header / cookie）
- session-me：返回 session 维度的登录态信息
- session-logout：按 session 机制注销

> 备注：这里同时存在 `/auth/logout` 与 `/auth/session-logout`，建议后续统一命名与职责（否则前端容易混用）。

---

### 2.3 Password Reset（/api/auth 前缀）

来自 `apps/api/src/auth/password-reset.controller.ts`：
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

用途：
- forgot-password：发起重置（创建 PasswordResetToken）
- reset-password：使用 token 完成改密

---

## 3. 业务域路由（Company/Store/Transaction/Dashboard）

这些 controller 的 `@Controller()` 为空，意味着“挂在根路径”。

### 3.1 Company

来自 `apps/api/src/company/company.controller.ts`：
- `POST /company`
- `GET  /company`

用途（推断）：
- 创建公司、查询公司信息（当前用户所属 company）

### 3.2 Store

来自 `apps/api/src/store/store.controller.ts`：
- `GET  /store`
- `POST /store`

用途（推断）：
- 列表/创建店铺（属于 Company）

### 3.3 Transaction

来自 `apps/api/src/transaction/transaction.controller.ts`：
- `POST   /transaction`
- `GET    /transaction`
- `DELETE /transaction/:id`
- `POST   /transaction/bulk`

用途（推断）：
- 单条 CRUD + 批量导入

### 3.4 Dashboard

来自 `apps/api/src/dashboard/dashboard.controller.ts`：
- `GET /dashboard`

用途（推断）：
- 返回 dashboard 聚合数据（按时间窗口、按 store/company 聚合）

---

## 4. “API 前缀”控制器占位（需要下一步读取代码补齐）

扫描到以下 controller 只有 `@Controller(...)`，未在 decorator 扫描中出现 method（可能 method 写在 .ts 但未匹配，或仅作为中转层/网关层）：

- `apps/api/src/dashboard/dashboard_api.controller.ts`：`@Controller('api')`
- `apps/api/src/transaction/transaction_api.controller.ts`：`@Controller('api')`
- `apps/api/src/store/store_api.controller.ts`：`@Controller('api')`
- `apps/api/src/company/company_api.controller.ts`：`@Controller('api')`

以及：
- `apps/api/src/auth/auth_api.controller.ts`：`@Controller('api/auth')`
- `apps/api/src/auth/refresh_api.controller.ts`：`@Controller('/api/auth')`
- `apps/api/src/security/session_api.controller.ts`：`@Controller('/api/auth')`

推断：
- 这些 `*_api.controller.ts` 可能用于提供 `/api/...` 形式的同域接口（给 Next.js fetch 更方便）
- 需要下一步对这些文件做一次 `sed -n` / grep method 扫描，补齐具体 endpoint 与返回结构

---

## 5. 下一步（我建议你立刻做的 2 个动作）

### 5.1 再做一次“更精确的路由提取”
目前只抓到了装饰器行。下一步我们用 grep 直接把每个 controller 的方法块提取出来，补齐：
- request body / query params
- response shape（JSON schema）
- auth 保护（是否需要登录态）

我会给你一个“只读脚本”，自动生成更完整的 contract。

### 5.2 固化“唯一入口策略”
建议最终对外只保留一种风格，例如：
- 对外统一：`/api/*`
- 内部/兼容：根路径保留但标记 Deprecated（并在 Nginx 层逐步迁移）

这样前端不会混用 `/auth/*` 与 `/api/auth/*` 造成不可控 bug。
