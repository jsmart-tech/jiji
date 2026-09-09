import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { router } from 'expo-router';

// ─── Query Keys ───────────────────────────────────────────
export const authKeys = {
  me: ['auth', 'me'] as const,
};

// ─── Get Current User ────────────────────────────────────

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Email Login ──────────────────────────────────────────

export function useEmailLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => authApi.loginWithEmail(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      queryClient.setQueryData(authKeys.me, user);
      router.replace('/(tabs)');
    },
  });
}

// ─── Email Registration ───────────────────────────────────

export function useEmailRegister() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      authApi.registerWithEmail(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      queryClient.setQueryData(authKeys.me, user);
      router.replace('/(tabs)');
    },
  });
}

// ─── Phone OTP Login ─────────────────────────────────────

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
  });
}

export function usePhoneLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { phone: string; otp: string }) => authApi.loginWithPhone(data),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      queryClient.setQueryData(authKeys.me, user);
      router.replace('/(tabs)');
    },
  });
}

// ─── Logout ──────────────────────────────────────────────

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace('/auth/login');
    },
  });
}

// ─── Forgot Password ─────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { email: string; otp: string; newPassword: string }) =>
      authApi.resetPassword(data),
  });
}
