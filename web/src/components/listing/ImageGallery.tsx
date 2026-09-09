'use client';

import { useState } from 'react';
import type { Category, Listing } from '@shared/types';
import { ListingThumb } from '@/components/ui/ListingThumb';
import clsx from 'clsx';

export function ImageGallery({ listing, category }: { listing: Listing; category?: Category }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const images = listing.images;

  function markFailed(index: number) {
    setFailed((prev) => new Set(prev).add(index));
  }

  const activeImageOk = images.length > 0 && !failed.has(active);

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-surface-border bg-surface-muted">
        {activeImageOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[active]}
            alt={listing.title}
            className="h-full w-full object-cover"
            onError={() => markFailed(active)}
          />
        ) : (
          <ListingThumb
            listing={{ images: [], categorySlug: listing.categorySlug, title: listing.title }}
            category={category}
            iconClassName="h-16 w-16"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={clsx(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-muted',
                active === i ? 'border-brand' : 'border-transparent',
              )}
            >
              {failed.has(i) ? (
                <div className="h-full w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" onError={() => markFailed(i)} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
