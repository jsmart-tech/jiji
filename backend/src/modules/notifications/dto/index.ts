import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class ListNotificationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

/**
 * Internal shape used when other modules (chat, reviews, promotions) create
 * a notification. Not exposed over HTTP — there is no public "create
 * notification" endpoint, notifications are always system-generated.
 */
export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
