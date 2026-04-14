import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

/** Creates and returns a Supabase browser client using the public URL and anon key. */
export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig();

  return createBrowserClient(url, anonKey);
}
