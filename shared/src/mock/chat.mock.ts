import type { ChatRoom, ChatMessage } from '../types';

const HOURS = 3600 * 1000;

export const MOCK_ROOMS: ChatRoom[] = [
  {
    id: 'room_1',
    listingId: 'l1',
    otherPartyName: 'Emeka Obi',
    otherPartyId: 's_emeka',
    lastMessageAt: new Date(Date.now() - 2.8 * HOURS).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'room_2',
    listingId: 'l3',
    otherPartyName: 'Tunde Kalu',
    otherPartyId: 's_tunde',
    lastMessageAt: new Date(Date.now() - 0.9 * HOURS).toISOString(),
    unreadCount: 1,
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', roomId: 'room_1', senderId: 's_emeka', from: 'them', type: 'TEXT', text: 'Hello! Yes the Camry is still available.', createdAt: new Date(Date.now() - 3 * HOURS).toISOString() },
  { id: 'm2', roomId: 'room_1', senderId: 'me', from: 'me', type: 'TEXT', text: 'Great, is the price negotiable?', createdAt: new Date(Date.now() - 2.9 * HOURS).toISOString() },
  { id: 'm3', roomId: 'room_1', senderId: 's_emeka', from: 'them', type: 'TEXT', text: 'A little bit. Come see it first, we can talk price.', createdAt: new Date(Date.now() - 2.8 * HOURS).toISOString() },
  { id: 'm4', roomId: 'room_2', senderId: 'me', from: 'me', type: 'TEXT', text: 'Hi, does the iPhone come with the original box?', createdAt: new Date(Date.now() - 1 * HOURS).toISOString() },
  { id: 'm5', roomId: 'room_2', senderId: 's_tunde', from: 'them', type: 'TEXT', text: 'Yes it does, complete with charger too.', createdAt: new Date(Date.now() - 0.9 * HOURS).toISOString() },
];

export const SIMULATED_REPLIES = [
  "Yes, it's still available.",
  'Sure, when would you like to come see it?',
  'The price is a bit negotiable, come with your offer.',
  "Okay, I'll hold it for you till this evening.",
  'You can reach me by 9am tomorrow to arrange pickup.',
];
