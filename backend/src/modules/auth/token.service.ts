import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AuthTokens } from './auth.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generateTokenPair(
    userId: string,
    email: string,
    role: UserRole,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const jti = uuidv4();
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '15m');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role, type: 'access' },
        {
          secret: this.configService.get('jwt.accessSecret'),
          expiresIn: accessExpiresIn,
          jwtid: jti,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh', jti },
        {
          secret: this.configService.get('jwt.refreshSecret'),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    // Persist refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt, deviceInfo, ipAddress },
    });

    return { accessToken, refreshToken, expiresIn: 900 }; // 15 minutes in seconds
  }

  async refreshTokens(token: string, deviceInfo?: string): Promise<AuthTokens> {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const stored = await this.prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Rotate: revoke old token and issue new pair
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });

    return this.generateTokenPair(stored.user.id, stored.user.email ?? '', stored.user.role, deviceInfo);
  }

  async revokeToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { token }, data: { isRevoked: true } }).catch(() => null);
  }

  async revokeAllUserTokens(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { isRevoked: true } });
    }
  }

  async blacklistAccessToken(jti: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(`blacklist:${jti}`, '1', expiresInSeconds);
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    return this.redis.exists(`blacklist:${jti}`);
  }
}
