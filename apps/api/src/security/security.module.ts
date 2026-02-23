import { SessionSecurityApiController } from './session_api.controller';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessionSecurityController } from './session.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SessionSecurityController, SessionSecurityApiController],
})
export class SecurityModule {}
