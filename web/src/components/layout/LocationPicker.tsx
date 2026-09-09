'use client';

import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { STATES, ALL_NIGERIA } from '@shared/mock/locations.mock';
import { useUiStore } from '@/store/useUiStore';

export function LocationPicker() {
  const [open, setOpen] = useState(false);
  const { state, lga, setLocation } = useUiStore();

  const label = lga ? `${lga}, ${state}` : state;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
      >
        <MapPin className="h-4 w-4 text-brand" />
        <span className="hidden max-w-[140px] truncate sm:inline">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-2 w-72 rounded-xl border border-surface-border bg-white p-2 shadow-popover">
            <button
              type="button"
              onClick={() => { setLocation(ALL_NIGERIA, null); setOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-brand-light"
            >
              {ALL_NIGERIA}
            </button>
            <div className="max-h-72 overflow-y-auto">
              {STATES.map((s) => (
                <div key={s.name} className="mt-1">
                  <button
                    type="button"
                    onClick={() => { setLocation(s.name, null); setOpen(false); }}
                    className="w-full rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-ink hover:bg-surface-muted"
                  >
                    {s.name}
                  </button>
                  <div className="flex flex-wrap gap-1 px-3 pb-1 pt-0.5">
                    {s.lgas.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => { setLocation(s.name, l); setOpen(false); }}
                        className="rounded-md bg-surface-muted px-2 py-1 text-xs text-ink-muted hover:bg-brand-light hover:text-brand-dark"
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
