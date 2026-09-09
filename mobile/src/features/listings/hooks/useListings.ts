import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { listingsApi, type SearchListingsParams } from '@api/listings.api';

// ─── Query Keys ───────────────────────────────────────────

export const listingKeys = {
  all: ['listings'] as const,
  featured: () => [...listingKeys.all, 'featured'] as const,
  search: (params: SearchListingsParams) => [...listingKeys.all, 'search', params] as const,
  byCategory: (categoryId: string) => [...listingKeys.all, 'category', categoryId] as const,
  detail: (idOrSlug: string) => [...listingKeys.all, 'detail', idOrSlug] as const,
  myListings: () => [...listingKeys.all, 'my'] as const,
  saved: () => [...listingKeys.all, 'saved'] as const,
};

// ─── Queries ──────────────────────────────────────────────

export function useFeaturedListings() {
  return useQuery({
    queryKey: listingKeys.featured(),
    queryFn: listingsApi.getFeatured,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchListings(params: SearchListingsParams) {
  return useInfiniteQuery({
    queryKey: listingKeys.search(params),
    queryFn: ({ pageParam = 1 }) => listingsApi.search({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: { page: number; lastPage: number }) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
}

export function useListingsByCategory(categoryId: string) {
  return useInfiniteQuery({
    queryKey: listingKeys.byCategory(categoryId),
    queryFn: ({ pageParam = 1 }) => listingsApi.getByCategory(categoryId, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: { page: number; lastPage: number }) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    enabled: !!categoryId,
  });
}

export function useListing(idOrSlug: string) {
  return useQuery({
    queryKey: listingKeys.detail(idOrSlug),
    queryFn: () => listingsApi.findOne(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useMyListings() {
  return useInfiniteQuery({
    queryKey: listingKeys.myListings(),
    queryFn: ({ pageParam = 1 }) => listingsApi.getMyListings({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: { page: number; lastPage: number }) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
  });
}

export function useSavedListings() {
  return useInfiniteQuery({
    queryKey: listingKeys.saved(),
    queryFn: ({ pageParam = 1 }) => listingsApi.getSaved({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: { page: number; lastPage: number }) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
  });
}

// ─── Mutations ────────────────────────────────────────────

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listingsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.myListings() });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof listingsApi.update>[1] }) =>
      listingsApi.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: listingKeys.myListings() });
    },
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listingsApi.toggleSave,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.saved() });
    },
  });
}

export function useMarkSold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listingsApi.markSold,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: listingKeys.myListings() });
    },
  });
}
