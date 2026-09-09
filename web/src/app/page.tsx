'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useListings, useFeaturedListings } from '@/hooks/useListings';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { CategoryStrip } from '@/components/layout/CategoryStrip';
import { HeroCarousel } from '@/components/layout/HeroCarousel';

export default function HomePage() {
  const { data: featured } = useFeaturedListings();
  const { data: recent, isLoading } = useListings({ sort: 'newest' });

  return (
    <div className="flex flex-col gap-8">
      <HeroCarousel />

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Categories</h2>
        <CategoryStrip />
      </section>

      {featured && featured.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Featured Ads</h2>
          </div>
          <ListingGrid listings={featured} />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Recent Listings</h2>
          <Link href="/search" className="flex items-center gap-0.5 text-xs font-semibold text-brand">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-ink-muted">Loading listings…</p>
        ) : (
          <ListingGrid listings={recent ?? []} />
        )}
      </section>
    </div>
  );
}
