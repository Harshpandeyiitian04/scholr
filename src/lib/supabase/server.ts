import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

/** Creates and returns a Supabase server client that reads and writes session cookies from the Next.js request context. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicConfig();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        /** Returns all cookies from the current request. */
        getAll() {
          return cookieStore.getAll();
        },
        /** Persists one or more cookies onto the response; silently ignored inside Server Components. */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component — cookie setting handled by middleware
          }
        },
      },
    }
  );
}
