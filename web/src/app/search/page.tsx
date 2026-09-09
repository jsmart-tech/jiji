'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import { ListingGrid } from '@/components/listing/ListingGrid';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { data: listings, isLoading } = useListings({ q });

  if (!q) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-ink-muted">
        <Search className="h-10 w-10" strokeWidth={1.5} />
        <p className="text-sm font-medium">Search Jiji for cars, phones, property and more.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm text-ink-muted">
        Results for <span className="font-semibold text-ink">&ldquo;{q}&rdquo;</span>
      </h1>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-muted">Searching…</p>
      ) : (
        <ListingGrid listings={listings ?? []} emptyLabel={`No results for "${q}". Try a different keyword.`} />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-ink-muted">Loading…</p>}>
      <SearchResults />
    </Suspense>
  );
}
