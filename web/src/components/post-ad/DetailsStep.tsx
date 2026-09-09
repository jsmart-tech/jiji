'use client';

import type { ReactNode } from 'react';
import { usePostAdStore } from '@/store/usePostAdStore';
import type { ListingCondition, PriceType } from '@shared/types';

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'NEGOTIABLE', label: 'Negotiable' },
  { value: 'FREE', label: 'Free' },
  { value: 'ON_REQUEST', label: 'On Request' },
];

const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'NEW', label: 'Brand New' },
  { value: 'USED', label: 'Used' },
  { value: 'REFURBISHED', label: 'Refurbished' },
];

export function DetailsStep() {
  const { draft, update } = usePostAdStore();

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          maxLength={70}
          placeholder="e.g. Toyota Camry 2015, Full Option"
          className="input"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={4}
          placeholder="Describe the condition, features and reason for selling…"
          className="input resize-y"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₦)">
          <input
            type="number"
            min={0}
            value={draft.price}
            onChange={(e) => update({ price: e.target.value })}
            placeholder="0"
            className="input"
          />
        </Field>
        <Field label="Price Type">
          <select
            value={draft.priceType}
            onChange={(e) => update({ priceType: e.target.value as PriceType })}
            className="input"
          >
            {PRICE_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Condition">
        <div className="flex gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => update({ condition: c.value })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                draft.condition === c.value ? 'border-brand bg-brand-light text-brand-dark' : 'border-surface-border bg-white text-ink-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
