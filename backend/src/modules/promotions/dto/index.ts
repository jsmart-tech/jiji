import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  planId: string;
}
