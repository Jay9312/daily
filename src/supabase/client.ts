import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://buekfilaoxnaoulfngli.supabase.co";
const fallbackPublishableKey = "sb_publishable_EzDYctslxym1aCBMaPLX4Q_lVnGFFMW";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? fallbackUrl;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? fallbackPublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
