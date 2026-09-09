import { create } from 'zustand';
import {
  login as apiLogin,
  register as apiRegister,
  getStoredSession,
  clearSession,
  updateAvatar as apiUpdateAvatar,
  updateProfile as apiUpdateProfile,
} from '@shared/api/auth';
import type { AuthCredentials, RegisterPayload, User } from '@shared/types';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  login: (payload: AuthCredentials) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name'>>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  hydrated: false,
  hydrate: () => set({ user: getStoredSession(), hydrated: true }),
  login: async (payload) => {
    const user = await apiLogin(payload);
    set({ user });
    return user;
  },
  register: async (payload) => {
    const user = await apiRegister(payload);
    set({ user });
    return user;
  },
  logout: () => {
    clearSession();
    set({ user: null });
  },
  updateAvatar: async (avatarUrl) => {
    const current = get().user;
    if (!current) return;
    const updated = await apiUpdateAvatar(current, avatarUrl);
    set({ user: updated });
  },
  updateProfile: async (patch) => {
    const current = get().user;
    if (!current) return;
    const updated = await apiUpdateProfile(current, patch);
    set({ user: updated });
  },
}));
