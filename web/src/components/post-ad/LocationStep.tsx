'use client';

import { STATES } from '@shared/mock/locations.mock';
import { usePostAdStore } from '@/store/usePostAdStore';

export function LocationStep() {
  const { draft, update } = usePostAdStore();
  const selectedState = STATES.find((s) => s.name === draft.state);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">State</span>
        <select
          value={draft.state}
          onChange={(e) => update({ state: e.target.value, lga: '' })}
          className="input"
        >
          <option value="" disabled>Select a state</option>
          {STATES.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Local Government Area</span>
        <select
          value={draft.lga}
          onChange={(e) => update({ lga: e.target.value })}
          disabled={!selectedState}
          className="input disabled:opacity-50"
        >
          <option value="" disabled>{selectedState ? 'Select an LGA' : 'Choose a state first'}</option>
          {selectedState?.lgas.map((lga) => (
            <option key={lga} value={lga}>{lga}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
