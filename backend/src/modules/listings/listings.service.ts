import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { SearchService } from '../search/search.service';
import { ListingStatus, PromotionTier, Prisma } from '@prisma/client';
import { CreateListingDto, UpdateListingDto, SearchListingsDto, MarkSoldDto } from './dto';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

@Injectable()
export class ListingsService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly LISTINGS_PER_PAGE = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly searchService: SearchService,
  ) {}

  // ─── Create Listing ──────────────────────────────────────

  async create(sellerId: string, dto: CreateListingDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(8)}`;

    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? 'NGN',
        priceType: dto.priceType,
        condition: dto.condition,
        status: ListingStatus.PENDING_REVIEW,
        sellerId,
        categoryId: dto.categoryId,
        stateId: dto.stateId,
        lgaId: dto.lgaId,
        cityId: dto.cityId,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        // Dynamic category attributes
        attributes: dto.attributes?.length
          ? { createMany: { data: dto.attributes } }
          : undefined,
      },
      include: {
        category: true,
        seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isVerifiedSeller: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        state: true,
        lga: true,
        city: true,
      },
    });

    // Index in Meilisearch
    await this.searchService.indexListing(listing);
    await this.redis.invalidatePattern('listings:*');

    return listing;
  }

  // ─── Search & Filter Listings ────────────────────────────

  async search(dto: SearchListingsDto) {
    const cacheKey = `listings:search:${JSON.stringify(dto)}`;
    return this.redis.getOrSet(cacheKey, () => this.searchService.searchListings(dto), this.CACHE_TTL);
  }

  // ─── Get Listing by ID or Slug ───────────────────────────

  async findOne(idOrSlug: string, incrementView = true) {
    const where: Prisma.ListingWhereUniqueInput = idOrSlug.startsWith('cl')
      ? { id: idOrSlug }
      : { slug: idOrSlug };

    const listing = await this.prisma.listing.findUnique({
      where,
      include: {
        category: { include: { parent: true } },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerifiedSeller: true,
            sellerScore: true,
            createdAt: true,
            _count: { select: { listings: true } },
          },
        },
        media: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        state: true,
        lga: true,
        city: true,
        promotions: { where: { expiresAt: { gte: new Date() }, isPaid: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    // Increment view count asynchronously
    if (incrementView) {
      void this.prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } });
    }

    return listing;
  }

  // ─── Update Listing ──────────────────────────────────────

  async update(id: string, sellerId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not your listing');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        ...dto,
        status: ListingStatus.PENDING_REVIEW, // re-review on edit
        attributes: dto.attributes
          ? {
              deleteMany: {},
              createMany: { data: dto.attributes },
            }
          : undefined,
      },
      include: { media: true, category: true },
    });

    await this.searchService.indexListing(updated);
    await this.redis.invalidatePattern('listings:*');
    return updated;
  }

  // ─── Delete / Remove Listing ─────────────────────────────

  async remove(id: string, sellerId: string, isAdmin = false) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (!isAdmin && listing.sellerId !== sellerId) throw new ForbiddenException('Not your listing');

    await this.prisma.listing.update({ where: { id }, data: { status: ListingStatus.REMOVED } });
    await this.searchService.deleteListing(id);
    await this.redis.invalidatePattern('listings:*');
  }

  // ─── Mark as Sold ────────────────────────────────────────

  async markSold(id: string, sellerId: string, dto: MarkSoldDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not your listing');

    return this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.SOLD },
    });
  }

  // ─── Seller's Own Listings ────────────────────────────────

  async findBySeller(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where: { sellerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { media: { where: { isCover: true }, take: 1 }, category: true },
      }),
      this.prisma.listing.count({ where: { sellerId } }),
    ]);
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // ─── Featured / Home Feed ────────────────────────────────

  async getFeatured(limit = 10) {
    return this.redis.getOrSet(
      'listings:featured',
      () =>
        this.prisma.listing.findMany({
          where: { status: ListingStatus.ACTIVE, promotionTier: { not: PromotionTier.NONE } },
          take: limit,
          orderBy: [{ promotionTier: 'desc' }, { publishedAt: 'desc' }],
          include: { media: { where: { isCover: true }, take: 1 }, category: true, seller: { select: { firstName: true, isVerifiedSeller: true } } },
        }),
      this.CACHE_TTL,
    );
  }

  async getRecentByCategory(categoryId: string, page = 1, limit = 20) {
    const cacheKey = `listings:cat:${categoryId}:p${page}`;
    return this.redis.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const [data, total] = await this.prisma.$transaction([
          this.prisma.listing.findMany({
            where: { categoryId, status: ListingStatus.ACTIVE },
            skip,
            take: limit,
            orderBy: [{ promotionTier: 'desc' }, { publishedAt: 'desc' }],
            include: { media: { where: { isCover: true }, take: 1 }, state: true },
          }),
          this.prisma.listing.count({ where: { categoryId, status: ListingStatus.ACTIVE } }),
        ]);
        return { data, total, page, lastPage: Math.ceil(total / limit) };
      },
      this.CACHE_TTL,
    );
  }

  // ─── Save / Unsave Listing ───────────────────────────────

  async toggleSave(userId: string, listingId: string) {
    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      await this.prisma.savedListing.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.savedListing.create({ data: { userId, listingId } });
    return { saved: true };
  }

  async getSavedListings(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.savedListing.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { listing: { include: { media: { where: { isCover: true }, take: 1 }, category: true } } },
      }),
      this.prisma.savedListing.count({ where: { userId } }),
    ]);
    return { data: data.map((s) => s.listing), total, page, lastPage: Math.ceil(total / limit) };
  }
}
