'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { getCategoryBySlug } from '@shared/api/categories';
import type { ListingFilters } from '@shared/types';
import { useListings } from '@/hooks/useListings';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { CATEGORY_ICONS } from '@/lib/category-icons';

const SORTS: { value: NonNullable<ListingFilters['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export default function CategoryPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-ink-muted">Loading…</p>}>
      <CategoryPageInner />
    </Suspense>
  );
}

function CategoryPageInner() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sort, setSort] = useState<ListingFilters['sort']>('newest');

  const category = getCategoryBySlug(slug);
  const subcategorySlug = searchParams.get('sub') ?? undefined;

  const { data: listings, isLoading } = useListings({ categorySlug: slug, subcategorySlug, sort });

  if (!category) {
    return <p className="py-16 text-center text-sm text-ink-muted">Category not found.</p>;
  }

  const Icon = CATEGORY_ICONS[category.icon];
  const activeSub = category.subcategories.find((s) => s.slug === subcategorySlug);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h1 className="text-lg font-bold text-ink">{activeSub ? activeSub.name : category.name}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push(`/category/${slug}`)}
          className={clsx(
            'rounded-full border px-3 py-1.5 text-xs font-semibold',
            !subcategorySlug ? 'border-brand bg-brand-light text-brand-dark' : 'border-surface-border bg-white text-ink-muted',
          )}
        >
          All
        </button>
        {category.subcategories.map((sub) => (
          <button
            key={sub.slug}
            type="button"
            onClick={() => router.push(`/category/${slug}?sub=${sub.slug}`)}
            className={clsx(
              'rounded-full border px-3 py-1.5 text-xs font-semibold',
              subcategorySlug === sub.slug ? 'border-brand bg-brand-light text-brand-dark' : 'border-surface-border bg-white text-ink-muted',
            )}
          >
            {sub.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSort(s.value)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-xs font-semibold',
              sort === s.value ? 'bg-ink text-white' : 'bg-white text-ink-muted border border-surface-border',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-muted">Loading listings…</p>
      ) : (
        <ListingGrid
          listings={listings ?? []}
          emptyLabel={`No listings yet in ${activeSub ? activeSub.name : category.name}.`}
        />
      )}
    </div>
  );
}
