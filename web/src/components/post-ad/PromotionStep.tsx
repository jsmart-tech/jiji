'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import { usePostAdStore } from '@/store/usePostAdStore';
import type { PromotionTier } from '@shared/types';

const PLANS: { tier: PromotionTier; label: string; price: string; perks: string[] }[] = [
  { tier: 'NONE', label: 'Free Listing', price: '₦0', perks: ['Standard placement', 'Listed for 30 days'] },
  { tier: 'FEATURED', label: 'Featured', price: '₦1,000', perks: ['Homepage placement', 'Bold title', '30 days'] },
  { tier: 'TOP_AD', label: 'Top Ad', price: '₦2,500', perks: ['Top of category', 'Bold + colored title', '30 days'] },
  { tier: 'VIP', label: 'VIP', price: '₦5,000', perks: ['Top of search & category', 'VIP badge', '60 days'] },
];

export function PromotionStep() {
  const { draft, update } = usePostAdStore();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink">Boost your ad (optional)</p>
      {PLANS.map((plan) => {
        const selected = draft.promotionTier === plan.tier;
        return (
          <button
            key={plan.tier}
            type="button"
            onClick={() => update({ promotionTier: plan.tier })}
            className={clsx(
              'flex items-center justify-between gap-3 rounded-xl border p-4 text-left',
              selected ? 'border-brand bg-brand-light' : 'border-surface-border bg-white hover:bg-surface-muted',
            )}
          >
            <div>
              <p className="flex items-center gap-2 font-semibold text-ink">
                {plan.label}
                {plan.tier !== 'NONE' && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-ink">VIP</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">{plan.perks.join(' · ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-ink">{plan.price}</span>
              <span className={clsx('flex h-5 w-5 items-center justify-center rounded-full border-2', selected ? 'border-brand bg-brand text-white' : 'border-surface-border')}>
                {selected && <Check className="h-3 w-3" />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
