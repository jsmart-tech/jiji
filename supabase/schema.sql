-- =============================================================================
-- Jsmart — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL Editor
-- → New query → paste this whole file → Run). Safe to re-run: every statement
-- is idempotent (create-if-not-exists / on-conflict-do-nothing).
-- =============================================================================

create extension if not exists pgcrypto;

-- ─── Profiles ────────────────────────────────────────────────────────────
-- One row per auth.users row. Holds the public-facing profile fields that
-- the app's `User` type needs (see shared/src/types/index.ts).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role text not null default 'BUYER' check (role in ('BUYER','SELLER','ADMIN','SUPER_ADMIN')),
  is_verified_seller boolean not null default false,
  rating numeric not null default 0,
  member_since timestamptz not null default now(),
  state text,
  lga text
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone, state, lga)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'lga'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Categories ──────────────────────────────────────────────────────────
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  icon text not null,
  sort_order int not null default 0
);
alter table public.categories enable row level security;
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone" on public.categories for select using (true);

create table if not exists public.subcategories (
  category_slug text not null references public.categories(slug) on delete cascade,
  slug text not null,
  name text not null,
  primary key (category_slug, slug)
);
alter table public.subcategories enable row level security;
drop policy if exists "Subcategories are viewable by everyone" on public.subcategories;
create policy "Subcategories are viewable by everyone" on public.subcategories for select using (true);

-- ─── Listings ────────────────────────────────────────────────────────────
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text not null default '',
  price numeric,
  currency text not null default 'NGN',
  price_type text not null default 'FIXED' check (price_type in ('FIXED','NEGOTIABLE','FREE','ON_REQUEST')),
  condition text not null default 'USED' check (condition in ('NEW','USED','REFURBISHED')),
  status text not null default 'ACTIVE' check (status in ('DRAFT','ACTIVE','SOLD','EXPIRED','PENDING_REVIEW')),
  promotion_tier text not null default 'NONE' check (promotion_tier in ('NONE','FEATURED','TOP_AD','VIP')),
  category_slug text not null references public.categories(slug),
  subcategory_slug text,
  state text not null,
  lga text not null,
  images text[] not null default '{}',
  attributes jsonb not null default '[]',
  seller_id uuid not null references public.profiles(id) on delete cascade,
  seller_name text not null,
  seller_rating numeric not null default 0,
  is_verified_seller boolean not null default false,
  seller_phone text not null default '',
  view_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.listings enable row level security;

drop policy if exists "Listings are viewable by everyone" on public.listings;
create policy "Listings are viewable by everyone"
  on public.listings for select using (true);
drop policy if exists "Sellers can insert their own listings" on public.listings;
create policy "Sellers can insert their own listings"
  on public.listings for insert with check (auth.uid() = seller_id);
drop policy if exists "Sellers can update their own listings" on public.listings;
create policy "Sellers can update their own listings"
  on public.listings for update using (auth.uid() = seller_id);
drop policy if exists "Sellers can delete their own listings" on public.listings;
create policy "Sellers can delete their own listings"
  on public.listings for delete using (auth.uid() = seller_id);
drop policy if exists "Admins can update any listing" on public.listings;
create policy "Admins can update any listing"
  on public.listings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN','SUPER_ADMIN'))
  );

create index if not exists listings_category_idx on public.listings (category_slug);
create index if not exists listings_seller_idx on public.listings (seller_id);
create index if not exists listings_created_idx on public.listings (created_at desc);

-- ─── Chat ────────────────────────────────────────────────────────────────
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
alter table public.chat_rooms enable row level security;
drop policy if exists "Participants can view their chat rooms" on public.chat_rooms;
create policy "Participants can view their chat rooms"
  on public.chat_rooms for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
drop policy if exists "Buyers can start a chat room" on public.chat_rooms;
create policy "Buyers can start a chat room"
  on public.chat_rooms for insert with check (auth.uid() = buyer_id);
