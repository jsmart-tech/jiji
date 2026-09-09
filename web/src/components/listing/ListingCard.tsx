'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Listing } from '@shared/types';
import { useCategories } from '@/hooks/useCategories';
import { formatPrice, timeAgo } from '@/lib/format';
import { ListingThumb } from '@/components/ui/ListingThumb';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { EditListingButton } from '@/components/ui/EditListingButton';
import { PromotionBadge } from '@/components/ui/Badge';

export function ListingCard({ listing, compact, ownerMode }: { listing: Listing; compact?: boolean; ownerMode?: boolean }) {
  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.slug === listing.categorySlug);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition-shadow hover:shadow-popover"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <ListingThumb listing={listing} category={category} className="transition-transform duration-300 group-hover:scale-105" />
        {listing.promotionTier !== 'NONE' && (
          <div className="absolute left-2 top-2">
            <PromotionBadge tier={listing.promotionTier} />
          </div>
        )}
        {ownerMode ? (
          <EditListingButton listingId={listing.id} className="absolute right-2 top-2" />
        ) : (
          <FavoriteButton listingId={listing.id} className="absolute right-2 top-2" />
        )}
      </div>
      <div className={compact ? 'flex flex-col gap-1 p-2.5' : 'flex flex-col gap-1.5 p-3'}>
        <p className="font-mono text-[15px] font-bold text-ink">
          {formatPrice(listing.price, listing.priceType, listing.currency)}
        </p>
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{listing.title}</p>
        <p className="flex items-center gap-1 text-[11px] text-ink-muted">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.lga}, {listing.state}</span>
          <span className="shrink-0">&middot; {timeAgo(listing.createdAt)}</span>
        </p>
      </div>
    </Link>
  );
}
