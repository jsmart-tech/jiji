import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { OtpService } from './otp.service';
import {
  RegisterEmailDto,
  RegisterPhoneDto,
  LoginEmailDto,
  LoginPhoneDto,
  RefreshTokenDto,
  VerifyOtpDto,
  SendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  OAuthLoginDto,
} from './dto';
import { AuthProvider, OtpPurpose } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Record<string, unknown>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
  ) {}

  // ─── Email Registration ───────────────────────────────────

  async registerWithEmail(dto: RegisterEmailDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const username = await this.generateUniqueUsername(dto.firstName, dto.lastName);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username,
      },
    });

    // Send email verification OTP
    await this.otpService.sendEmailOtp(dto.email, OtpPurpose.EMAIL_VERIFICATION);

    const tokens = await this.tokenService.generateTokenPair(user.id, user.email ?? '', user.role);
    return { user: this.usersService.sanitizeUser(user), tokens };
  }

  // ─── Phone Registration ───────────────────────────────────

  async registerWithPhone(dto: RegisterPhoneDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone already registered');

    await this.otpService.sendPhoneOtp(dto.phone, OtpPurpose.PHONE_VERIFICATION);
    // Store pending registration in Redis
    await this.otpService.storePendingRegistration(dto);
    return { message: 'OTP sent to your phone number' };
  }

  // ─── Email Login ─────────────────────────────────────────

  async loginWithEmail(dto: LoginEmailDto, deviceInfo?: string, ipAddress?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (user.isBanned) throw new UnauthorizedException(`Account banned: ${user.banReason}`);

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

    const tokens = await this.tokenService.generateTokenPair(user.id, user.email ?? '', user.role, deviceInfo, ipAddress);
    return { user: this.usersService.sanitizeUser(user), tokens };
  }

  // ─── Phone OTP Login ─────────────────────────────────────

  async sendLoginOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('Phone not registered');
    await this.otpService.sendPhoneOtp(dto.phone, OtpPurpose.PHONE_VERIFICATION);
    return { message: 'OTP sent' };
  }

  async loginWithPhone(dto: LoginPhoneDto, deviceInfo?: string, ipAddress?: string): Promise<AuthResponse> {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.otp, OtpPurpose.PHONE_VERIFICATION);
    if (!isValid) throw new UnauthorizedException('Invalid or expired OTP');

    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isBanned) throw new UnauthorizedException(`Account banned: ${user.banReason}`);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true, lastSeenAt: new Date() },
    });

    const tokens = await this.tokenService.generateTokenPair(user.id, user.email ?? '', user.role, deviceInfo, ipAddress);
    return { user: this.usersService.sanitizeUser(user), tokens };
  }

  // ─── OTP Verification ────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<{ verified: boolean; tokens?: AuthTokens }> {
    const isValid = await this.otpService.verifyOtp(dto.target, dto.code, dto.purpose as OtpPurpose);
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    if (dto.purpose === OtpPurpose.PHONE_VERIFICATION) {
      const user = await this.prisma.user.findUnique({ where: { phone: dto.target } });
      if (user) {
        await this.prisma.user.update({ where: { id: user.id }, data: { isPhoneVerified: true } });

        // Complete phone registration if pending
        const pending = await this.otpService.getPendingRegistration(dto.target);
        if (pending) {
          await this.otpService.clearPendingRegistration(dto.target);
          const tokens = await this.tokenService.generateTokenPair(user.id, user.email ?? '', user.role);
          return { verified: true, tokens };
        }
      }
    } else if (dto.purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await this.prisma.user.update({ where: { email: dto.target }, data: { isEmailVerified: true } });
    }

    return { verified: true };
  }

  // ─── OAuth ───────────────────────────────────────────────

  async oauthLogin(dto: OAuthLoginDto, deviceInfo?: string): Promise<AuthResponse> {
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: dto.provider as AuthProvider, providerId: dto.providerId } },
      include: { user: true },
    });

    if (!oauthAccount) {
      // Check if user exists by email
      let user = dto.email ? await this.prisma.user.findUnique({ where: { email: dto.email } }) : null;

      if (!user) {
        const username = await this.generateUniqueUsername(dto.firstName ?? 'User', dto.lastName ?? '');
        user = await this.prisma.user.create({
          data: {
            email: dto.email,
            firstName: dto.firstName ?? 'User',
            lastName: dto.lastName ?? '',
            username,
            avatarUrl: dto.avatarUrl,
            isEmailVerified: !!dto.email,
          },
        });
      }

      oauthAccount = await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: dto.provider as AuthProvider,
          providerId: dto.providerId,
          email: dto.email,
        },
        include: { user: true },
      });
    }

    const { user } = oauthAccount;
    if (user.isBanned) throw new UnauthorizedException(`Account banned: ${user.banReason}`);

    const tokens = await this.tokenService.generateTokenPair(user.id, user.email ?? '', user.role, deviceInfo);
    return { user: this.usersService.sanitizeUser(user), tokens };
  }

  // ─── Token Refresh ───────────────────────────────────────

  async refreshTokens(dto: RefreshTokenDto, deviceInfo?: string): Promise<AuthTokens> {
    return this.tokenService.refreshTokens(dto.refreshToken, deviceInfo);
  }

  // ─── Password Reset ──────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };
    await this.otpService.sendEmailOtp(dto.email, OtpPurpose.PASSWORD_RESET);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp, OtpPurpose.PASSWORD_RESET);
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { email: dto.email }, data: { passwordHash } });
    await this.tokenService.revokeAllUserTokens(dto.email);
    return { message: 'Password reset successfully' };
  }

  // ─── Logout ──────────────────────────────────────────────

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeToken(refreshToken);
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = base || 'user';
    let counter = 0;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      counter++;
      username = `${base}${counter}`;
    }
    return username;
  }
}
