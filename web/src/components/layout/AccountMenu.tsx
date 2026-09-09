'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Heart, Settings, LogOut, LogIn, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { NavAvatar } from './NavAvatar';

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-muted"
      >
        <NavAvatar />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-surface-border bg-white p-2 shadow-popover">
            {user ? (
              <>
                <MenuLink href="/account?tab=adverts" icon={ClipboardList} label="My Adverts" onClick={() => setOpen(false)} />
                <MenuLink href="/account?tab=saved" icon={Heart} label="Saved Ads" onClick={() => setOpen(false)} />
                <MenuLink href="/account?tab=settings" icon={Settings} label="Settings" onClick={() => setOpen(false)} />
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    router.push('/');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </>
            ) : (
              <MenuLink href="/account" icon={LogIn} label="Log In / Sign Up" onClick={() => setOpen(false)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
