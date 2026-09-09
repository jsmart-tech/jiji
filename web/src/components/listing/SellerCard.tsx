'use client';

import { useState } from 'react';
import { Star, ShieldCheck, Phone, MessageCircle } from 'lucide-react';
import type { Listing } from '@shared/types';
import { initialsOf } from '@/lib/format';
import { Button } from '@/components/ui/Button';

export function SellerCard({
  listing,
  onStartChat,
  chatPending,
}: {
  listing: Listing;
  onStartChat: () => void;
  chatPending: boolean;
}) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-base font-bold text-brand-dark">
          {initialsOf(listing.sellerName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            {listing.sellerName}
            {listing.isVerifiedSeller && <ShieldCheck className="h-4 w-4 text-brand" aria-label="Verified seller" />}
          </p>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {listing.sellerRating.toFixed(1)} rating &middot; usually replies within an hour
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setPhoneRevealed(true)}
        >
          <Phone className="h-4 w-4" />
          {phoneRevealed ? listing.sellerPhone : 'Show Phone Number'}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onStartChat} disabled={chatPending}>
          <MessageCircle className="h-4 w-4" />
          {chatPending ? 'Starting…' : 'Start Chat'}
        </Button>
      </div>
    </div>
  );
}
