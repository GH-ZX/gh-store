import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/constants";

/**
 * Middleware handles:
 * 1. Authentication check for protected routes
 * 2. Locale detection/redirect
 * 3. Admin route protection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Locale handling ---
  const pathLocale = SUPPORTED_LOCALES.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathLocale) {
    // Redirect to default locale
    const newUrl = new URL(`/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // --- Create Supabase SSR client ---
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // --- Auth check ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute =
    pathname.includes("/dashboard") ||
    pathname.includes("/orders") ||
    pathname.includes("/wallet") ||
    pathname.includes("/checkout") ||
    pathname.includes("/profile");

  // Allow callback route always (needed for OAuth code exchange)
  if (pathname.includes("/auth/callback")) {
    return supabaseResponse;
  }

  const isAdminRoute = pathname.includes("/dashboard");

  if (isProtectedRoute && !user) {
    const loginUrl = new URL(`/${pathLocale}/auth/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL(`/${pathLocale}`, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};
