# API Methods (Extracted)

Generated from: /opt/ledgerseiri/apps/api/src
Generated at: 2026-02-23T20:35:43+08:00

## apps/api/src/app.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller, Get } from '@nestjs/common';
```

### Controller Declaration
```ts
@Controller()
export class AppController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Get('health')
  health() {
    return { ok: true };
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
7:    return { ok: true };
```

## apps/api/src/auth/auth_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { AuthController } from './auth.controller';
```

### Controller Declaration
```ts
@Controller('api/auth')
export class AuthApiController extends AuthController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/auth/auth.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RefreshService } from './refresh.service';
```

### Controller Declaration
```ts
@Controller('auth')
export class AuthController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Post('register')
  register(@Body() body: any) {
    return this.auth.register(body.email, body.password);
  }
// ----


// ----
  @Post('login')
  async login(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const identifier = (body as any).email ?? (body as any).username ?? (body as any).userName;
    if (!identifier || typeof identifier !== "string") {
      throw new BadRequestException("EMAIL_REQUIRED");
    }
    const userId = await this.auth.validateUser(identifier, (body as any).password);
const { jti } = await this.refresh.issueRefreshSession(userId);
    const refreshToken = this.refresh.createRefreshToken(userId, jti);
    const accessToken = this.refresh.createAccessToken(userId);

    setRefreshCookie(req, res, refreshToken);
    return res.status(201).json({ accessToken });
  }
// ----


// ----
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.userId);
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
3:import type { Request, Response } from 'express';
10:  return (req as any).secure === true || xf.split(',')[0].trim() === 'https';
13:function setRefreshCookie(req: Request, res: Response, token: string) {
33:  register(@Body() body: any) {
34:    return this.auth.register(body.email, body.password);
38:  async login(@Body() body: any, @Req() req: Request, @Res() res: Response) {
49:    return res.status(201).json({ accessToken });
54:  me(@Req() req: any) {
55:    return this.auth.me(req.user.userId);
```

## apps/api/src/auth/password-reset.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
```

### Controller Declaration
```ts
@Controller('api/auth')
export class PasswordResetController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Post('forgot-password')
  async forgot(
    @Body() body: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const email = body?.email || body?.username || body?.userName;
    // Always return ok to avoid leaking whether the email exists.
    await this.svc.requestReset(String(email || ''), { ip, ua });
    return { ok: true, message: 'If the email exists, you will receive a reset link.' };
  }
// ----


// ----
  @Post('reset-password')
  async reset(@Body() body: any) {
    const token = body?.token;
    const newPassword = body?.password || body?.newPassword;
    return await this.svc.resetPassword(String(token || ''), String(newPassword || ''));
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
10:    @Body() body: any,
15:    // Always return ok to avoid leaking whether the email exists.
17:    return { ok: true, message: 'If the email exists, you will receive a reset link.' };
21:  async reset(@Body() body: any) {
24:    return await this.svc.resetPassword(String(token || ''), String(newPassword || ''));
```

## apps/api/src/auth/refresh_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { RefreshController } from './refresh.controller';
```

### Controller Declaration
```ts
@Controller('/api/auth')
export class RefreshApiController extends RefreshController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/auth/refresh.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RefreshService } from './refresh.service';
import { isAllowedRequestOrigin } from '../security/origin';
```

### Controller Declaration
```ts
@Controller('/auth')
export class RefreshController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Post('/refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    assertSameOrigin(req);

    const rt = (req.cookies as any)?.['__Host-lsrt'];
    if (!rt) throw new UnauthorizedException('NO_REFRESH');

    const payload = this.refresh.verifyRefreshToken(rt);
    await this.refresh.validateSessionOrReuse(payload.sub, payload.jti);

    const { newJti } = await this.refresh.rotateRefreshSession(payload.sub, payload.jti);

    const accessToken = this.refresh.createAccessToken(payload.sub);
    const newRefreshToken = this.refresh.createRefreshToken(payload.sub, newJti);

    setRefreshCookie(req, res, newRefreshToken);
    return res.status(200).json({ accessToken });
  }
// ----


// ----
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    assertSameOrigin(req);

    const rt = (req.cookies as any)?.['__Host-lsrt'];
    if (rt) {
      const payload = this.refresh.verifyRefreshToken(rt);
      await this.refresh.revokeOne(payload.sub, payload.jti).catch(() => void 0);
    }
    clearRefreshCookie(res);
    return res.status(200).json({ ok: true });
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
2:import type { Request, Response } from 'express';
12:  return (req as any).secure === true || xf.split(',')[0].trim() === 'https';
15:function setRefreshCookie(req: Request, res: Response, token: string) {
28:function clearRefreshCookie(res: Response) {
37:  async refreshToken(@Req() req: Request, @Res() res: Response) {
52:    return res.status(200).json({ accessToken });
56:  async logout(@Req() req: Request, @Res() res: Response) {
65:    return res.status(200).json({ ok: true });
```

## apps/api/src/company/company_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { CompanyController } from './company.controller';
```

### Controller Declaration
```ts
@Controller('api')
export class CompanyApiController extends CompanyController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/company/company.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
```

### Controller Declaration
```ts
@Controller()
export class CompanyController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Post('company')
  async createCompany(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const company = await this.prisma.company.create({
      data: {
        name: body.name || 'My Company',
        fiscalMonthStart: Number(body.fiscalMonthStart) || 1,
        timezone: body.timezone || 'Asia/Tokyo',
        currency: body.currency || 'JPY',
        users: { connect: { id: userId } },
      },
    });

    // 把 user.companyId 关联起来（显式）
    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return company;
  }
// ----


// ----
  @Get('company')
  async getMyCompany(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return { company: null, stores: [] };

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    const stores = await this.prisma.store.findMany({ where: { companyId: user.companyId } });
    return { company, stores };
  }}
// ----

```

### DTO/Request/Response Hints (grep)
```txt
11:  async createCompany(@Req() req: any, @Body() body: any) {
29:    return company;
34:  async getMyCompany(@Req() req: any) {
37:    if (!user?.companyId) return { company: null, stores: [] };
41:    return { company, stores };
```

## apps/api/src/dashboard/dashboard_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
```

### Controller Declaration
```ts
@Controller('api')
export class DashboardApiController extends DashboardController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/dashboard/dashboard.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
```

### Controller Declaration
```ts
@Controller()
export class DashboardController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Get('dashboard')
  async monthly(@Req() req: any, @Query('storeId') storeId?: string, @Query('month') month?: string) {
    if (!storeId) return { error: 'storeId is required' };
    if (!month) return { error: 'month is required, e.g. 2026-02' };

    const store = await this.assertStoreOwned(req, storeId);
    if (!store) return { error: 'Store not found or not owned' };

    const { start, end } = monthRange(month);

    // group by type (display)
    const rows = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { storeId, occurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const sumByType: Record<string, number> = {};
    let count = 0;
    for (const r of rows as any[]) {
      sumByType[r.type] = Number(r._sum?.amount ?? 0);
      count += Number(r._count?._all ?? 0);
    }

    const sales = sumByType['SALE'] ?? 0;
    const fbaFees = sumByType['FBA_FEE'] ?? 0;
    const ads = sumByType['AD'] ?? 0;
    const refunds = sumByType['REFUND'] ?? 0;
    const other = sumByType['OTHER'] ?? 0;

    // single source of truth: monthNet = SUM(amount)
    const total = await this.prisma.transaction.aggregate({
      where: { storeId, occurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    const monthNet = Number(total._sum.amount ?? 0);

    // profit equals monthNet (strict)
    const profit = monthNet;

    return {
      storeId,
      month,
      sales,
      fbaFees,
      ads,
      refunds,
      other,
      profit,
      monthNet,
      count,
    };
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
9:  return { start, end };
20:    if (!user?.companyId) return null;
22:    return this.prisma.store.findFirst({
28:  async monthly(@Req() req: any, @Query('storeId') storeId?: string, @Query('month') month?: string) {
29:    if (!storeId) return { error: 'storeId is required' };
30:    if (!month) return { error: 'month is required, e.g. 2026-02' };
33:    if (!store) return { error: 'Store not found or not owned' };
68:    return {
```

## apps/api/src/health.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller, Get } from '@nestjs/common';
```

### Controller Declaration
```ts
@Controller()
export class HealthController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Get('health')
  health() {
    return { ok: true, service: 'api', ts: Date.now() };
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
7:    return { ok: true, service: 'api', ts: Date.now() };
```

## apps/api/src/security/session_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { SessionSecurityController } from './session.controller';
```

### Controller Declaration
```ts
@Controller('/api/auth')
export class SessionSecurityApiController extends SessionSecurityController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/security/session.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller, Get, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { csrfTokenHandler } from './csrf';
import { JwtService } from '@nestjs/jwt';
```

### Controller Declaration
```ts
@Controller('auth')
export class SessionSecurityController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Get('csrf')
  csrf(@Req() req: Request, @Res() res: Response) {
    return csrfTokenHandler(req, res);
  }
// ----


// ----
  @Get('session-me')
  sessionMe(@Req() req: Request, @Res() res: Response) {
    try {
      const token = extractBearer(req);
      if (!token) return res.status(401).json({ message: 'UNAUTHORIZED' });

      const payload: any = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!payload?.sub) {
        return res.status(401).json({ message: 'UNAUTHORIZED' });
      }

      return res.json({ ok: true, userId: payload.sub });
    } catch {
      return res.status(401).json({ message: 'UNAUTHORIZED' });
    }
  }
// ----


// ----
  @Post('session-logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res() res: Response) {
    const sess: any = (req as any).session;
    if (!sess) return res.json({ ok: true });

    sess.destroy(() => {
      res.clearCookie('lsid', { path: '/' });
      return res.json({ ok: true });
    });
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
2:import type { Request, Response } from 'express';
8:  if (!h || Array.isArray(h)) return null;
10:  return m ? m[1] : null;
18:  csrf(@Req() req: Request, @Res() res: Response) {
19:    return csrfTokenHandler(req, res);
26:  sessionMe(@Req() req: Request, @Res() res: Response) {
29:      if (!token) return res.status(401).json({ message: 'UNAUTHORIZED' });
36:        return res.status(401).json({ message: 'UNAUTHORIZED' });
39:      return res.json({ ok: true, userId: payload.sub });
41:      return res.status(401).json({ message: 'UNAUTHORIZED' });
50:  logout(@Req() req: Request, @Res() res: Response) {
52:    if (!sess) return res.json({ ok: true });
56:      return res.json({ ok: true });
```

## apps/api/src/store/store_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { StoreController } from './store.controller';
```

### Controller Declaration
```ts
@Controller('api')
export class StoreApiController extends StoreController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/store/store.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
```

### Controller Declaration
```ts
@Controller()
export class StoreController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Get('store')
  async listStores(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return { stores: [] };

    const stores = await this.prisma.store.findMany({
      where: { companyId: user.companyId },
    });

    return { stores };
  }
// ----


// ----
  @Post('store')
  async createStore(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) {
      return { error: 'No company yet. Create company first.' };
    }

    const store = await this.prisma.store.create({
      data: {
        companyId: user.companyId,
        name: body.name || 'Amazon JP Store',
        platform: body.platform || 'AMAZON',
        region: body.region || 'JP',
      },
    });

    return store;
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
12:  async listStores(@Req() req: any) {
15:    if (!user?.companyId) return { stores: [] };
21:    return { stores };
26:  async createStore(@Req() req: any, @Body() body: any) {
30:      return { error: 'No company yet. Create company first.' };
42:    return store;
```

## apps/api/src/transaction/transaction_api.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Controller } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
```

### Controller Declaration
```ts
@Controller('api')
export class TransactionApiController extends TransactionController {}
```

### Route Methods (decorators + method block)
```ts
```

### DTO/Request/Response Hints (grep)
```txt
```

## apps/api/src/transaction/transaction.controller.ts

### Imports (hint for DTO/Types)
```ts
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
```

### Controller Declaration
```ts
@Controller()
export class TransactionController {
```

### Route Methods (decorators + method block)
```ts

// ----
  @Post('transaction')
  async create(@Req() req: any, @Body() body: any) {
    const storeId = body?.storeId;
    if (!storeId) return { error: 'storeId is required' };

    const store = await this.assertStoreOwned(req, storeId);
    if (!store) return { error: 'Store not found or not owned' };

    const type: TxType = assertType(body?.type);
    const amount = normalizeAmount(type, body?.amount);
    const occurredAt = parseOccurredAt(body?.occurredAt);
    const memo = body?.memo ?? null;

        // ===== amount sign normalization (DB is source of truth) =====
    const normalizedAmount = normalizeSignedAmount(type, amount);

    const tx = await this.prisma.transaction.create({
      data: {
        storeId,
        type,
      amount,
        occurredAt,
        memo,
      } as any,
    });

    return tx;
  }
// ----


// ----
  @Get('transaction')
  async list(@Req() req: any, @Query('storeId') storeId?: string, @Query('month') month?: string) {
    if (!storeId) return { error: 'storeId is required' };
    if (!month) return { error: 'month is required, e.g. 2026-02' };

    const store = await this.assertStoreOwned(req, storeId);
    if (!store) return { error: 'Store not found or not owned' };

    const { start, end } = monthRange(month);

    const where: any = { storeId, occurredAt: { gte: start, lt: end } };

    const items = await this.prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: 'desc' as any },
      take: 500,
    });

    return { items };
  }
// ----


// ----
  @Delete('transaction/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx) return { ok: true };

    const store = await this.assertStoreOwned(req, tx.storeId);
    if (!store) return { error: 'Store not found or not owned' };

    await this.prisma.transaction.delete({ where: { id } });
    return { ok: true };
  }
// ----


// ----
  @Post('transaction/bulk')
  async bulkCreate(@Req() req: any, @Body() body: any) {
    const storeId = body?.storeId;
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!storeId) return { ok: false, message: 'storeId is required' };

    const store = await this.assertStoreOwned(req, storeId);
    if (!store) return { ok: false, message: 'Store not found or not owned' };

    if (!items.length) return { ok: false, message: 'items is empty' };
    if (items.length > 5000) return { ok: false, message: 'items too large (max 5000)' };

    const normalized = items.map((it: any) => {
      const type: TxType = assertType(it?.type);
      const amount = normalizeAmount(type, it?.amount);
      const occurredAt = parseOccurredAt(it?.occurredAt);
      return {
        storeId,
        type,
        amount,
        occurredAt,
        memo: it?.memo ?? null,
      };
    });

    const result = await this.prisma.transaction.createMany({
      data: normalized as any,
    });

    return { ok: true, created: result.count };
  }
// ----

```

### DTO/Request/Response Hints (grep)
```txt
9:  if (type === 'SALE') return abs;
10:  if (type === 'FBA_FEE' || type === 'AD' || type === 'REFUND') return -abs;
11:  return Number(amount || 0);
21:  return { start, end };
26:  if (v === 'SALE' || v === 'FBA_FEE' || v === 'AD' || v === 'REFUND' || v === 'OTHER') return v;
27:  return 'OTHER';
34:  if (type === 'SALE') return abs;
35:  if (type === 'FBA_FEE' || type === 'AD' || type === 'REFUND') return -abs;
36:  return Number.isFinite(n) ? n : 0;
42:  return d;
53:    if (!user?.companyId) return null;
55:    return this.prisma.store.findFirst({
62:  async create(@Req() req: any, @Body() body: any) {
64:    if (!storeId) return { error: 'storeId is required' };
67:    if (!store) return { error: 'Store not found or not owned' };
87:    return tx;
92:  async list(@Req() req: any, @Query('storeId') storeId?: string, @Query('month') month?: string) {
93:    if (!storeId) return { error: 'storeId is required' };
94:    if (!month) return { error: 'month is required, e.g. 2026-02' };
97:    if (!store) return { error: 'Store not found or not owned' };
109:    return { items };
114:  async remove(@Req() req: any, @Param('id') id: string) {
116:    if (!tx) return { ok: true };
119:    if (!store) return { error: 'Store not found or not owned' };
122:    return { ok: true };
127:  async bulkCreate(@Req() req: any, @Body() body: any) {
131:    if (!storeId) return { ok: false, message: 'storeId is required' };
134:    if (!store) return { ok: false, message: 'Store not found or not owned' };
136:    if (!items.length) return { ok: false, message: 'items is empty' };
137:    if (items.length > 5000) return { ok: false, message: 'items too large (max 5000)' };
143:      return {
156:    return { ok: true, created: result.count };
```

----
End of extracted methods.
