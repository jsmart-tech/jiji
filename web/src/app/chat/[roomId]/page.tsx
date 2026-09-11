'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send, Package } from 'lucide-react';
import { useChatMessages, useSendMessage, useChatRooms } from '@/hooks/useChat';
import { useListing } from '@/hooks/useListings';
import { initialsOf } from '@/lib/format';

export default function ChatThreadPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { data: rooms } = useChatRooms();
  const room = rooms?.find((r) => r.id === roomId);
  const { data: messages } = useChatMessages(roomId);
  const { data: listing } = useListing(room?.listingId ?? '');
  const sendMessage = useSendMessage(roomId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setText('');
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-white sm:h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
        <button type="button" onClick={() => router.push('/chat')} aria-label="Back" className="rounded-full p-1.5 hover:bg-surface-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
          {initialsOf(room?.otherPartyName ?? '?')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{room?.otherPartyName ?? 'Conversation'}</p>
          {listing && <p className="truncate text-xs text-ink-muted">Re: {listing.title}</p>}
        </div>
        {listing && (
          <Link href={`/listing/${listing.id}`} className="rounded-full p-2 hover:bg-surface-muted" aria-label="View listing">
            <Package className="h-4 w-4 text-ink-muted" />
          </Link>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {(messages ?? []).map((m) => (
          <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                m.from === 'me' ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm bg-surface-muted text-ink'
              }`}
            >
              {m.text}
              <span className={`mt-1 block font-mono text-[10px] ${m.from === 'me' ? 'text-white/70' : 'text-ink-muted'}`}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-surface-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-full border border-surface-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
