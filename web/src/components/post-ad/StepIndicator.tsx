import clsx from 'clsx';
import { Check } from 'lucide-react';

const STEPS = ['Category', 'Photos', 'Details', 'Location', 'Promote'];

export function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full items-center">
            <span
              className={clsx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                i < step ? 'bg-brand text-white' : i === step ? 'bg-brand-dark text-white' : 'bg-surface-border text-ink-muted',
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            {i < STEPS.length - 1 && (
              <span className={clsx('mx-1 h-0.5 flex-1', i < step ? 'bg-brand' : 'bg-surface-border')} />
            )}
          </div>
          <span className={clsx('hidden text-[10px] font-semibold sm:block', i === step ? 'text-ink' : 'text-ink-muted')}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
