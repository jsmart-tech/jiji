'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CATEGORY_ICONS } from '@/lib/category-icons';

export default function CategoriesPage() {
  const { data: categories } = useCategories();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">All Categories</h1>
      <div className="flex flex-col divide-y divide-surface-border overflow-hidden rounded-2xl border border-surface-border bg-white">
        {(categories ?? []).map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon];
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-muted"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{cat.name}</span>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
