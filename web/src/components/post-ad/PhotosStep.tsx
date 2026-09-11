'use client';

import { Camera, X } from 'lucide-react';
import { usePostAdStore } from '@/store/usePostAdStore';
import { resizeImageToDataUrl } from '@/lib/image';

const MAX_PHOTOS = 8;

export function PhotosStep() {
  const { draft, update } = usePostAdStore();

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - draft.images.length);
    files.forEach((file) => {
      resizeImageToDataUrl(file, 1200)
        .then((dataUrl) => {
          usePostAdStore.setState((s) => ({ draft: { ...s.draft, images: [...s.draft.images, dataUrl] } }));
        })
        .catch(() => {
          // Fall back to the original file rather than silently dropping the photo.
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              usePostAdStore.setState((s) => ({ draft: { ...s.draft, images: [...s.draft.images, reader.result as string] } }));
            }
          };
          reader.readAsDataURL(file);
        });
    });
  }

  function removeAt(index: number) {
    update({ images: draft.images.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">
        Add photos <span className="font-normal text-ink-muted">({draft.images.length}/{MAX_PHOTOS})</span>
      </p>
      <p className="mb-3 text-xs text-ink-muted">Listings with clear photos get up to 3x more replies.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {draft.images.map((src, i) => (
          <div key={src.slice(0, 32) + i} className="relative aspect-square overflow-hidden rounded-xl border border-surface-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {draft.images.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-surface-border bg-white text-ink-muted hover:border-brand hover:text-brand">
            <Camera className="h-5 w-5" />
            <span className="text-[11px] font-semibold">Add photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
