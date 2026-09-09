import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { CategoryMenu } from './CategoryMenu';
import { SearchBar } from './SearchBar';
import { AccountMenu } from './AccountMenu';
import { Button } from '@/components/ui/Button';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0 text-2xl font-extrabold tracking-tight text-brand">
            Jiji
          </Link>

          <LocationPicker />

          <Suspense fallback={<div className="h-[42px] flex-1 rounded-lg bg-surface-muted" />}>
            <SearchBar className="flex-1" />
          </Suspense>

          <CategoryMenu />

          <Link href="/post-ad" className="hidden sm:block">
            <Button variant="accent" className="shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={3} />
              SELL
            </Button>
          </Link>

          <Link
            href="/chat"
            className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-surface-muted sm:flex"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5 text-ink" />
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
