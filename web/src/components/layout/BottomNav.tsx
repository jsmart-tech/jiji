'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Plus, MessageCircle, User } from 'lucide-react';
import clsx from 'clsx';
import { NavAvatar } from './NavAvatar';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home, variant: 'default' },
  { href: '/categories', label: 'Categories', icon: LayoutGrid, variant: 'default' },
  { href: '/post-ad', label: 'Sell', icon: Plus, variant: 'sell' },
  { href: '/chat', label: 'Chat', icon: MessageCircle, variant: 'default' },
  { href: '/account', label: 'Account', icon: User, variant: 'account' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Hide while inside an active chat thread — the fixed nav bar would
  // otherwise overlap the message input at the bottom of the screen, and no
  // chat app keeps tab navigation visible while you're mid-conversation.
  if (/^\/chat\/[^/]+/.test(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-surface-border bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      {ITEMS.map(({ href, label, icon: Icon, variant }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

        if (variant === 'sell') {
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-2">
              <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-popover">
                <Icon className="h-5 w-5 text-ink" strokeWidth={2.5} />
              </span>
              <span className="text-[10px] font-bold text-ink">{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={clsx('flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-semibold', active ? 'text-brand' : 'text-ink-muted')}
          >
            {variant === 'account' ? (
              <NavAvatar
                className={clsx('h-5 w-5 text-[8px]', active && 'ring-2 ring-brand')}
                iconClassName="h-5 w-5"
              />
            ) : (
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            )}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
