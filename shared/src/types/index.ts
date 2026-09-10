// =============================================================================
// Shared domain types — consumed by the Next.js web app today, and intended
// to be imported unchanged by the React Native / Capacitor app later.
// Mirrors the shapes served by the NestJS backend (see backend/prisma/schema.prisma).
// =============================================================================

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
export type ListingCondition = 'NEW' | 'USED' | 'REFURBISHED';
export type PriceType = 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'ON_REQUEST';
export type PromotionTier = 'NONE' | 'FEATURED' | 'TOP_AD' | 'VIP';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'PENDING_REVIEW';
export type MessageType = 'TEXT' | 'IMAGE' | 'LISTING_SHARE' | 'SYSTEM';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarInitials: string;
  avatarUrl?: string; // data URL or hosted image; falls back to initials when unset
  role: UserRole;
  isVerifiedSeller: boolean;
  rating: number;
  memberSince: string; // ISO date
  state?: string;
  lga?: string;
}

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  icon: CategoryIconKey;
  subcategories: Subcategory[];
}

export type CategoryIconKey =
  | 'car'
  | 'home'
  | 'smartphone'
  | 'laptop'
  | 'shirt'
  | 'briefcase'
  | 'sofa'
  | 'sparkles'
  | 'wrench';

export interface ListingAttribute {
  key: string;
  value: string;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  priceType: PriceType;
  condition: ListingCondition;
  status: ListingStatus;
  promotionTier: PromotionTier;
  categorySlug: string;
  subcategorySlug?: string;
  state: string;
  lga: string;
  images: string[];
  attributes: ListingAttribute[];
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl?: string; // the seller's current profile photo, joined live at read time
  sellerRating: number;
  isVerifiedSeller: boolean;
  sellerPhone: string;
  viewCount: number;
  createdAt: string; // ISO date
}

export interface ListingFilters {
  categorySlug?: string;
  subcategorySlug?: string;
  q?: string;
  state?: string;
  lga?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition;
  sort?: 'newest' | 'price_low' | 'price_high';
}

export type NewListingInput = Omit<
  Listing,
  'id' | 'createdAt' | 'viewCount' | 'status' | 'sellerRating' | 'isVerifiedSeller' | 'currency' | 'sellerAvatarUrl'
> & {
  currency?: string;
  sellerRating?: number;
  isVerifiedSeller?: boolean;
};

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  from: 'me' | 'them';
  type: MessageType;
  text: string;
  createdAt: string; // ISO date
}

export interface ChatRoom {
  id: string;
  listingId: string;
  otherPartyName: string;
  otherPartyId: string;
  lastMessageAt: string; // ISO date
  unreadCount: number;
}

export interface LocationState {
  name: string;
  lgas: string[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  lga: string;
}
