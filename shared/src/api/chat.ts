import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { MOCK_ROOMS, MOCK_MESSAGES, SIMULATED_REPLIES } from '../mock/chat.mock';
import { readLocalStorage, writeLocalStorage } from '../lib/storage';
import type { ChatRoom, ChatMessage } from '../types';

const ROOMS_KEY = 'jsmart_web_chat_rooms';
const MESSAGES_KEY = 'jsmart_web_chat_messages';

const loadRooms = (): ChatRoom[] => readLocalStorage(ROOMS_KEY, MOCK_ROOMS);
const saveRooms = (rooms: ChatRoom[]) => writeLocalStorage(ROOMS_KEY, rooms);
const loadMessages = (): ChatMessage[] => readLocalStorage(MESSAGES_KEY, MOCK_MESSAGES);
const saveMessages = (messages: ChatMessage[]) => writeLocalStorage(MESSAGES_KEY, messages);

async function currentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be logged in to chat.');
  return data.user.id;
}

interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  type: ChatMessage['type'];
  text: string;
  created_at: string;
}

interface RoomRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  buyer: { name: string } | null;
  seller: { name: string } | null;
}

function rowToRoom(row: RoomRow, meId: string): ChatRoom {
  const iAmBuyer = row.buyer_id === meId;
  return {
    id: row.id,
    listingId: row.listing_id,
    otherPartyId: iAmBuyer ? row.seller_id : row.buyer_id,
    otherPartyName: (iAmBuyer ? row.seller?.name : row.buyer?.name) ?? 'User',
    lastMessageAt: row.last_message_at,
    unreadCount: 0,
  };
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const meId = await currentUserId();
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('id, listing_id, buyer_id, seller_id, last_message_at, buyer:profiles!buyer_id(name), seller:profiles!seller_id(name)')
      .or(`buyer_id.eq.${meId},seller_id.eq.${meId}`)
      .order('last_message_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as RoomRow[]).map((row) => rowToRoom(row, meId));
  }

  return loadRooms();
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const meId = await currentUserId();
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as MessageRow[]).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      senderId: row.sender_id,
      from: row.sender_id === meId ? ('me' as const) : ('them' as const),
      type: row.type,
      text: row.text,
      createdAt: row.created_at,
    }));
  }

  return loadMessages().filter((m) => m.roomId === roomId);
}

export async function sendMessage(roomId: string, text: string): Promise<ChatMessage> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const meId = await currentUserId();
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ room_id: roomId, sender_id: meId, type: 'TEXT', text })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Could not send message.');
    await supabase.from('chat_rooms').update({ last_message_at: data.created_at }).eq('id', roomId);
    return {
      id: data.id, roomId: data.room_id, senderId: data.sender_id, from: 'me', type: data.type,
      text: data.text, createdAt: data.created_at,
    };
  }

  const message: ChatMessage = {
    id: `m_${Date.now()}`, roomId, senderId: 'me', from: 'me', type: 'TEXT', text,
    createdAt: new Date().toISOString(),
  };
  saveMessages([...loadMessages(), message]);
  saveRooms(loadRooms().map((r) => (r.id === roomId ? { ...r, lastMessageAt: message.createdAt } : r)));
  return message;
}

export async function getOrCreateRoomForListing(
  listingId: string,
  otherPartyName: string,
  otherPartyId: string,
): Promise<ChatRoom> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const meId = await currentUserId();

    const { data: existing, error: findError } = await supabase
      .from('chat_rooms')
      .select('id, listing_id, buyer_id, seller_id, last_message_at, buyer:profiles!buyer_id(name), seller:profiles!seller_id(name)')
      .eq('listing_id', listingId)
      .eq('buyer_id', meId)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (existing) return rowToRoom(existing as unknown as RoomRow, meId);

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ listing_id: listingId, buyer_id: meId, seller_id: otherPartyId })
      .select('id, listing_id, buyer_id, seller_id, last_message_at, buyer:profiles!buyer_id(name), seller:profiles!seller_id(name)')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Could not start chat.');
    return rowToRoom(data as unknown as RoomRow, meId);
  }

  const rooms = loadRooms();
  const existing = rooms.find((r) => r.listingId === listingId);
  if (existing) return existing;

  const room: ChatRoom = {
    id: `room_${Date.now()}`, listingId, otherPartyName, otherPartyId,
    lastMessageAt: new Date().toISOString(), unreadCount: 0,
  };
  saveRooms([room, ...rooms]);
  saveMessages([...loadMessages(), {
    id: `m_${Date.now()}`, roomId: room.id, senderId: otherPartyId, from: 'them', type: 'TEXT',
    text: 'Hi! Thanks for your interest. How can I help?', createdAt: new Date().toISOString(),
  }]);
  return room;
}

export function simulateSellerReply(roomId: string): ChatMessage | null {
  // Only meaningful in mock mode — with a real backend, replies come from the
  // actual other participant, not a scripted one.
  if (isSupabaseConfigured()) return null;

  const message: ChatMessage = {
    id: `m_${Date.now()}`, roomId, senderId: 'them', from: 'them', type: 'TEXT',
    text: SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)],
    createdAt: new Date().toISOString(),
  };
  saveMessages([...loadMessages(), message]);
  return message;
}
