'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { initialsOf } from '@/lib/format';

export function SellerAvatar({
  name,
  avatarUrl,
  className,
  textClassName,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setFailed(true)}
        className={clsx('shrink-0 rounded-full object-cover', className ?? 'h-6 w-6')}
      />
    );
  }

  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-brand-dark',
        className ?? 'h-6 w-6',
        textClassName ?? 'text-[10px]',
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
