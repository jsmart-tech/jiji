import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType } from '@prisma/client';

export interface PresignedUploadUrl {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly cdnUrl: string | undefined;
  private readonly presignedExpiry: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.s3 = new AWS.S3({
      region: configService.get<string>('aws.region'),
      accessKeyId: configService.get<string>('aws.accessKeyId'),
      secretAccessKey: configService.get<string>('aws.secretAccessKey'),
    });
    this.bucket = configService.get<string>('aws.s3Bucket', 'jsmart-media');
    this.cdnUrl = configService.get<string>('aws.cloudfrontUrl');
    this.presignedExpiry = configService.get<number>('aws.presignedUrlExpiry', 3600);
  }

  // ─── Presigned Upload URL ────────────────────────────────

  async generatePresignedUploadUrl(
    userId: string,
    contentType: string,
    folder: 'listings' | 'avatars' | 'kyc' = 'listings',
  ): Promise<PresignedUploadUrl> {
    const extension = this.getExtension(contentType);
    const fileKey = `${folder}/${userId}/${uuidv4()}${extension}`;

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: contentType,
      Expires: this.presignedExpiry,
      ACL: 'private', // Use CloudFront for public access
    });

    const publicUrl = this.cdnUrl
      ? `${this.cdnUrl}/${fileKey}`
      : `https://${this.bucket}.s3.amazonaws.com/${fileKey}`;

    return { uploadUrl, fileKey, publicUrl, expiresIn: this.presignedExpiry };
  }

  async generateBatchPresignedUrls(
    userId: string,
    files: Array<{ contentType: string; folder?: 'listings' | 'avatars' | 'kyc' }>,
  ): Promise<PresignedUploadUrl[]> {
    return Promise.all(
      files.map((f) => this.generatePresignedUploadUrl(userId, f.contentType, f.folder ?? 'listings')),
    );
  }

  // ─── Listing Media Management ────────────────────────────

  async addListingMedia(listingId: string, media: Array<{ url: string; type?: MediaType; sortOrder?: number }>) {
    const records = media.map((m, i) => ({
      listingId,
      url: m.url,
      type: m.type ?? MediaType.IMAGE,
      sortOrder: m.sortOrder ?? i,
      isCover: i === 0,
    }));

    return this.prisma.listingMedia.createMany({ data: records });
  }

  async deleteListingMedia(mediaId: string, listingId: string) {
    const media = await this.prisma.listingMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.listingId !== listingId) return;

    // Delete from S3
    const fileKey = this.extractKeyFromUrl(media.url);
    if (fileKey) {
      await this.s3.deleteObject({ Bucket: this.bucket, Key: fileKey }).promise().catch(this.logger.error.bind(this.logger));
    }

    await this.prisma.listingMedia.delete({ where: { id: mediaId } });
  }

  async reorderMedia(listingId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.listingMedia.update({
          where: { id },
          data: { sortOrder: index, isCover: index === 0 },
        }),
      ),
    );
  }

  // ─── Helpers ─────────────────────────────────────────────

  private getExtension(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'application/pdf': '.pdf',
    };
    return map[contentType] ?? '';
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.pathname.slice(1); // Remove leading slash
    } catch {
      return null;
    }
  }
}
