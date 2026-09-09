'use client';

import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { useFavoritesStore } from '@/store/useFavoritesStore';

export function FavoriteButton({ listingId, className }: { listingId: string; className?: string }) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(listingId));
  const toggle = useFavoritesStore((s) => s.toggle);

  return (
    <button
      type="button"
      aria-label={isFavorite ? 'Remove from saved listings' : 'Save listing'}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(listingId);
      }}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90',
        className,
      )}
    >
      <Heart
        className={clsx('h-4 w-4', isFavorite ? 'fill-brand text-brand' : 'text-ink-muted')}
        strokeWidth={2}
      />
    </button>
  );
}
