import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isRemoteConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Credentials aren't set up yet during local development, so problemsRepo falls back to a
// localStorage-backed implementation whenever this is null instead of throwing.
export const supabase: SupabaseClient | null = isRemoteConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
