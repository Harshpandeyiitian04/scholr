const QUOTED_VALUE_PATTERN = /^['"](.*)['"]$/;

type SupabaseEnvVar =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

/** Returns the raw process.env value for the given Supabase environment variable using a switch to ensure Next.js inlines public values in client bundles. */
function getRawEnv(name: SupabaseEnvVar): string | undefined {
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return process.env.NEXT_PUBLIC_SUPABASE_URL;
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    case "SUPABASE_SERVICE_ROLE_KEY":
      return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
}

/** Reads a Supabase environment variable, validates it is non-empty, and strips any surrounding quotes. */
function readEnv(name: SupabaseEnvVar): string {
  const rawValue = getRawEnv(name);
  if (!rawValue) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error(`Environment variable is empty: ${name}`);
  }

  const quotedMatch = QUOTED_VALUE_PATTERN.exec(trimmed);
  return (quotedMatch?.[1] ?? trimmed).trim();
}

/** Reads NEXT_PUBLIC_SUPABASE_URL and validates it is a well-formed URL before returning it. */
function readSupabaseUrl(): string {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");

  try {
    new URL(url);
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a full URL like https://<project-ref>.supabase.co"
    );
  }

  return url;
}

/** Returns the validated public Supabase project URL and anon key needed to initialise a browser or server client. */
export function getSupabasePublicConfig() {
  return {
    url: readSupabaseUrl(),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

/** Returns the Supabase service role key used to create admin clients in API routes. */
export function getSupabaseServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}
