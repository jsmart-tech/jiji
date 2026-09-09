import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Each consuming app (web today, mobile later) calls `configureSupabase` once
// at startup with its own project URL + anon key. Until that happens, every
// api/*.ts function that checks `isSupabaseConfigured()` falls back to mock
// data — the app keeps working with zero backend setup, same as the old
// `configureApi`/`apiFetch` pattern it replaces.
let client: SupabaseClient | null = null;

export function configureSupabase(url: string, anonKey: string): void {
  if (!url || !anonKey) return;
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function isSupabaseConfigured(): boolean {
  return client !== null;
}

export function getSupabase(): SupabaseClient {
  if (!client) throw new Error('Supabase is not configured — call configureSupabase() first.');
  return client;
}
