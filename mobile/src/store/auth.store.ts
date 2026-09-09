import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@api/auth.api';

// ─── SecureStore adapter for Zustand persist ─────────────

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string): Promise<void> => { await SecureStore.setItemAsync(name, value); },
  removeItem: async (name: string): Promise<void> => { await SecureStore.deleteItemAsync(name); },
};

// ─── Auth State ───────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        // Also store tokens in SecureStore for the axios interceptor
        void SecureStore.setItemAsync('access_token', accessToken);
        void SecureStore.setItemAsync('refresh_token', refreshToken);
      },

      updateUser: (updates) => {
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }));
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        void SecureStore.setItemAsync('access_token', accessToken);
        void SecureStore.setItemAsync('refresh_token', refreshToken);
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            const { authApi } = await import('@api/auth.api');
            await authApi.logout(refreshToken);
          } catch {
            // Ignore logout errors
          }
        }
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
