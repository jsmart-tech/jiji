import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChatRooms, getMessages, sendMessage, getOrCreateRoomForListing, simulateSellerReply,
} from '@shared/api/chat';

export function useChatRooms() {
  return useQuery({ queryKey: ['chat', 'rooms'], queryFn: getChatRooms });
}

export function useChatMessages(roomId: string) {
  return useQuery({
    queryKey: ['chat', 'messages', roomId],
    queryFn: () => getMessages(roomId),
    enabled: !!roomId,
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendMessage(roomId, text),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chat', 'messages', roomId] });
      // In mock mode, simulate the other party replying shortly after, so the
      // thread feels alive while there is no live backend connected. No-op
      // once Supabase is configured — real replies come from the real user.
      setTimeout(() => {
        if (!simulateSellerReply(roomId)) return;
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', roomId] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      }, 1200 + Math.random() * 900);
    },
  });
}

export function useStartChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, sellerName, sellerId }: { listingId: string; sellerName: string; sellerId: string }) =>
      getOrCreateRoomForListing(listingId, sellerName, sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    },
  });
}
