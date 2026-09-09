import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { User } from '@prisma/client';

// Fields to exclude from user objects in responses
const USER_SAFE_FIELDS = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  username: true, avatarUrl: true, bio: true, role: true,
  isEmailVerified: true, isPhoneVerified: true, isVerifiedSeller: true,
  sellerScore: true, lastSeenAt: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SAFE_FIELDS });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIdWithStats(id: string) {
    const cacheKey = `user:profile:${id}`;
    return this.redis.getOrSet(cacheKey, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          ...USER_SAFE_FIELDS,
          _count: { select: { listings: true, reviews: true } },
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: { rating: true, comment: true, giver: { select: { firstName: true, avatarUrl: true } }, createdAt: true },
          },
          location: true,
          sellerVerification: { select: { status: true } },
        },
      });
      if (!user) throw new NotFoundException('User not found');

      // Compute average rating
      const agg = await this.prisma.review.aggregate({
        where: { sellerId: id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return { ...user, avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.rating };
    }, 300);
  }

  async updateProfile(id: string, data: Partial<{ firstName: string; lastName: string; bio: string; avatarUrl: string }>) {
    await this.redis.del(`user:profile:${id}`);
    return this.prisma.user.update({ where: { id }, data, select: USER_SAFE_FIELDS });
  }

  async updateLocation(userId: string, location: { latitude?: number; longitude?: number; cityId?: string; stateId?: string; address?: string }) {
    return this.prisma.userLocation.upsert({
      where: { userId },
      create: { userId, ...location },
      update: location,
    });
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { fcmToken } });
  }

  /**
   * Strip sensitive fields from User for API responses.
   */
  sanitizeUser(user: User): Record<string, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, fcmToken, banReason, isBanned, ...safe } = user;
    return safe;
  }
}
