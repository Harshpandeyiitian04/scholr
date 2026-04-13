const QUOTED_VALUE_PATTERN = /^['"](.*)['"]$/;

type SupabaseEnvVar =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

function getRawEnv(name: SupabaseEnvVar): string | undefined {
  // Next.js only inlines public env values for direct property access in client bundles.
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return process.env.NEXT_PUBLIC_SUPABASE_URL;
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    case "SUPABASE_SERVICE_ROLE_KEY":
      return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
}

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

export function getSupabasePublicConfig() {
  return {
    url: readSupabaseUrl(),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}
