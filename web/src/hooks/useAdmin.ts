import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingListings, approveListing } from '@shared/api/listings';
import { getAllUsers } from '@shared/api/auth';

export function usePendingListings() {
  return useQuery({
    queryKey: ['admin', 'pending-listings'],
    queryFn: getPendingListings,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getAllUsers,
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
