import { Controller, Get, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { csrfTokenHandler } from './csrf';
import { JwtService } from '@nestjs/jwt';

function extractBearer(req: Request): string | null {
  const h = req.headers['authorization'];
  if (!h || Array.isArray(h)) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

@Controller('auth')
export class SessionSecurityController {
  constructor(private readonly jwt: JwtService) {}

  @Get('csrf')
  csrf(@Req() req: Request, @Res() res: Response) {
    return csrfTokenHandler(req, res);
  }

  /**
   * JWT-based session-me
   */
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

  /**
   * Logout clears CSRF session only
   */
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
}
