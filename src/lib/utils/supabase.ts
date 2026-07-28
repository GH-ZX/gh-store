import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Server Components and Route Handlers.
 * Uses the @supabase/ssr package for proper cookie-based auth in Next.js 16.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rbabtwjkqqzsbshzsgvz.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYWJ0d2prcXF6c2JzaHpzZ3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODkwMTAsImV4cCI6MjEwMDc2NTAxMH0.gzMCy3Xww7-nNznrZSL6l91KApeJhFkIF3PoPNmfeIU";

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

/**
 * Creates a Supabase client with the service-role key for admin operations.
 * WARNING: Only use in server-side code. Never expose this key to the client.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rbabtwjkqqzsbshzsgvz.supabase.co";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYWJ0d2prcXF6c2JzaHpzZ3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE4OTAxMCwiZXhwIjoyMTAwNzY1MDEwfQ.elDzI48nap2SfAuTRNyXeCgxWLBPtQ0fPodhzxBvlz4";

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
