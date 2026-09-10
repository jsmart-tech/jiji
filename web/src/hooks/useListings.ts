import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListings, getListingById, getFeaturedListings, getMyListings, createListing, updateListing,
  type ListingEditableFields,
} from '@shared/api/listings';
import type { ListingFilters, NewListingInput } from '@shared/types';

export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
  });
}

export function useMyListings(sellerId: string | undefined) {
  return useQuery({
    queryKey: ['listings', 'mine', sellerId],
    queryFn: () => getMyListings(sellerId!),
    enabled: !!sellerId,
  });
}

export function useFeaturedListings() {
  return useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: getFeaturedListings,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewListingInput) => createListing(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ListingEditableFields) => updateListing(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
