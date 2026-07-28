import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/constants";

/**
 * Restrict `next` to a same-origin path.
 *
 * A bare `startsWith("/")` check is not enough: `//evil.com` and `/\evil.com`
 * both start with a slash but resolve to a different origin when passed to
 * `new URL(next, origin)`, turning this route into an open redirect.
 */
function sanitizeNext(raw: string | null, locale: string): string {
  const fallback = `/${locale}`;
  if (!raw) return fallback;

  // Must be a single leading slash not followed by another slash or backslash.
  if (!/^\/(?![/\\])/.test(raw)) return fallback;

  // Reject anything that still parses as an absolute URL (e.g. "/\/evil.com").
  try {
    if (new URL(raw, "http://localhost").origin !== "http://localhost") return fallback;
  } catch {
    return fallback;
  }

  return raw;
}

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
  const next = sanitizeNext(searchParams.get("next"), locale);

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
            cookiesToSet.forEach(({ name, value }) =>
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
