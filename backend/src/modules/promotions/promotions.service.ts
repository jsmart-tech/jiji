import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, PromotionTier } from '@prisma/client';
import { CreatePromotionDto } from './dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Plans ────────────────────────────────────────────────

  async getPlans() {
    return this.redis.getOrSet(
      'promotions:plans',
      () => this.prisma.promotionPlan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } }),
      3600,
    );
  }

  async getPlan(id: string) {
    const plan = await this.prisma.promotionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Promotion plan not found');
    return plan;
  }

  // ─── Purchase Flow ────────────────────────────────────────
  // No payment provider is wired up yet (see backend/.env.example), so this
  // creates a pending transaction + promotion pair. `confirmPayment` below
  // stands in for the provider webhook (Paystack/Flutterwave) that would
  // normally call back once the charge succeeds.

  async createPromotion(userId: string, dto: CreatePromotionDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');

    const plan = await this.getPlan(dto.planId);
    if (!plan.isActive) throw new BadRequestException('This promotion plan is no longer available');

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        amount: plan.price,
        currency: plan.currency,
        reference: `promo_${nanoid(12)}`,
        provider: 'paystack',
        status: 'pending',
        description: `${plan.name} promotion for listing ${listing.title}`,
      },
    });

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const promotion = await this.prisma.listingPromotion.create({
      data: {
        listingId: dto.listingId,
        planId: plan.id,
        startsAt,
        expiresAt,
        isPaid: false,
        transactionId: transaction.id,
      },
      include: { plan: true },
    });

    return { promotion, transaction };
  }

  /**
   * Simulates the payment provider's success webhook. In production this
   * would be called by Paystack/Flutterwave server-to-server, not by the
   * client — kept as an explicit endpoint here so the promotion flow is
   * fully testable without live payment credentials.
   */
  async confirmPayment(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { promotions: { include: { listing: true, plan: true } } },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId) throw new ForbiddenException('Not your transaction');
    if (transaction.status !== 'pending') throw new BadRequestException(`Transaction already ${transaction.status}`);

    const promotion = transaction.promotions[0];
    if (!promotion) throw new NotFoundException('No promotion linked to this transaction');

    const [, , updatedListing] = await this.prisma.$transaction([
      this.prisma.transaction.update({ where: { id: transactionId }, data: { status: 'success' } }),
      this.prisma.listingPromotion.update({ where: { id: promotion.id }, data: { isPaid: true } }),
      this.prisma.listing.update({
        where: { id: promotion.listingId },
        data: { promotionTier: promotion.plan.tier, isFeatured: promotion.plan.tier !== PromotionTier.NONE },
      }),
    ]);

    await this.redis.invalidatePattern('listings:*');
    await this.notifications.create(userId, {
      type: NotificationType.SYSTEM,
      title: 'Promotion activated',
      body: `Your ${promotion.plan.name} promotion for "${promotion.listing.title}" is now live.`,
      data: { listingId: promotion.listingId },
    });

    return updatedListing;
  }

  async getMyPromotions(userId: string) {
    return this.prisma.listingPromotion.findMany({
      where: { listing: { sellerId: userId } },
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: { id: true, title: true, slug: true } }, plan: true, transaction: true },
    });
  }

  // ─── Expiry Sweep ─────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async expirePromotions(): Promise<void> {
    const expired = await this.prisma.listingPromotion.findMany({
      where: { isPaid: true, expiresAt: { lt: new Date() }, listing: { promotionTier: { not: PromotionTier.NONE } } },
      include: { listing: true },
    });

    for (const promo of expired) {
      await this.prisma.listing.update({
        where: { id: promo.listingId },
        data: { promotionTier: PromotionTier.NONE, isFeatured: false },
      });
      await this.notifications.create(promo.listing.sellerId, {
        type: NotificationType.PROMOTION_EXPIRY,
        title: 'Your promotion has expired',
        body: `The promotion for "${promo.listing.title}" has ended.`,
        data: { listingId: promo.listingId },
      });
    }

    if (expired.length > 0) {
      await this.redis.invalidatePattern('listings:*');
      this.logger.log(`Expired ${expired.length} listing promotion(s).`);
    }
  }
}
