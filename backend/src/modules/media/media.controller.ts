import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { MediaService } from './media.service';

class GetPresignedUrlDto {
  @IsString()
  contentType: string;

  @IsOptional()
  @IsEnum(['listings', 'avatars', 'kyc'])
  folder?: 'listings' | 'avatars' | 'kyc';
}

class GetBatchPresignedUrlsDto {
  @IsArray()
  files: Array<{ contentType: string; folder?: 'listings' | 'avatars' | 'kyc' }>;
}

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get a pre-signed S3 upload URL for a single file' })
  getPresignedUrl(@CurrentUser() user: JwtPayload, @Body() dto: GetPresignedUrlDto) {
    return this.mediaService.generatePresignedUploadUrl(user.sub, dto.contentType, dto.folder);
  }

  @Post('presigned-urls/batch')
  @ApiOperation({ summary: 'Get batch pre-signed S3 upload URLs' })
  getBatchPresignedUrls(@CurrentUser() user: JwtPayload, @Body() dto: GetBatchPresignedUrlsDto) {
    return this.mediaService.generateBatchPresignedUrls(user.sub, dto.files);
  }

  @Delete('listing/:listingId/:mediaId')
  @ApiOperation({ summary: 'Delete a listing media item' })
  deleteListingMedia(@Param('listingId') listingId: string, @Param('mediaId') mediaId: string) {
    return this.mediaService.deleteListingMedia(mediaId, listingId);
  }
}
