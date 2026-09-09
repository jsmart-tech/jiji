'use client';

import { User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { initialsOf } from '@/lib/format';
import clsx from 'clsx';

/**
 * Shows the signed-in user's photo (or initials) wherever the nav would
 * otherwise show a generic account icon — desktop header and mobile bottom
 * nav both use this so "Account" reflects who's actually logged in.
 */
export function NavAvatar({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <User className={iconClassName ?? 'h-5 w-5 text-ink'} />;
  }

  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={clsx('rounded-full object-cover', className ?? 'h-6 w-6')}
      />
    );
  }

  return (
    <span
      className={clsx(
        'flex items-center justify-center rounded-full bg-brand-light font-bold text-brand-dark',
        className ?? 'h-6 w-6 text-[10px]',
      )}
    >
      {initialsOf(user.name)}
    </span>
  );
}
