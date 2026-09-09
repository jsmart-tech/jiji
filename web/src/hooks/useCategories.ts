import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@shared/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });
}
