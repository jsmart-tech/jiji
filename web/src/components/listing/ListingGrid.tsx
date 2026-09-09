import Link from 'next/link';
import type { Listing } from '@shared/types';
import { ListingCard } from './ListingCard';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ListingGrid({
  listings,
  emptyLabel,
  emptyAction,
  ownerMode,
}: {
  listings: Listing[];
  emptyLabel?: string;
  emptyAction?: { label: string; href: string };
  ownerMode?: boolean;
}) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-ink-muted">
        <PackageSearch className="h-10 w-10" strokeWidth={1.5} />
        <p className="text-sm font-medium">{emptyLabel ?? 'No listings found.'}</p>
        {emptyAction && (
          <Link href={emptyAction.href}>
            <Button size="sm">{emptyAction.label}</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} ownerMode={ownerMode} />
      ))}
    </div>
  );
}
