import { IsEmail, IsString, MinLength, IsNotEmpty, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from '@prisma/client';

export class RegisterEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class RegisterPhoneDto {
  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class LoginEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Invalid phone number format' })
  phone: string;
}

export class LoginPhoneDto {
  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com or +2348012345678' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class OAuthLoginDto {
  @ApiProperty({ example: 'GOOGLE' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'google-user-id-123' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  newPassword: string;
}
