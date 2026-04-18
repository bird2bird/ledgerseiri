import { Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RefreshService } from './refresh.service';
import { isAllowedRequestOrigin } from '../security/origin';

function assertSameOrigin(req: Request) {
  if (!isAllowedRequestOrigin(req)) throw new UnauthorizedException('BAD_ORIGIN');
}

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

function clearRefreshCookie(res: Response) {
  res.clearCookie('__Host-lsrt', { path: '/' });
}

function clearAccessCookie(res: Response) {
  res.clearCookie('access_token', { path: '/' });
}

@Controller('/auth')
export class RefreshController {
  constructor(private readonly refresh: RefreshService) {}

  @Post('/refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    assertSameOrigin(req);

    try {
      const rt = (req.cookies as any)?.['__Host-lsrt'];
      if (!rt) {
        clearRefreshCookie(res);
        clearAccessCookie(res);
        throw new UnauthorizedException('NO_REFRESH');
      }

      const payload = this.refresh.verifyRefreshToken(rt);
      await this.refresh.validateSessionOrReuse(payload.sub, payload.jti);

      const { newJti } = await this.refresh.rotateRefreshSession(payload.sub, payload.jti);

      const accessToken = this.refresh.createAccessToken(payload.sub);
      const newRefreshToken = this.refresh.createRefreshToken(payload.sub, newJti);

      setRefreshCookie(req, res, newRefreshToken);
      setAccessCookie(req, res, accessToken);

      return res.status(200).json({ accessToken });
    } catch (error) {
      clearRefreshCookie(res);
      clearAccessCookie(res);
      throw error;
    }
  }

  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    assertSameOrigin(req);

    const rt = (req.cookies as any)?.['__Host-lsrt'];
    if (rt) {
      try {
        const payload = this.refresh.verifyRefreshToken(rt);
        await this.refresh.revokeOne(payload.sub, payload.jti);
      } catch {
        // ignore token parse / revoke errors on logout
      }
    }

    clearRefreshCookie(res);
    clearAccessCookie(res);

    return res.status(200).json({ ok: true });
  }
}
