import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getCategoryTree() {
    return this.redis.getOrSet('categories:tree', () =>
      this.prisma.category.findMany({
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            },
          },
          attributes: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { listings: true } },
        },
      }),
    3600);
  }

  async getCategoryBySlug(slug: string) {
    return this.redis.getOrSet(`category:${slug}`, () =>
      this.prisma.category.findUnique({
        where: { slug },
        include: {
          parent: true,
          children: { where: { isActive: true } },
          attributes: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { listings: true } },
        },
      }),
    3600);
  }
}
