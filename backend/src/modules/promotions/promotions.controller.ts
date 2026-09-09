import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available promotion plans' })
  getPlans() {
    return this.promotionsService.getPlans();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the current user's listing promotions" })
  getMyPromotions(@CurrentUser() user: JwtPayload) {
    return this.promotionsService.getMyPromotions(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start promoting a listing (creates a pending transaction)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePromotionDto) {
    return this.promotionsService.createPromotion(user.sub, dto);
  }

  @Post(':transactionId/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment for a promotion (stands in for the payment provider webhook)' })
  confirm(@Param('transactionId') transactionId: string, @CurrentUser() user: JwtPayload) {
    return this.promotionsService.confirmPayment(user.sub, transactionId);
  }
}
