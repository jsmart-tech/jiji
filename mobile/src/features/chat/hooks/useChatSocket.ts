import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@store/auth.store';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: string;
  content?: string;
  mediaUrl?: string;
  metadata?: unknown;
  sender: { id: string; firstName: string; avatarUrl?: string };
  createdAt: string;
}

interface TypingStatus {
  userId: string;
  roomId: string;
}

interface OnlineStatus {
  userId: string;
  isOnline: boolean;
}

interface UseChatSocketOptions {
  roomId?: string;
  onNewMessage?: (message: Message) => void;
  onUserTyping?: (status: TypingStatus) => void;
  onUserStoppedTyping?: (status: TypingStatus) => void;
  onOnlineStatusChange?: (status: OnlineStatus) => void;
  onMessagesRead?: (data: { roomId: string; userId: string }) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    roomId,
    onNewMessage,
    onUserTyping,
    onUserStoppedTyping,
    onOnlineStatusChange,
    onMessagesRead,
  } = options;

  // ─── Connect ────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    const connect = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const socket = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', (err) => setError(err.message));

      socket.on('new_message', (message: Message) => {
        onNewMessage?.(message);
      });

      socket.on('user_typing', (status: TypingStatus) => {
        onUserTyping?.(status);
      });

      socket.on('user_stopped_typing', (status: TypingStatus) => {
        onUserStoppedTyping?.(status);
      });

      socket.on('online_status', (status: OnlineStatus) => {
        onOnlineStatusChange?.(status);
      });

      socket.on('messages_read', (data: { roomId: string; userId: string }) => {
        onMessagesRead?.(data);
      });
    };

    void connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ─── Join Room ──────────────────────────────────────────

  const joinRoom = useCallback((listingId: string, callback?: (data: unknown) => void) => {
    socketRef.current?.emit('join_room', { listingId }, callback);
  }, []);

  // ─── Send Message ────────────────────────────────────────

  const sendMessage = useCallback(
    (data: { roomId: string; content?: string; type?: string; mediaUrl?: string }) => {
      socketRef.current?.emit('send_message', data);
    },
    [],
  );

  // ─── Typing Indicators ───────────────────────────────────

  const startTyping = useCallback(
    (rid: string) => socketRef.current?.emit('typing_start', { roomId: rid }),
    [],
  );

  const stopTyping = useCallback(
    (rid: string) => socketRef.current?.emit('typing_stop', { roomId: rid }),
    [],
  );

  // ─── Mark Read ───────────────────────────────────────────

  const markRead = useCallback(
    (rid: string) => socketRef.current?.emit('mark_read', { roomId: rid }),
    [],
  );

  // ─── Check Online Status ─────────────────────────────────

  const checkOnline = useCallback(
    (userId: string, callback: (status: OnlineStatus) => void) => {
      socketRef.current?.emit('check_online', { userId });
      socketRef.current?.once('online_status', callback);
    },
    [],
  );

  return {
    isConnected,
    error,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    checkOnline,
  };
}
