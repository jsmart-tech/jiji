'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export function EditListingButton({ listingId, className }: { listingId: string; className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Edit listing"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/listing/${listingId}/edit`);
      }}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90',
        className,
      )}
    >
      <Pencil className="h-4 w-4 text-ink" strokeWidth={2} />
    </button>
  );
}
