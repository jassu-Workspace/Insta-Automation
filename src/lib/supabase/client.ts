import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_anon_key";

  if (typeof window === "undefined") {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
