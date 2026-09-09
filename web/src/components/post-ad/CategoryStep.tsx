'use client';

import clsx from 'clsx';
import { useCategories } from '@/hooks/useCategories';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { usePostAdStore } from '@/store/usePostAdStore';

export function CategoryStep() {
  const { data: categories } = useCategories();
  const { draft, update } = usePostAdStore();
  const activeCategory = categories?.find((c) => c.slug === draft.categorySlug);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">What are you selling?</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {(categories ?? []).map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon];
            const selected = cat.slug === draft.categorySlug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => update({ categorySlug: cat.slug, subcategorySlug: null })}
                className={clsx(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center',
                  selected ? 'border-brand bg-brand-light' : 'border-surface-border bg-white hover:bg-surface-muted',
                )}
              >
                <Icon className={clsx('h-5 w-5', selected ? 'text-brand-dark' : 'text-ink-muted')} strokeWidth={1.75} />
                <span className="text-[11px] font-medium leading-tight text-ink">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory && (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Choose a subcategory</p>
          <div className="flex flex-wrap gap-2">
            {activeCategory.subcategories.map((sub) => {
              const selected = sub.slug === draft.subcategorySlug;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => update({ subcategorySlug: sub.slug })}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold',
                    selected ? 'border-brand bg-brand-light text-brand-dark' : 'border-surface-border bg-white text-ink-muted',
                  )}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
