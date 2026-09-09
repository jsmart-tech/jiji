'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { initialsOf } from '@/lib/format';
import type { User } from '@shared/types';

export function AvatarUpload({ user }: { user: User }) {
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await updateAvatar(reader.result);
      }
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative h-16 w-16">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-xl font-bold text-brand-dark">
          {initialsOf(user.name)}
        </span>
      )}

      <button
        type="button"
        aria-label="Change profile photo"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-sm disabled:opacity-60"
      >
        <Camera className="h-3 w-3" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
