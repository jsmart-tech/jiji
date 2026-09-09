import { create } from 'zustand';

interface AppState {
  // Global loading states
  isOnline: boolean;
  // Active filters for listing search
  searchFilters: {
    q?: string;
    categoryId?: string;
    stateId?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sortBy?: string;
  };

  // Actions
  setOnline: (isOnline: boolean) => void;
  setSearchFilters: (filters: Partial<AppState['searchFilters']>) => void;
  clearSearchFilters: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true,
  searchFilters: {},

  setOnline: (isOnline) => set({ isOnline }),
  setSearchFilters: (filters) =>
    set((state) => ({ searchFilters: { ...state.searchFilters, ...filters } })),
  clearSearchFilters: () => set({ searchFilters: {} }),
}));