drop policy if exists "Participants can update their chat rooms" on public.chat_rooms;
create policy "Participants can update their chat rooms"
  on public.chat_rooms for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'TEXT' check (type in ('TEXT','IMAGE','LISTING_SHARE','SYSTEM')),
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
drop policy if exists "Participants can view messages in their rooms" on public.chat_messages;
create policy "Participants can view messages in their rooms"
  on public.chat_messages for select using (
    exists (select 1 from public.chat_rooms r where r.id = room_id and (auth.uid() = r.buyer_id or auth.uid() = r.seller_id))
  );
drop policy if exists "Participants can send messages in their rooms" on public.chat_messages;
create policy "Participants can send messages in their rooms"
  on public.chat_messages for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from public.chat_rooms r where r.id = room_id and (auth.uid() = r.buyer_id or auth.uid() = r.seller_id))
  );

-- ─── Seed: categories & subcategories ───────────────────────────────────
insert into public.categories (slug, name, icon, sort_order) values
  ('vehicles','Vehicles','car',1),
  ('real-estate','Real Estate','home',2),
  ('mobile-phones','Mobile Phones & Tablets','smartphone',3),
  ('electronics','Electronics','laptop',4),
  ('fashion','Fashion','shirt',5),
  ('jobs','Jobs','briefcase',6),
  ('home-furniture','Home & Furniture','sofa',7),
  ('health-beauty','Health & Beauty','sparkles',8),
  ('services','Services','wrench',9)
on conflict (slug) do nothing;

insert into public.subcategories (category_slug, slug, name) values
  ('vehicles','cars','Cars'),
  ('vehicles','buses-microbuses','Buses & Microbuses'),
  ('vehicles','motorcycles-scooters','Motorcycles & Scooters'),
  ('vehicles','trucks-trailers','Trucks & Trailers'),
  ('vehicles','vehicle-parts','Vehicle Parts & Accessories'),
  ('real-estate','houses-apartments-rent','Houses & Apartments for Rent'),
  ('real-estate','houses-apartments-sale','Houses & Apartments for Sale'),
  ('real-estate','land-plots','Land & Plots for Sale'),
  ('real-estate','commercial-property','Commercial Property'),
  ('real-estate','short-let','Short-let Apartments'),
  ('mobile-phones','smartphones','Smartphones'),
  ('mobile-phones','tablets','Tablets'),
  ('mobile-phones','phone-accessories','Phone Accessories'),
  ('mobile-phones','mobile-services','Mobile Phone Services'),
  ('electronics','tvs','TVs'),
  ('electronics','audio-music','Audio & Music Equipment'),
  ('electronics','computers-laptops','Computers & Laptops'),
  ('electronics','cameras','Cameras'),
  ('electronics','video-games','Video Games & Consoles'),
  ('fashion','womens-clothing','Women''s Clothing'),
  ('fashion','mens-clothing','Men''s Clothing'),
  ('fashion','shoes','Shoes'),
  ('fashion','bags','Bags'),
  ('fashion','jewellery-watches','Jewellery & Watches'),
  ('jobs','sales-marketing','Sales & Marketing'),
  ('jobs','it-software','IT & Software'),
  ('jobs','customer-service','Customer Service'),
  ('jobs','transportation','Transportation'),
  ('jobs','remote-jobs','Remote Jobs'),
  ('home-furniture','furniture','Furniture'),
  ('home-furniture','home-appliances','Home Appliances'),
  ('home-furniture','kitchen-dining','Kitchen & Dining'),
  ('home-furniture','home-decor','Home Decor'),
  ('health-beauty','skin-care','Skin Care'),
  ('health-beauty','makeup','Makeup'),
  ('health-beauty','hair','Hair'),
  ('health-beauty','fitness-equipment','Fitness Equipment'),
  ('services','repair-services','Repair Services'),
  ('services','cleaning-services','Cleaning Services'),
  ('services','event-services','Event Services'),
  ('services','tutoring-classes','Tutoring & Classes')
on conflict (category_slug, slug) do nothing;
