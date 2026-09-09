import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { SearchListingsDto } from '../listings/dto';

interface ListingDocument {
  id: string;
  title: string;
  description: string;
  price: number | null;
  priceType: string;
  condition: string;
  status: string;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  isVerifiedSeller: boolean;
  stateId: string | null;
  stateName: string | null;
  lgaId: string | null;
  lgaName: string | null;
  coverImageUrl: string | null;
  promotionTier: string;
  viewCount: number;
  _geo?: { lat: number; lng: number };
  publishedAt: number; // Unix timestamp
  createdAt: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private index: Index<ListingDocument>;
  private readonly INDEX_NAME = 'listings';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('meili.host', 'http://localhost:7700'),
      apiKey: this.configService.get<string>('meili.masterKey'),
    });

    try {
      this.index = this.client.index<ListingDocument>(this.INDEX_NAME);
      await this.configureIndex();
      this.logger.log('✅ Meilisearch initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch', error);
    }
  }

  private async configureIndex() {
    // Searchable attributes (ordered by priority)
    await this.index.updateSearchableAttributes([
      'title',
      'description',
      'categoryName',
      'stateName',
      'lgaName',
      'sellerName',
    ]);

    // Filterable attributes for faceted search
    await this.index.updateFilterableAttributes([
      'categoryId',
      'stateId',
      'lgaId',
      'status',
      'condition',
      'priceType',
      'price',
      'isVerifiedSeller',
      'promotionTier',
      '_geo',
    ]);

    // Sortable attributes
    await this.index.updateSortableAttributes([
      'price',
      'publishedAt',
      'viewCount',
      '_geo',
    ]);

    // Ranking rules
    await this.index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ]);

    // Enable geo search
    await this.index.updateSettings({
      pagination: { maxTotalHits: 10000 },
    });
  }

  // ─── Indexing ────────────────────────────────────────────

  async indexListing(listing: Record<string, unknown>): Promise<void> {
    try {
      const category = listing['category'] as Record<string, string> | null;
      const seller = listing['seller'] as Record<string, unknown> | null;
      const state = listing['state'] as Record<string, string> | null;
      const lga = listing['lga'] as Record<string, string> | null;
      const media = listing['media'] as Array<Record<string, unknown>> | null;

      const doc: ListingDocument = {
        id: listing['id'] as string,
        title: listing['title'] as string,
        description: listing['description'] as string,
        price: listing['price'] ? Number(listing['price']) : null,
        priceType: listing['priceType'] as string,
        condition: listing['condition'] as string,
        status: listing['status'] as string,
        categoryId: listing['categoryId'] as string,
        categoryName: category?.['name'] ?? '',
        sellerId: listing['sellerId'] as string,
        sellerName: seller ? `${seller['firstName']} ${seller['lastName']}` : '',
        isVerifiedSeller: (seller?.['isVerifiedSeller'] as boolean) ?? false,
        stateId: listing['stateId'] as string | null,
        stateName: state?.['name'] ?? null,
        lgaId: listing['lgaId'] as string | null,
        lgaName: lga?.['name'] ?? null,
        coverImageUrl: media?.[0]?.['url'] as string ?? null,
        promotionTier: listing['promotionTier'] as string,
        viewCount: listing['viewCount'] as number ?? 0,
        publishedAt: listing['publishedAt']
          ? new Date(listing['publishedAt'] as string).getTime()
          : Date.now(),
        createdAt: new Date(listing['createdAt'] as string).getTime(),
      };

      // Add geo coordinates if available
      if (listing['latitude'] && listing['longitude']) {
        doc._geo = { lat: listing['latitude'] as number, lng: listing['longitude'] as number };
      }

      await this.index.addDocuments([doc]);
    } catch (error) {
      this.logger.error('Failed to index listing', error);
    }
  }

  async deleteListing(id: string): Promise<void> {
    await this.index.deleteDocument(id).catch((e) => this.logger.error('Failed to delete from index', e));
  }

  // ─── Search ──────────────────────────────────────────────

  async searchListings(dto: SearchListingsDto): Promise<unknown> {
    const filters: string[] = ['status = "ACTIVE"'];

    if (dto.categoryId) filters.push(`categoryId = "${dto.categoryId}"`);
    if (dto.stateId) filters.push(`stateId = "${dto.stateId}"`);
    if (dto.lgaId) filters.push(`lgaId = "${dto.lgaId}"`);
    if (dto.condition) filters.push(`condition = "${dto.condition}"`);
    if (dto.priceType) filters.push(`priceType = "${dto.priceType}"`);
    if (dto.minPrice !== undefined) filters.push(`price >= ${dto.minPrice}`);
    if (dto.maxPrice !== undefined) filters.push(`price <= ${dto.maxPrice}`);

    // Sort options
    const sortMap: Record<string, string[]> = {
      price_asc: ['price:asc'],
      price_desc: ['price:desc'],
      date_desc: ['publishedAt:desc'],
      views: ['viewCount:desc'],
      relevance: [],
    };
    const sort = sortMap[dto.sortBy ?? 'relevance'] ?? [];

    const searchParams: Record<string, unknown> = {
      filter: filters.join(' AND '),
      sort,
      limit: dto.limit ?? 20,
      offset: ((dto.page ?? 1) - 1) * (dto.limit ?? 20),
      facets: ['categoryId', 'stateId', 'condition', 'priceType'],
      attributesToRetrieve: ['*'],
      attributesToHighlight: ['title', 'description'],
    };

    // Geo search
    if (dto.lat && dto.lng) {
      searchParams['sort'] = [`_geoPoint(${dto.lat}, ${dto.lng}):asc`, ...sort];
      if (dto.radiusKm) {
        searchParams['filter'] = [
          filters.join(' AND '),
          `_geoRadius(${dto.lat}, ${dto.lng}, ${dto.radiusKm * 1000})`,
        ];
      }
    }

    const result = await this.index.search(dto.q ?? '', searchParams);
    return {
      hits: result.hits,
      total: result.estimatedTotalHits,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      facets: result.facetDistribution,
    };
  }
}
