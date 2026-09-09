'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { usePostAdStore } from '@/store/usePostAdStore';
import { useCreateListing } from '@/hooks/useListings';
import { useAuthStore } from '@/store/useAuthStore';
import { StepIndicator } from '@/components/post-ad/StepIndicator';
import { CategoryStep } from '@/components/post-ad/CategoryStep';
import { PhotosStep } from '@/components/post-ad/PhotosStep';
import { DetailsStep } from '@/components/post-ad/DetailsStep';
import { LocationStep } from '@/components/post-ad/LocationStep';
import { PromotionStep } from '@/components/post-ad/PromotionStep';
import { Button } from '@/components/ui/Button';

const STEP_COMPONENTS = [CategoryStep, PhotosStep, DetailsStep, LocationStep, PromotionStep];

function canAdvance(step: number, draft: ReturnType<typeof usePostAdStore.getState>['draft']): boolean {
  switch (step) {
    case 0: return !!draft.categorySlug;
    case 1: return true;
    case 2: return draft.title.trim().length > 2 && draft.description.trim().length > 5 && (draft.priceType === 'ON_REQUEST' || draft.priceType === 'FREE' || Number(draft.price) > 0);
    case 3: return !!draft.state && !!draft.lga;
    default: return true;
  }
}

export default function PostAdPage() {
  const router = useRouter();
  const { step, draft, setStep, update, reset } = usePostAdStore();
  const { user, hydrated } = useAuthStore();
  const createListing = useCreateListing();
  const StepComponent = STEP_COMPONENTS[step];

  useEffect(() => reset, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Default a new ad's location to the seller's registered location, so
  // buyers can already see where to pick items up — still editable per ad.
  useEffect(() => {
    if (user?.state && !draft.state) {
      update({ state: user.state, lga: user.lga ?? '' });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (hydrated && !user) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white py-16 text-center">
        <p className="text-sm font-semibold text-ink">Log in to post an ad</p>
        <p className="max-w-xs text-sm text-ink-muted">Create a free account to start selling on Jiji.</p>
        <Button onClick={() => router.push('/account')}>Go to Login</Button>
      </div>
    );
  }

  function handleNext() {
    if (step < STEP_COMPONENTS.length - 1) {
      setStep(step + 1);
      return;
    }
    if (!user) return;
    createListing.mutate(
      {
        slug: `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        title: draft.title,
        description: draft.description,
        price: draft.priceType === 'FREE' ? 0 : draft.priceType === 'ON_REQUEST' ? null : Number(draft.price),
        priceType: draft.priceType,
        condition: draft.condition,
        promotionTier: draft.promotionTier,
        categorySlug: draft.categorySlug!,
        subcategorySlug: draft.subcategorySlug ?? undefined,
        state: draft.state,
        lga: draft.lga,
        images: draft.images,
        attributes: [],
        sellerId: user.id,
        sellerName: user.name,
        sellerPhone: user.phone,
      },
      {
        onSuccess: (listing) => {
          reset();
          router.push(`/listing/${listing.id}`);
        },
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} aria-label="Back" className="rounded-full p-1.5 hover:bg-surface-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-ink">Post an Ad</h1>
      </div>

      <StepIndicator step={step} />

      <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-6">
        <StepComponent />
      </div>

      <Button
        size="lg"
        onClick={handleNext}
        disabled={!canAdvance(step, draft) || createListing.isPending}
        className="w-full"
      >
        {step === STEP_COMPONENTS.length - 1
          ? createListing.isPending ? 'Publishing…' : 'Publish Listing'
          : 'Continue'}
      </Button>
    </div>
  );
}
