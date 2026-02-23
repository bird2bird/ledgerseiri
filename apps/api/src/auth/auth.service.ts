import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RefreshService } from './refresh.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private refresh: RefreshService) {}

  async register(email: string, password: string) {
    if (!email || !password) throw new BadRequestException('email and password required');
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('email already registered');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hash },
      select: { id: true, email: true, companyId: true, createdAt: true },
    });
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('invalid credentials');

    const token = await this.jwt.signAsync({ sub: user.id });
    return { accessToken: token };
  }

  async loginWithRefresh(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("invalid credentials");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException("invalid credentials");

    const accessToken = await this.jwt.signAsync({ sub: user.id });

    const { jti } = await this.refresh.issueRefreshSession(user.id);
    const refreshToken = this.refresh.createRefreshToken(user.id, jti);

    return { accessToken, refreshToken };
  } 

  async validateUser(email: string, password: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("invalid credentials");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException("invalid credentials");

    return user.id;
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, companyId: true, createdAt: true },
    });
  }
}
