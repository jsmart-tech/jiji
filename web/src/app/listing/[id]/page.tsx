'use client';

import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Eye, Pencil } from 'lucide-react';
import { useListing } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCategories';
import { useStartChat } from '@/hooks/useChat';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice, timeAgo } from '@/lib/format';
import { ImageGallery } from '@/components/listing/ImageGallery';
import { SellerCard } from '@/components/listing/SellerCard';
import { SafetyTipBox } from '@/components/listing/SafetyTipBox';
import { ConditionBadge, PromotionBadge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { Button } from '@/components/ui/Button';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const { data: categories } = useCategories();
  const startChat = useStartChat();
  const currentUser = useAuthStore((s) => s.user);

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-ink-muted">Loading listing…</p>;
  }
  if (!listing) {
    return <p className="py-16 text-center text-sm text-ink-muted">This listing could not be found. It may have been removed.</p>;
  }

  const category = categories?.find((c) => c.slug === listing.categorySlug);
  const isOwner = currentUser?.id === listing.sellerId;

  function handleStartChat() {
    startChat.mutate(
      { listingId: listing!.id, sellerName: listing!.sellerName, sellerId: listing!.sellerId },
      { onSuccess: (room) => router.push(`/chat/${room.id}`) },
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <ImageGallery listing={listing} category={category} />

        <div>
          <div className="mb-2 flex items-center gap-2">
            <PromotionBadge tier={listing.promotionTier} />
            <ConditionBadge condition={listing.condition} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-ink">{listing.title}</h1>
            <FavoriteButton listingId={listing.id} className="static shrink-0 shadow-none ring-1 ring-surface-border" />
          </div>
          <p className="mt-1 font-mono text-2xl font-extrabold text-brand-dark">
            {formatPrice(listing.price, listing.priceType, listing.currency)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {listing.lga}, {listing.state}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {timeAgo(listing.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {listing.viewCount} views</span>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-ink">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{listing.description}</p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-ink">Details</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {listing.attributes.map((attr) => (
              <div key={attr.key} className="rounded-xl border border-surface-border bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{attr.key}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{attr.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
        {isOwner ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4">
            <p className="text-sm font-semibold text-ink">This is your listing</p>
            <p className="text-xs text-ink-muted">
              Buyers will see your phone number and can start a chat with you from this page.
            </p>
            <Button onClick={() => router.push(`/listing/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit Listing
            </Button>
          </div>
        ) : (
          <SellerCard listing={listing} onStartChat={handleStartChat} chatPending={startChat.isPending} />
        )}
        <SafetyTipBox />
      </div>
    </div>
  );
}
