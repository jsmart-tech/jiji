'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogOut, ShieldCheck, ClipboardList, Heart, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import { isSupabaseConfigured } from '@shared/lib/supabaseClient';
import { requestPasswordReset } from '@shared/api/auth';
import { STATES } from '@shared/mock/locations.mock';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useListings, useMyListings } from '@/hooks/useListings';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { Button } from '@/components/ui/Button';
import { AvatarUpload } from '@/components/ui/AvatarUpload';

export default function AccountPage() {
  const { user, hydrated } = useAuthStore();

  if (!hydrated) return null;
  if (!user) return <AuthView />;

  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-ink-muted">Loading…</p>}>
      <ProfileDashboard />
    </Suspense>
  );
}

function AuthView() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const { login, register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const isSupabaseEnabled = isSupabaseConfigured();
  const selectedState = STATES.find((s) => s.name === state);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === 'login') await login({ email, password });
      else if (mode === 'register') await register({ name, email, phone, password, state, lga });
      else {
        await requestPasswordReset(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (mode === 'forgot') {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-5 rounded-2xl border border-surface-border bg-white p-6">
        <div>
          <p className="text-lg font-bold text-ink">Reset your password</p>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        {resetSent ? (
          <p className="rounded-lg bg-brand-light px-3 py-2 text-sm text-brand-dark">
            Check your email for a reset link. It may take a minute to arrive — check spam too.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              className="input"
            />
            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
            <Button type="submit" size="lg" loading={pending}>
              {pending ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setResetSent(false);
          }}
          className="text-center text-sm font-semibold text-brand hover:underline"
        >
          Back to Log In
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 rounded-2xl border border-surface-border bg-white p-6">
      <div className="flex rounded-lg bg-surface-muted p-1">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === m ? 'bg-white text-brand-dark shadow-sm' : 'text-ink-muted'}`}
          >
            {m === 'login' ? 'Log In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'register' && (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="input"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Phone number"
              required
              className="input"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setLga('');
                }}
                required
                className="input"
              >
                <option value="" disabled>State</option>
                {STATES.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                required
                disabled={!selectedState}
                className="input disabled:opacity-50"
              >
                <option value="" disabled>{selectedState ? 'LGA' : 'Select state first'}</option>
                {selectedState?.lgas.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-ink-muted">
              Buyers see this on your ads, so they know where to pick items up.
            </p>
          </>
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          className="input"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          className="input"
        />
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError(null);
            }}
            className="self-end text-xs font-semibold text-brand hover:underline"
          >
            Forgot password?
          </button>
        )}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" loading={pending}>
          {pending ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </Button>
      </form>
      <p className="text-center text-[11px] text-ink-muted">
        {isSupabaseEnabled
          ? 'Your account is stored securely with Supabase.'
          : 'Demo mode: any details will sign you in — no real account is created.'}
      </p>
    </div>
  );
}

type Tab = 'adverts' | 'saved' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: 'adverts', label: 'My Adverts', icon: ClipboardList },
  { id: 'saved', label: 'Saved Ads', icon: Heart },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function ProfileDashboard() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab: Tab = TABS.some((t) => t.id === requestedTab) ? (requestedTab as Tab) : 'adverts';
  const [tab, setTab] = useState<Tab>(initialTab);

  // Keep the active tab in sync if the account menu deep-links here with a
  // different ?tab= while this page is already mounted.
  useEffect(() => {
    const requested = searchParams.get('tab');
    if (TABS.some((t) => t.id === requested)) {
      setTab(requested as Tab);
    }
  }, [searchParams]);

  const { user, logout } = useAuthStore();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const { data: allListings } = useListings();
  const { data: myListings = [] } = useMyListings(user?.id);
  const saved = (allListings ?? []).filter((l) => favoriteIds.includes(l.id));
  const pendingCount = myListings.filter((l) => l.status === 'PENDING_REVIEW').length;

  return (
    <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-white p-6 text-center">
          <button
            type="button"
            onClick={() => setTab('settings')}
            aria-label="Settings"
            className="absolute right-3 top-3 rounded-full p-1.5 text-ink-muted hover:bg-surface-muted"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
          <AvatarUpload user={user!} />
          <p className="flex items-center gap-1.5 font-bold text-ink">
            {user!.name}
            {user!.isVerifiedSeller && <ShieldCheck className="h-4 w-4 text-brand" />}
          </p>
          <p className="text-xs text-ink-muted">{user!.email}</p>
          {user!.phone && <p className="text-xs text-ink-muted">{user!.phone}</p>}
          {user!.lga && user!.state && (
            <p className="text-xs text-ink-muted">{user!.lga}, {user!.state}</p>
          )}
        </div>

        <nav className="flex flex-col divide-y divide-surface-border overflow-hidden rounded-2xl border border-surface-border bg-white">
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = id === 'adverts' ? myListings.length : id === 'saved' ? saved.length : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold',
                  tab === id ? 'bg-brand-light text-brand-dark' : 'text-ink hover:bg-surface-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {count > 0 && <span className="ml-auto font-mono text-xs text-ink-muted">{count}</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </nav>
      </aside>

      <div>
        {tab === 'adverts' && (
          <section>
            <h1 className="mb-2 text-lg font-bold text-ink">My Adverts</h1>
            {pendingCount > 0 && (
              <p className="mb-4 rounded-lg bg-accent/15 px-3 py-2 text-xs font-medium text-ink">
                {pendingCount} {pendingCount === 1 ? 'ad is' : 'ads are'} pending admin approval — this usually takes
                a few minutes after we receive your payment evidence.
              </p>
            )}
            <ListingGrid
              listings={myListings}
              emptyLabel="There are no adverts yet. Create a new one now!"
              emptyAction={{ label: 'Post an Ad', href: '/post-ad' }}
              ownerMode
            />
          </section>
        )}
        {tab === 'saved' && (
          <section>
            <h1 className="mb-4 text-lg font-bold text-ink">Saved Ads</h1>
            <ListingGrid
              listings={saved}
              emptyLabel="Nothing saved yet. Tap the heart on any ad to save it here."
              emptyAction={{ label: 'Browse Listings', href: '/categories' }}
            />
          </section>
        )}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user!.name);
  const [phone, setPhone] = useState(user!.phone ?? '');
  const [state, setState] = useState(user!.state ?? '');
  const [lga, setLga] = useState(user!.lga ?? '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const selectedState = STATES.find((s) => s.name === state);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setJustSaved(false);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), state, lga });
      setJustSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-white p-6">
      <h1 className="text-lg font-bold text-ink">Settings</h1>
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Full Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required minLength={2} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Email</span>
          <input value={user!.email} disabled className="input opacity-60" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Phone Number</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="input" required />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">State</span>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setLga('');
              }}
              required
              className="input"
            >
              <option value="" disabled>Select a state</option>
              {STATES.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">LGA</span>
            <select
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              required
              disabled={!selectedState}
              className="input disabled:opacity-50"
            >
              <option value="" disabled>{selectedState ? 'Select an LGA' : 'Choose a state first'}</option>
              {selectedState?.lgas.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <Button type="submit" loading={saving} disabled={name.trim().length < 2 || !state || !lga} className="w-fit">
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        {justSaved && <p className="text-xs font-semibold text-brand-dark">Profile updated.</p>}
      </form>
    </section>
  );
}
