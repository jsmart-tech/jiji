'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { CATEGORY_ICONS } from '@/lib/category-icons';

export function CategoryStrip() {
  const { data: categories } = useCategories();

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-9">
      {(categories ?? []).map((cat) => {
        const Icon = CATEGORY_ICONS[cat.icon];
        return (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="flex flex-col items-center gap-2 rounded-xl p-2 text-center hover:bg-surface-muted"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand-dark">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="text-[11px] font-medium leading-tight text-ink">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
