"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components.
 * Uses the anon key - RLS policies handle data access control.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rbabtwjkqqzsbshzsgvz.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYWJ0d2prcXF6c2JzaHpzZ3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODkwMTAsImV4cCI6MjEwMDc2NTAxMH0.gzMCy3Xww7-nNznrZSL6l91KApeJhFkIF3PoPNmfeIU";

  return createBrowserClient(url, key);
}
