'use client';

import Link from 'next/link';
import { ShieldAlert, Users, ClipboardList, Clock, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePendingListings, useAllUsers, useApproveListing } from '@/hooks/useAdmin';
import { formatPrice, timeAgo } from '@/lib/format';
import { PromotionBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

export default function AdminPage() {
  const { user, hydrated } = useAuthStore();

  if (!hydrated) return null;

  if (!user || !ADMIN_ROLES.has(user.role)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-surface-border bg-white py-16 text-center">
        <ShieldAlert className="h-10 w-10 text-ink-muted" />
        <p className="text-sm font-semibold text-ink">Admins only</p>
        <p className="max-w-xs text-sm text-ink-muted">
          You don&apos;t have access to this page.
        </p>
        <Link href="/" className="text-sm font-semibold text-brand hover:underline">Back to home</Link>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data: pending = [], isLoading: pendingLoading } = usePendingListings();
  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const approve = useApproveListing();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold text-ink">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Users} label="Users" value={usersLoading ? '…' : users.length} />
        <StatTile icon={ClipboardList} label="Pending Approvals" value={pendingLoading ? '…' : pending.length} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Pending Premium Ads</h2>
        {pendingLoading && <p className="text-sm text-ink-muted">Loading…</p>}
        {!pendingLoading && pending.length === 0 && (
          <p className="rounded-2xl border border-surface-border bg-white p-6 text-center text-sm text-ink-muted">
            Nothing awaiting approval right now.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {pending.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <PromotionBadge tier={listing.promotionTier} />
                  <Link href={`/listing/${listing.id}`} className="font-semibold text-ink hover:underline">
                    {listing.title}
                  </Link>
                </div>
                <p className="text-xs text-ink-muted">
                  {listing.sellerName} &middot; {formatPrice(listing.price, listing.priceType, listing.currency)} &middot;{' '}
                  <Clock className="inline h-3 w-3" /> {timeAgo(listing.createdAt)}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => approve.mutate(listing.id)}
                loading={approve.isPending && approve.variables === listing.id}
                className="w-fit"
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Users ({users.length})</h2>
        {usersLoading && <p className="text-sm text-ink-muted">Loading…</p>}
        {!usersLoading && (
          <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-border text-xs font-bold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                    <td className="px-4 py-3 text-ink-muted">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{u.lga && u.state ? `${u.lga}, ${u.state}` : '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{timeAgo(u.memberSince)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-surface-border bg-white p-4">
      <Icon className="h-4 w-4 text-brand" />
      <p className="font-mono text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
