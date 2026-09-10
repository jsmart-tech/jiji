'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Copy, Check, Mail, ShieldCheck } from 'lucide-react';
import { useListing } from '@/hooks/useListings';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { readLocalStorage, writeLocalStorage } from '@shared/lib/storage';
import { PAYMENT_CONFIG, priceForTier } from '@/lib/payment';

function useCountdown(totalSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return { secondsLeft, label: `${minutes}:${String(seconds).padStart(2, '0')}` };
}

export default function ListingPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(params.id);
  const { user, hydrated } = useAuthStore();
  const { label: countdownLabel, secondsLeft } = useCountdown(PAYMENT_CONFIG.countdownSeconds);
  const [copied, setCopied] = useState(false);
  const [paidClicked, setPaidClicked] = useState(false);

  const storageKey = `jsmart_payment_confirmed_${params.id}`;

  useEffect(() => {
    setPaidClicked(readLocalStorage(storageKey, false));
  }, [storageKey]);

  if (!hydrated || isLoading) return null;

  if (!listing) {
    return (
      <div className="py-16 text-center text-sm text-ink-muted">Listing not found.</div>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  if (!isOwner) {
    return (
      <div className="py-16 text-center text-sm text-ink-muted">
        This payment page belongs to a different ad.
      </div>
    );
  }

  if (listing.promotionTier === 'NONE') {
    router.replace(`/listing/${listing.id}`);
    return null;
  }

  if (listing.status === 'ACTIVE') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white p-8 text-center">
        <ShieldCheck className="h-10 w-10 text-brand" />
        <p className="text-lg font-bold text-ink">Your ad is already live!</p>
        <p className="text-sm text-ink-muted">Payment was approved and your ad has been published.</p>
        <Button onClick={() => router.push(`/listing/${listing.id}`)}>View Listing</Button>
      </div>
    );
  }

  function handlePaidClick() {
    setPaidClicked(true);
    writeLocalStorage(storageKey, true);
    const subject = encodeURIComponent(`Payment evidence — ${listing!.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI've made payment for my ${listing!.promotionTier} ad on Jsmart.\n\n` +
        `Ad title: ${listing!.title}\nAd ID: ${listing!.id}\nAmount: ${priceForTier(listing!.promotionTier)}\n\n` +
        `Please find my payment evidence attached (screenshot or receipt).\n\nThanks!`,
    );
    window.location.href = `mailto:${PAYMENT_CONFIG.adminEmail}?subject=${subject}&body=${body}`;
  }

  function handleCopy() {
    navigator.clipboard?.writeText(PAYMENT_CONFIG.accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (paidClicked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
          <Clock className="h-7 w-7 text-accent-dark" />
        </div>
        <p className="text-lg font-bold text-ink">Approval Pending</p>
        <p className="text-sm text-ink-muted">
          Thanks! We&apos;ve noted your payment. Please wait for the admin to approve your ad — we usually approve
          within {PAYMENT_CONFIG.approvalEtaMinutes} minutes of receiving your payment evidence.
        </p>
        <p className="text-xs text-ink-muted">
          Didn&apos;t send your evidence yet?{' '}
          <button type="button" onClick={handlePaidClick} className="font-semibold text-brand hover:underline">
            Email it again
          </button>
        </p>
        <Button onClick={() => router.push('/account?tab=adverts')} className="w-full">
          View My Adverts
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 rounded-2xl border border-surface-border bg-white p-6">
      <div className="text-center">
        <p className="text-lg font-bold text-ink">Complete Payment</p>
        <p className="text-sm text-ink-muted">
          Pay to publish your <span className="font-semibold text-ink">{listing.promotionTier}</span> ad
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-semibold text-ink">
        <Clock className="h-4 w-4 text-brand" />
        {secondsLeft > 0 ? (
          <span>Time remaining: <span className="font-mono">{countdownLabel}</span></span>
        ) : (
          <span>You can still complete payment below</span>
        )}
      </div>

      <div className="rounded-xl border border-surface-border p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Amount</p>
        <p className="mt-1 font-mono text-xl font-bold text-ink">{priceForTier(listing.promotionTier)}</p>

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">Pay to</p>
        <p className="mt-1 text-sm text-ink">{PAYMENT_CONFIG.bankName} Bank</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="font-mono text-lg font-bold text-ink">{PAYMENT_CONFIG.accountNumber}</p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy account number"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"
          >
            {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-ink-muted">
        Kindly pay to the {PAYMENT_CONFIG.bankName} account above before your ad gets published.
      </p>

      <Button size="lg" onClick={handlePaidClick} className="w-full">
        <Mail className="h-4 w-4" />
        I&apos;ve Made Payment
      </Button>
      <p className="text-center text-[11px] text-ink-muted">
        This opens your email app so you can send payment evidence to {PAYMENT_CONFIG.adminEmail}.
      </p>
    </div>
  );
}
