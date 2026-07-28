import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/constants";

/**
 * Auth callback Route Handler.
 * Supabase redirects here after:
 * - Email confirmation (sign up)
 * - Password reset
 * - OAuth sign in (Google, etc.)
 *
 * Exchanges the auth code for a session and redirects the user.
 * This runs on the server (no page needed), so it can set cookies properly.
 */
export async function GET(request: NextRequest) {
  const { searchParams, pathname, origin } = request.nextUrl;

  // Extract locale from the URL path (e.g. /ar/auth/callback → "ar")
  const pathSegment = pathname.split("/")[1];
  const locale = SUPPORTED_LOCALES.includes(pathSegment as typeof SUPPORTED_LOCALES[number])
    ? pathSegment
    : DEFAULT_LOCALE;

  // Get the auth code and next redirect from the URL
  const code = searchParams.get("code");
  let next = searchParams.get("next") || `/${locale}`;

  // Ensure `next` is absolute or at least starts with /
  if (!next.startsWith("/")) {
    next = `/${locale}/${next}`;
  }

  if (code) {
    // Create a response to set cookies
    let response = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.redirect(new URL(next, origin));
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error.message);
      // Redirect to login with error
      const errorUrl = new URL(`/${locale}/auth/login`, origin);
      errorUrl.searchParams.set("error", "Session exchange failed. Please try signing in again.");
      return NextResponse.redirect(errorUrl);
    }

    return response;
  }

  // No code found — redirect to login
  return NextResponse.redirect(
    new URL(`/${locale}/auth/login`, origin),
  );
}
