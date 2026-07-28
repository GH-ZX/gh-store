"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
});

/**
 * Provides the authenticated user to all children.
 * Must be placed inside <QueryProvider> since useAuth uses TanStack Query.
 *
 * This is a lightweight initializer that sets up the auth listener.
 * For detailed auth operations (signIn, signUp, etc.), use the useAuth() hook.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

/**
 * Lightweight hook to get the current user and loading state.
 * For full auth operations (signIn, signUp, etc.), use the useAuth() hook.
 */
export function useCurrentUser(): AuthContextValue {
  return useContext(AuthContext);
}
