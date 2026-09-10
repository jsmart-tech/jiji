import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { OtpPurpose } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendPhoneOtp(phone: string, purpose: OtpPurpose): Promise<void> {
    const code = this.generateOtp();
    const expiryMinutes = this.configService.get<number>('jwt.otpExpiryMinutes', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: { target: phone, code, purpose, expiresAt },
    });

    // In development, log the OTP; in production, send via Twilio
    if (this.configService.get('app.nodeEnv') === 'development') {
      this.logger.debug(`📱 OTP for ${phone}: ${code}`);
    } else {
      await this.sendSms(phone, `Your Jsmart verification code is: ${code}. Valid for ${expiryMinutes} minutes.`);
    }
  }

  async sendEmailOtp(email: string, purpose: OtpPurpose): Promise<void> {
    const code = this.generateOtp();
    const expiryMinutes = this.configService.get<number>('jwt.otpExpiryMinutes', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: { target: email, code, purpose, expiresAt },
    });

    if (this.configService.get('app.nodeEnv') === 'development') {
      this.logger.debug(`📧 OTP for ${email}: ${code}`);
    } else {
      // TODO: Integrate SendGrid email service
      this.logger.log(`Email OTP would be sent to ${email}`);
    }
  }

  async verifyOtp(target: string, code: string, purpose: OtpPurpose): Promise<boolean> {
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        target,
        purpose,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    if (otp.attempts >= this.MAX_ATTEMPTS) {
      throw new BadRequestException('Too many OTP attempts. Please request a new code.');
    }

    if (otp.code !== code) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    await this.prisma.otpVerification.update({ where: { id: otp.id }, data: { isUsed: true } });
    return true;
  }

  async storePendingRegistration(data: Record<string, unknown>): Promise<void> {
    const key = `pending_reg:${data['phone']}`;
    await this.redis.set(key, data, 600); // 10 min TTL
  }

  async getPendingRegistration(phone: string): Promise<Record<string, unknown> | null> {
    return this.redis.get<Record<string, unknown>>(`pending_reg:${phone}`);
  }

  async clearPendingRegistration(phone: string): Promise<void> {
    await this.redis.del(`pending_reg:${phone}`);
  }

  private async sendSms(to: string, message: string): Promise<void> {
    try {
      // Twilio integration
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
      const from = this.configService.get('TWILIO_PHONE_NUMBER');

      if (!accountSid || !authToken) {
        this.logger.warn('Twilio not configured, skipping SMS');
        return;
      }

      // Dynamic import to avoid issues if Twilio is not configured
      const twilio = await import('twilio');
      const client = twilio.default(accountSid, authToken);
      await client.messages.create({ body: message, from, to });
    } catch (error) {
      this.logger.error('Failed to send SMS', error);
    }
  }
}
