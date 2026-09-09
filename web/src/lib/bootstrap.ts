import { configureApi } from '@shared/api/client';
import { configureSupabase } from '@shared/lib/supabaseClient';

// Runs once when the module is first imported (see app/providers.tsx).
// With Supabase env vars unset, every shared API call falls back to mock
// data — the app works with zero backend setup.
configureSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
);

// Legacy path to the old NestJS REST backend, kept only for local dev against
// that server if you still run it. Unused once Supabase is configured above.
configureApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '' });
