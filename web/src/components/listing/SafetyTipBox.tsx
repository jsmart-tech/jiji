import { ShieldAlert } from 'lucide-react';

export function SafetyTipBox() {
  return (
    <div className="flex gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
      <ShieldAlert className="h-5 w-5 shrink-0 text-accent-dark" />
      <div className="text-sm text-ink">
        <p className="font-semibold">Safety tips</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-ink-muted">
          <li>Meet the seller in a safe, public place.</li>
          <li>Inspect the item carefully before paying.</li>
          <li>Never pay in advance, even for delivery.</li>
        </ul>
      </div>
    </div>
  );
}
