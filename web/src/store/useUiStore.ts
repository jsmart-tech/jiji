import { create } from 'zustand';
import { ALL_NIGERIA } from '@shared/mock/locations.mock';

interface UiState {
  state: string;
  lga: string | null;
  setLocation: (state: string, lga: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  state: ALL_NIGERIA,
  lga: null,
  setLocation: (state, lga) => set({ state, lga }),
}));
