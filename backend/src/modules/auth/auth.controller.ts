import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Headers,
  Ip,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
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
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './strategies/jwt-access.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email Auth ───────────────────────────────────────────

  @Post('register/email')
  @ApiOperation({ summary: 'Register with email and password' })
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterEmailDto) {
    return this.authService.registerWithEmail(dto);
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  loginEmail(
    @Body() dto: LoginEmailDto,
    @Headers('user-agent') deviceInfo: string,
    @Ip() ip: string,
  ) {
    return this.authService.loginWithEmail(dto, deviceInfo, ip);
  }

  // ─── Phone / OTP Auth ─────────────────────────────────────

  @Post('register/phone')
  @ApiOperation({ summary: 'Register with phone number (sends OTP)' })
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  registerPhone(@Body() dto: RegisterPhoneDto) {
    return this.authService.registerWithPhone(dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number for login' })
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendLoginOtp(dto);
  }

  @Post('login/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone OTP' })
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  loginPhone(
    @Body() dto: LoginPhoneDto,
    @Headers('user-agent') deviceInfo: string,
    @Ip() ip: string,
  ) {
    return this.authService.loginWithPhone(dto, deviceInfo, ip);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // ─── OAuth ────────────────────────────────────────────────

  @Post('oauth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via OAuth (Google/Apple)' })
  oauthLogin(@Body() dto: OAuthLoginDto, @Headers('user-agent') deviceInfo: string) {
    return this.authService.oauthLogin(dto, deviceInfo);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth() {
    // Handled by Passport
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  googleCallback(@Req() req: Request) {
    return req.user;
  }

  // ─── Token Management ─────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refreshTokens(
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') deviceInfo: string,
  ) {
    return this.authService.refreshTokens(dto, deviceInfo);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  // ─── Password Reset ───────────────────────────────────────

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── Profile ─────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
