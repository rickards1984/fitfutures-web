import { createClient } from "@supabase/supabase-js";

// Single browser Supabase client. Uses the public anon key (RLS enforces
// access); the service key never reaches the frontend. `detectSessionInUrl`
// lets the magic-link callback complete the session from the URL hash.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// Dev-only: expose the client so you can grab your access token / user id from
// the browser console while testing the API (e.g. creating a placement).
if (import.meta.env.DEV) {
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}
