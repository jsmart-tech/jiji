import clsx from 'clsx';
import type { ListingCondition, PromotionTier } from '@shared/types';
import { formatCondition } from '@/lib/format';

export function ConditionBadge({ condition }: { condition: ListingCondition }) {
  const isNew = condition === 'NEW';
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
        isNew ? 'bg-brand-light text-brand-dark' : 'bg-surface-muted text-ink-muted',
      )}
    >
      {formatCondition(condition)}
    </span>
  );
}

const TIER_LABEL: Record<Exclude<PromotionTier, 'NONE'>, string> = {
  FEATURED: 'Featured',
  TOP_AD: 'Top Ad',
  VIP: 'VIP',
};

export function PromotionBadge({ tier }: { tier: PromotionTier }) {
  if (tier === 'NONE') return null;
  return (
    <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-ink">
      {TIER_LABEL[tier]}
    </span>
  );
}

export function PendingApprovalBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-ink px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
      Pending Approval
    </span>
  );
}
