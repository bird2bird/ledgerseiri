import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RefreshService } from './refresh.service';

function isHttps(req: Request): boolean {
  const xf = (req.headers['x-forwarded-proto'] as string | undefined) || '';
  return (req as any).secure === true || xf.split(',')[0].trim() === 'https';
}

function setRefreshCookie(req: Request, res: Response, token: string) {
  res.cookie('__Host-lsrt', token, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
}

function setAccessCookie(req: Request, res: Response, token: string) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000,
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refresh: RefreshService,
  ) {}

  @Post('register')
  register(@Body() body: any) {
    return this.auth.register(body.email, body.password);
  }

  @Post('login')
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const identifier =
      (body as any).email ??
      (body as any).username ??
      (body as any).userName;

    if (!identifier || typeof identifier !== 'string') {
      throw new BadRequestException('EMAIL_REQUIRED');
    }

    const userId = await this.auth.validateUser(
      identifier,
      (body as any).password,
    );

    const { jti } = await this.refresh.issueRefreshSession(userId);
    const refreshToken = this.refresh.createRefreshToken(userId, jti);
    const accessToken = this.refresh.createAccessToken(userId);

    setRefreshCookie(req, res, refreshToken);
    setAccessCookie(req, res, accessToken);

    return res.status(201).json({ accessToken });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.userId);
  }
}
