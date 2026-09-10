'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { getCurrentUser, updateOwnPassword } from '@shared/api/auth';
import { isSupabaseConfigured, getSupabase } from '@shared/lib/supabaseClient';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    // Supabase parses the recovery token out of the URL on load and turns it
    // into a real session automatically — just confirm one actually exists.
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        setHasRecoverySession(!!data.session);
        setReady(true);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      await updateOwnPassword(password);
      const user = await getCurrentUser();
      if (user) setUser(user);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password. Try requesting a new reset link.');
    } finally {
      setPending(false);
    }
  }

  if (!ready) return null;

  if (success) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
          <KeyRound className="h-7 w-7 text-brand-dark" />
        </div>
        <p className="text-lg font-bold text-ink">Password updated</p>
        <p className="text-sm text-ink-muted">You&apos;re all set — and already signed in.</p>
        <Button onClick={() => router.push('/account')} className="w-full">Go to My Account</Button>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white p-8 text-center">
        <p className="text-lg font-bold text-ink">This reset link is invalid or expired</p>
        <p className="text-sm text-ink-muted">Request a new one from the login page.</p>
        <Button onClick={() => router.push('/account')} className="w-full">Back to Login</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 rounded-2xl border border-surface-border bg-white p-6">
      <div>
        <p className="text-lg font-bold text-ink">Set a new password</p>
        <p className="mt-1 text-sm text-ink-muted">Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="New password"
          required
          minLength={6}
          className="input"
        />
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="Confirm new password"
          required
          minLength={6}
          className="input"
        />
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" loading={pending}>
          {pending ? 'Updating…' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}
