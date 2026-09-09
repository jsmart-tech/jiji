import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Prisma } from '@prisma/client';
import { CreateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(giverId: string, dto: CreateReviewDto) {
    if (dto.sellerId === giverId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const seller = await this.prisma.user.findUnique({ where: { id: dto.sellerId } });
    if (!seller) throw new NotFoundException('Seller not found');

    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.sellerId !== dto.sellerId) {
        throw new BadRequestException('Listing does not belong to this seller');
      }
    }

    let review;
    try {
      review = await this.prisma.review.create({
        data: {
          sellerId: dto.sellerId,
          giverId,
          listingId: dto.listingId,
          rating: dto.rating,
          comment: dto.comment,
          isVerified: !!dto.listingId,
        },
        include: {
          giver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('You have already reviewed this listing');
      }
      throw err;
    }

    await this.notifications.create(dto.sellerId, {
      type: NotificationType.NEW_REVIEW,
      title: 'You received a new review',
      body: `${review.giver.firstName} left you a ${dto.rating}-star review.`,
      data: { reviewId: review.id, listingId: dto.listingId },
    });

    return review;
  }

  async findForSeller(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { sellerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          giver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          listing: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where: { sellerId } }),
    ]);
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getSellerRatingSummary(sellerId: string) {
    const [agg, breakdown] = await Promise.all([
      this.prisma.review.aggregate({
        where: { sellerId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { sellerId },
        _count: { rating: true },
      }),
    ]);

    const breakdownByStar: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of breakdown) {
      breakdownByStar[row.rating as 1 | 2 | 3 | 4 | 5] = row._count.rating;
    }

    return {
      averageRating: agg._avg.rating ?? 0,
      totalReviews: agg._count.rating,
      breakdown: breakdownByStar,
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.giverId !== userId) throw new ForbiddenException('Not your review');

    await this.prisma.review.delete({ where: { id } });
  }
}
