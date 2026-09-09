import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ListReviewsDto } from './dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a review for a seller' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: "List a seller's reviews" })
  findForSeller(@Param('sellerId') sellerId: string, @Query() dto: ListReviewsDto) {
    return this.reviewsService.findForSeller(sellerId, dto.page, dto.limit);
  }

  @Get('seller/:sellerId/summary')
  @ApiOperation({ summary: "Get a seller's rating summary" })
  getSummary(@Param('sellerId') sellerId: string) {
    return this.reviewsService.getSellerRatingSummary(sellerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own review' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reviewsService.remove(id, user.sub);
  }
}
