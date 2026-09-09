'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChat';
import { useListing } from '@/hooks/useListings';
import { useAuthStore } from '@/store/useAuthStore';
import { initialsOf, timeAgo } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import type { ChatRoom } from '@shared/types';

export default function ChatListPage() {
  const { user, hydrated } = useAuthStore();
  const router = useRouter();
  const { data: rooms, isLoading } = useChatRooms();

  if (hydrated && !user) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-surface-border bg-white py-16 text-center">
        <MessageCircle className="h-10 w-10 text-ink-muted" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-ink">Log in to view your messages</p>
        <Button onClick={() => router.push('/account')}>Go to Login</Button>
      </div>
    );
  }

  const sorted = [...(rooms ?? [])].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">Messages</h1>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-muted">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-ink-muted">
          <MessageCircle className="h-10 w-10" strokeWidth={1.5} />
          <p className="text-sm font-medium">No messages yet. Start a chat from any listing page.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-surface-border overflow-hidden rounded-2xl border border-surface-border bg-white">
          {sorted.map((room) => (
            <ChatRoomRow key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatRoomRow({ room }: { room: ChatRoom }) {
  const { data: listing } = useListing(room.listingId);

  return (
    <Link href={`/chat/${room.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-muted">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
        {initialsOf(room.otherPartyName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink">{room.otherPartyName}</p>
          <span className="shrink-0 font-mono text-[11px] text-ink-muted">{timeAgo(room.lastMessageAt)}</span>
        </div>
        {listing && <p className="truncate text-xs text-ink-muted">Re: {listing.title}</p>}
      </div>
    </Link>
  );
}
