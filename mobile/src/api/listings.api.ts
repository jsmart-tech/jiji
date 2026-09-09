import api from './client';
import type { User } from './auth.api';

// ─── Types ────────────────────────────────────────────────

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  price?: number;
  currency: string;
  priceType: string;
  condition: string;
  status: string;
  promotionTier: string;
  viewCount: number;
  seller: Partial<User> & { isVerifiedSeller: boolean };
  category: { id: string; name: string; slug: string };
  media: ListingMedia[];
  state?: { id: string; name: string };
  lga?: { id: string; name: string };
  city?: { id: string; name: string };
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  publishedAt?: string;
}

export interface ListingMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  isCover: boolean;
  sortOrder: number;
}

export interface SearchListingsParams {
  q?: string;
  categoryId?: string;
  stateId?: string;
  lgaId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  priceType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price?: number;
  priceType: string;
  condition: string;
  categoryId: string;
  stateId?: string;
  lgaId?: string;
  cityId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  attributes?: Array<{ attributeId: string; value: string }>;
}

// ─── Listings API ─────────────────────────────────────────

export const listingsApi = {
  search: async (params: SearchListingsParams) => {
    const res = await api.get('/listings/search', { params });
    return res.data;
  },

  getFeatured: async () => {
    const res = await api.get<Listing[]>('/listings/featured');
    return res.data;
  },

  getByCategory: async (categoryId: string, params?: { page?: number; limit?: number }) => {
    const res = await api.get<PaginatedResult<Listing>>(`/listings/category/${categoryId}`, { params });
    return res.data;
  },

  findOne: async (idOrSlug: string): Promise<Listing> => {
    const res = await api.get<Listing>(`/listings/${idOrSlug}`);
    return res.data;
  },

  getMyListings: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get<PaginatedResult<Listing>>('/listings/my', { params });
    return res.data;
  },

  create: async (data: CreateListingPayload): Promise<Listing> => {
    const res = await api.post<Listing>('/listings', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateListingPayload>): Promise<Listing> => {
    const res = await api.put<Listing>(`/listings/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/listings/${id}`);
  },

  markSold: async (id: string): Promise<Listing> => {
    const res = await api.patch<Listing>(`/listings/${id}/sold`, {});
    return res.data;
  },

  toggleSave: async (id: string): Promise<{ saved: boolean }> => {
    const res = await api.post<{ saved: boolean }>(`/listings/${id}/save`);
    return res.data;
  },

  getSaved: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get<PaginatedResult<Listing>>('/listings/saved', { params });
    return res.data;
  },
};
