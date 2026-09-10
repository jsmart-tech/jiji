import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { MOCK_LISTINGS } from '../mock/listings.mock';
import { readLocalStorage, writeLocalStorage } from '../lib/storage';
import type { Listing, ListingFilters, NewListingInput } from '../types';

const LOCAL_LISTINGS_KEY = 'jsmart_web_local_listings';

function getLocalListings(): Listing[] {
  return readLocalStorage<Listing[]>(LOCAL_LISTINGS_KEY, []);
}

function saveLocalListings(listings: Listing[]): void {
  writeLocalStorage(LOCAL_LISTINGS_KEY, listings);
}

function allMockListings(): Listing[] {
  // User-created listings (persisted locally) take priority over the seed set.
  return [...getLocalListings(), ...MOCK_LISTINGS];
}

function matches(listing: Listing, f: ListingFilters): boolean {
  if (f.categorySlug && listing.categorySlug !== f.categorySlug) return false;
  if (f.subcategorySlug && listing.subcategorySlug !== f.subcategorySlug) return false;
  if (f.state && listing.state !== f.state) return false;
  if (f.lga && listing.lga !== f.lga) return false;
  if (f.condition && listing.condition !== f.condition) return false;
  if (typeof f.minPrice === 'number' && (listing.price ?? 0) < f.minPrice) return false;
  if (typeof f.maxPrice === 'number' && (listing.price ?? 0) > f.maxPrice) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const haystack = `${listing.title} ${listing.description} ${listing.state} ${listing.lga}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function sortListings(list: Listing[], sort?: ListingFilters['sort']): Listing[] {
  const copy = [...list];
  if (sort === 'price_low') copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sort === 'price_high') copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  else copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return copy;
}

// ─── Supabase row <-> Listing mapping ──────────────────────────────────────

interface ListingRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  price_type: Listing['priceType'];
  condition: Listing['condition'];
  status: Listing['status'];
  promotion_tier: Listing['promotionTier'];
  category_slug: string;
  subcategory_slug: string | null;
  state: string;
  lga: string;
  images: string[];
  attributes: Listing['attributes'];
  seller_id: string;
  seller_name: string;
  seller_rating: number;
  is_verified_seller: boolean;
  seller_phone: string;
  view_count: number;
  created_at: string;
  seller?: { avatar_url: string | null } | null;
}

// Joins the seller's live avatar rather than storing a copy on every listing
// row — avatars can be large base64 images, and this way it's always current.
const LISTING_SELECT = '*, seller:profiles!seller_id(avatar_url)';

function rowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    priceType: row.price_type,
    condition: row.condition,
    status: row.status,
    promotionTier: row.promotion_tier,
    categorySlug: row.category_slug,
    subcategorySlug: row.subcategory_slug ?? undefined,
    state: row.state,
    lga: row.lga,
    images: row.images,
    attributes: row.attributes,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerAvatarUrl: row.seller?.avatar_url ?? undefined,
    sellerRating: row.seller_rating,
    isVerifiedSeller: row.is_verified_seller,
    sellerPhone: row.seller_phone,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

function slugify(title: string): string {
  return `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    let query = supabase.from('listings').select(LISTING_SELECT).eq('status', 'ACTIVE');

    if (filters.categorySlug) query = query.eq('category_slug', filters.categorySlug);
    if (filters.subcategorySlug) query = query.eq('subcategory_slug', filters.subcategorySlug);
    if (filters.state) query = query.eq('state', filters.state);
    if (filters.lga) query = query.eq('lga', filters.lga);
    if (filters.condition) query = query.eq('condition', filters.condition);
    if (typeof filters.minPrice === 'number') query = query.gte('price', filters.minPrice);
    if (typeof filters.maxPrice === 'number') query = query.lte('price', filters.maxPrice);
    if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);

    if (filters.sort === 'price_low') query = query.order('price', { ascending: true });
    else if (filters.sort === 'price_high') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as ListingRow[]).map(rowToListing);
  }

  return sortListings(allMockListings().filter((l) => matches(l, filters)), filters.sort);
}

