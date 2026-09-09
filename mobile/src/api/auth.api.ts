import api from './client';

// ─── Types ────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isVerifiedSeller: boolean;
  sellerScore: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Auth API ─────────────────────────────────────────────

export const authApi = {
  registerWithEmail: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register/email', data);
    return res.data;
  },

  registerWithPhone: async (data: {
    phone: string;
    firstName: string;
    lastName: string;
  }): Promise<{ message: string }> => {
    const res = await api.post('/auth/register/phone', data);
    return res.data;
  },

  loginWithEmail: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login/email', data);
    return res.data;
  },

  sendOtp: async (phone: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/otp/send', { phone });
    return res.data;
  },

  loginWithPhone: async (data: { phone: string; otp: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login/phone', data);
    return res.data;
  },

  verifyOtp: async (data: { target: string; code: string; purpose: string }) => {
    const res = await api.post('/auth/otp/verify', data);
    return res.data;
  },

  oauthLogin: async (data: {
    provider: string;
    providerId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/oauth/login', data);
    return res.data;
  },

  refreshTokens: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    return res.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/password/forgot', { email });
    return res.data;
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> => {
    const res = await api.post('/auth/password/reset', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/users/me');
    return res.data;
  },
};
