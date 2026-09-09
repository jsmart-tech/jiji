'use client';

import { useState } from 'react';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import type { Category, Listing } from '@shared/types';
import clsx from 'clsx';

// A palette keyed by category so listings without a (working) photo still
// read as distinct, branded tiles rather than identical grey boxes.
const CATEGORY_TINTS: Record<string, string> = {
  vehicles: 'bg-orange-50 text-orange-500',
  'real-estate': 'bg-emerald-50 text-emerald-600',
  'mobile-phones': 'bg-indigo-50 text-indigo-500',
  electronics: 'bg-sky-50 text-sky-500',
  fashion: 'bg-pink-50 text-pink-500',
  jobs: 'bg-lime-50 text-lime-600',
  'home-furniture': 'bg-amber-50 text-amber-600',
  'health-beauty': 'bg-rose-50 text-rose-500',
  services: 'bg-violet-50 text-violet-500',
};

export function ListingThumb({
  listing,
  category,
  className,
  iconClassName,
}: {
  listing: Pick<Listing, 'images' | 'categorySlug' | 'title'>;
  category?: Category;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (listing.images.length > 0 && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={listing.images[0]}
        alt={listing.title}
        className={clsx('h-full w-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  const Icon = category ? CATEGORY_ICONS[category.icon] : CATEGORY_ICONS.laptop;
  const tint = CATEGORY_TINTS[listing.categorySlug] ?? 'bg-surface-muted text-ink-muted';

  return (
    <div className={clsx('flex h-full w-full items-center justify-center', tint, className)}>
      <Icon className={clsx('h-8 w-8', iconClassName)} strokeWidth={1.5} />
    </div>
  );
}