export async function getListingById(id: string): Promise<Listing | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToListing(data as ListingRow) : null;
  }

  return allMockListings().find((l) => l.id === id) ?? null;
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const all = await getListings();
  return all.filter((l) => l.promotionTier !== 'NONE');
}

export async function createListing(input: NewListingInput): Promise<Listing> {
  // Premium (paid) tiers go live only after an admin approves payment; free
  // listings publish immediately.
  const initialStatus: Listing['status'] = input.promotionTier === 'NONE' ? 'ACTIVE' : 'PENDING_REVIEW';

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error('You must be logged in to post a listing.');

    const row = {
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      price: input.price,
      currency: input.currency ?? 'NGN',
      price_type: input.priceType,
      condition: input.condition,
      status: initialStatus,
      promotion_tier: input.promotionTier,
      category_slug: input.categorySlug,
      subcategory_slug: input.subcategorySlug ?? null,
      state: input.state,
      lga: input.lga,
      images: input.images,
      attributes: input.attributes,
      seller_id: authData.user.id,
      seller_name: input.sellerName,
      seller_rating: input.sellerRating ?? 0,
      is_verified_seller: input.isVerifiedSeller ?? false,
      seller_phone: input.sellerPhone,
    };

    const { data, error } = await supabase.from('listings').insert(row).select().single();
    if (error || !data) throw new Error(error?.message ?? 'Could not create listing.');
    return rowToListing(data as ListingRow);
  }

  const listing: Listing = {
    ...input,
    currency: input.currency ?? 'NGN',
    sellerRating: input.sellerRating ?? 0,
    isVerifiedSeller: input.isVerifiedSeller ?? false,
    id: `local_${Date.now()}`,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    status: initialStatus,
  };
  saveLocalListings([listing, ...getLocalListings()]);
  return listing;
}

// All of the current user's own listings, regardless of status — unlike
// getListings(), this includes PENDING_REVIEW ads so "My Adverts" can show
// what's still awaiting admin approval.
export async function getMyListings(sellerId: string): Promise<Listing[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ListingRow[]).map(rowToListing);
  }

  return sortListings(allMockListings().filter((l) => l.sellerId === sellerId));
}

// Admin-only in practice (see the admin RLS policy in supabase/schema.sql):
// every listing awaiting payment approval, across all sellers.
export async function getPendingListings(): Promise<Listing[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('status', 'PENDING_REVIEW')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ListingRow[]).map(rowToListing);
  }

  return sortListings(allMockListings().filter((l) => l.status === 'PENDING_REVIEW'));
}

export async function approveListing(id: string): Promise<Listing> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'ACTIVE' })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Could not approve listing.');
    return rowToListing(data as ListingRow);
  }

  const local = getLocalListings();
  const index = local.findIndex((l) => l.id === id);
  if (index === -1) throw new Error('Listing not found.');
  local[index] = { ...local[index], status: 'ACTIVE' };
  saveLocalListings(local);
  return local[index];
}

export type ListingEditableFields = Partial<
  Pick<
    Listing,
    'title' | 'description' | 'price' | 'priceType' | 'condition' | 'categorySlug' | 'subcategorySlug' | 'state' | 'lga' | 'images'
  >
>;

export async function updateListing(id: string, patch: ListingEditableFields): Promise<Listing> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.priceType !== undefined) row.price_type = patch.priceType;
    if (patch.condition !== undefined) row.condition = patch.condition;
    if (patch.categorySlug !== undefined) row.category_slug = patch.categorySlug;
    if (patch.subcategorySlug !== undefined) row.subcategory_slug = patch.subcategorySlug;
    if (patch.state !== undefined) row.state = patch.state;
    if (patch.lga !== undefined) row.lga = patch.lga;
    if (patch.images !== undefined) row.images = patch.images;

    const { data, error } = await supabase.from('listings').update(row).eq('id', id).select().single();
    if (error || !data) throw new Error(error?.message ?? 'Could not update listing.');
    return rowToListing(data as ListingRow);
  }

  const local = getLocalListings();
  const index = local.findIndex((l) => l.id === id);
  if (index === -1) {
    throw new Error('This listing cannot be edited (not found among your locally-created listings).');
  }
  const updated: Listing = { ...local[index], ...patch };
  local[index] = updated;
  saveLocalListings(local);
  return updated;
}
