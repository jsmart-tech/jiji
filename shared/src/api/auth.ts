import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { readLocalStorage, writeLocalStorage } from '../lib/storage';
import type { AuthCredentials, RegisterPayload, User } from '../types';

const SESSION_KEY = 'jiji_web_session';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

function mockUserFrom(name: string, email: string, phone = '', state?: string, lga?: string): User {
  return {
    id: `u_${Date.now()}`,
    name,
    email,
    phone,
    avatarInitials: initialsOf(name),
    role: 'BUYER',
    isVerifiedSeller: false,
    rating: 0,
    memberSince: new Date().toISOString(),
    state,
    lga,
  };
}

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: User['role'];
  is_verified_seller: boolean;
  rating: number;
  member_since: string;
  state: string | null;
  lga: string | null;
}

function profileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? '',
    avatarInitials: initialsOf(profile.name),
    avatarUrl: profile.avatar_url ?? undefined,
    role: profile.role,
    isVerifiedSeller: profile.is_verified_seller,
    rating: profile.rating,
    memberSince: profile.member_since,
    state: profile.state ?? undefined,
    lga: profile.lga ?? undefined,
  };
}

async function fetchProfile(userId: string): Promise<User> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw error ?? new Error('Profile not found.');
  return profileToUser(data as ProfileRow);
}

// NOTE: once Supabase is configured, real errors (wrong password, duplicate
// account, email confirmation required, ...) are thrown as-is rather than
// silently falling back to mock data — a failed login should look like a
// failure, not a fake success.

export async function login(payload: AuthCredentials): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (error || !data.user) throw new Error(error?.message ?? 'Login failed.');
    const user = await fetchProfile(data.user.id);
    writeLocalStorage(SESSION_KEY, user);
    return user;
  }

  const user = mockUserFrom('Demo User', payload.email);
  writeLocalStorage(SESSION_KEY, user);
  return user;
}

export async function register(payload: RegisterPayload): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { data: { name: payload.name, phone: payload.phone, state: payload.state, lga: payload.lga } },
    });
    const alreadyRegisteredMessage = 'This email is already in use. Try another one, or log in instead.';
    if (error) {
      if (/already registered|already exists|already in use/i.test(error.message)) {
        throw new Error(alreadyRegisteredMessage);
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Registration failed.');
    if (data.user.identities && data.user.identities.length === 0) {
      // Supabase doesn't return an error for a duplicate signup when email
      // confirmation is on (to avoid leaking which emails are registered) —
      // an empty identities array is the documented signal for this case.
      throw new Error(alreadyRegisteredMessage);
    }
    if (!data.session) {
      // Email confirmation is required before a session exists. Surface this
      // clearly instead of pretending the account is already logged in.
      throw new Error('Account created — check your email to confirm it, then log in.');
    }
    const user = await fetchProfile(data.user.id);
    writeLocalStorage(SESSION_KEY, user);
    return user;
  }

  const user = mockUserFrom(payload.name, payload.email, payload.phone, payload.state, payload.lga);
  writeLocalStorage(SESSION_KEY, user);
  return user;
}

export function getStoredSession(): User | null {
  return readLocalStorage<User | null>(SESSION_KEY, null);
}

export function clearSession(): void {
  writeLocalStorage<User | null>(SESSION_KEY, null);
  if (isSupabaseConfigured()) {
    void getSupabase().auth.signOut();
  }
}

export async function updateAvatar(user: User, avatarUrl: string): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Could not update avatar.');
    const updated = profileToUser(data as ProfileRow);
    writeLocalStorage(SESSION_KEY, updated);
    return updated;
  }

  const updated: User = { ...user, avatarUrl };
  writeLocalStorage(SESSION_KEY, updated);
  return updated;
}

export async function updateProfile(
  user: User,
  patch: Partial<Pick<User, 'name' | 'phone' | 'state' | 'lga'>>,
): Promise<User> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Could not update profile.');
    const updated = profileToUser(data as ProfileRow);
    writeLocalStorage(SESSION_KEY, updated);
    return updated;
  }

  const updated: User = {
    ...user,
    ...patch,
    avatarInitials: patch.name ? initialsOf(patch.name) : user.avatarInitials,
  };
  writeLocalStorage(SESSION_KEY, updated);
  return updated;
}
