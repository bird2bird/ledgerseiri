import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Controller('api/auth')
export class PasswordResetController {
  constructor(private readonly svc: PasswordResetService) {}

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

  @Post('reset-password')
  async reset(@Body() body: any) {
    const token = body?.token;
    const newPassword = body?.password || body?.newPassword;
    return await this.svc.resetPassword(String(token || ''), String(newPassword || ''));
  }
}
