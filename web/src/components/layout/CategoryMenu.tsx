'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CATEGORY_ICONS } from '@/lib/category-icons';

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const { data: categories } = useCategories();
  const active = categories?.find((c) => c.slug === activeSlug) ?? categories?.[0];

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
      >
        <LayoutGrid className="h-4 w-4" />
        All Categories
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && categories && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-2 flex w-[560px] overflow-hidden rounded-xl border border-surface-border bg-white shadow-popover">
            <ul className="w-56 border-r border-surface-border py-2">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.icon];
                return (
                  <li key={cat.slug}>
                    <Link
                      href={`/category/${cat.slug}`}
                      onMouseEnter={() => setActiveSlug(cat.slug)}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-brand" />
                        {cat.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="flex-1 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">{active?.name}</p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {active?.subcategories.map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      href={`/category/${active.slug}?sub=${sub.slug}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-2 py-1 text-sm text-ink-muted hover:bg-surface-muted hover:text-brand-dark"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
