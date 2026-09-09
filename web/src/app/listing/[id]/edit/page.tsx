'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useListing, useUpdateListing } from '@/hooks/useListings';
import { useAuthStore } from '@/store/useAuthStore';
import { usePostAdStore } from '@/store/usePostAdStore';
import { CategoryStep } from '@/components/post-ad/CategoryStep';
import { PhotosStep } from '@/components/post-ad/PhotosStep';
import { DetailsStep } from '@/components/post-ad/DetailsStep';
import { LocationStep } from '@/components/post-ad/LocationStep';
import { Button } from '@/components/ui/Button';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id);
  const { user, hydrated } = useAuthStore();
  const { draft, update, reset } = usePostAdStore();
  const updateListing = useUpdateListing(id);
  const [initialized, setInitialized] = useState(false);

  // Load the listing's current values into the shared post-ad draft once,
  // reusing the exact same step components the post-ad wizard uses.
  useEffect(() => {
    if (listing && !initialized) {
      update({
        categorySlug: listing.categorySlug,
        subcategorySlug: listing.subcategorySlug ?? null,
        images: listing.images,
        title: listing.title,
        description: listing.description,
        price: listing.price !== null ? String(listing.price) : '',
        priceType: listing.priceType,
        condition: listing.condition,
        state: listing.state,
        lga: listing.lga,
      });
      setInitialized(true);
    }
  }, [listing, initialized, update]);

  // Clear the shared draft on the way out so it doesn't leak into a later
  // "Post an Ad" session.
  useEffect(() => reset, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated || isLoading || (listing && !initialized)) {
    return <p className="py-16 text-center text-sm text-ink-muted">Loading…</p>;
  }
  if (!listing) {
    return <p className="py-16 text-center text-sm text-ink-muted">This listing could not be found.</p>;
  }
  if (!user || listing.sellerId !== user.id) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white py-16 text-center">
        <p className="text-sm font-semibold text-ink">You can only edit your own listings.</p>
        <Button onClick={() => router.push(`/listing/${id}`)}>Back to Listing</Button>
      </div>
    );
  }

  const canSave = draft.title.trim().length > 2 && !!draft.categorySlug && !!draft.state && !!draft.lga;

  function handleSave() {
    updateListing.mutate(
      {
        title: draft.title,
        description: draft.description,
        price: draft.priceType === 'FREE' ? 0 : draft.priceType === 'ON_REQUEST' ? null : Number(draft.price),
        priceType: draft.priceType,
        condition: draft.condition,
        categorySlug: draft.categorySlug!,
        subcategorySlug: draft.subcategorySlug ?? undefined,
        state: draft.state,
        lga: draft.lga,
        images: draft.images,
      },
      {
        onSuccess: () => {
          reset();
          router.push(`/listing/${id}`);
        },
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/listing/${id}`)}
          aria-label="Back"
          className="rounded-full p-1.5 hover:bg-surface-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-ink">Edit Listing</h1>
      </div>

      <div className="flex flex-col gap-8 rounded-2xl border border-surface-border bg-white p-4 sm:p-6">
        <CategoryStep />
        <PhotosStep />
        <DetailsStep />
        <LocationStep />
      </div>

      <Button size="lg" onClick={handleSave} disabled={!canSave} loading={updateListing.isPending} className="w-full">
        {updateListing.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
      {updateListing.isError && (
        <p className="text-center text-sm text-danger">{(updateListing.error as Error).message}</p>
      )}
    </div>
  );
}
