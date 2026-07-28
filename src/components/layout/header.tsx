"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart, Menu, Search, User, LayoutDashboard, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { APP_NAME } from "@/lib/constants";
import { getCartItemCount, useCartStore } from "@/stores/cart-store";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  labelAr: string;
  labelEn: string;
  href: string;
}

const navItems: NavItem[] = [
  { labelAr: "الرئيسية", labelEn: "Home", href: "" },
  { labelAr: "المتجر", labelEn: "Store", href: "/store" },
  { labelAr: "العروض", labelEn: "Sale", href: "/store?type=sale" },
  { labelAr: "كيف يعمل", labelEn: "How It Works", href: "/how-it-works" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Header() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const items = useCartStore((s) => s.items);
  const cartCount = getCartItemCount(items);
  const { isAuthenticated, isAdmin, profile, isLoading: authLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 lg:gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2 font-bold text-xl tracking-tight"
        >
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isRtl ? item.labelAr : item.labelEn}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search (desktop) */}
        <div className="relative hidden lg:block w-48 xl:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isRtl ? "بحث..." : "Search..."}
            className="h-9 rounded-lg bg-muted/50 pl-9 text-sm"
          />
        </div>

        {/* Auth buttons (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {authLoading ? null : isAuthenticated ? (
            <>
              {/* Dashboard (admin only) */}
              {isAdmin && (
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-1.5"
                >
                  <LayoutDashboard className="size-4" />
                  <span className="hidden lg:inline">{isRtl ? "لوحة التحكم" : "Dashboard"}</span>
                </Link>
              )}

              {/* Profile */}
              <Link
                href={`/${locale}/profile`}
                className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-1.5"
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {profile?.full_name ? getInitials(profile.full_name) : <User className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">
                  {profile?.full_name || (isRtl ? "حسابي" : "My Account")}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-1.5"
            >
              <LogIn className="size-4" />
              <span className="hidden lg:inline">{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
            </Link>
          )}
        </div>

        {/* Cart */}
        <Link
          href={`/${locale}/cart`}
          className="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ShoppingCart className="size-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        {/* Locale Switcher (desktop) */}
        <div className="hidden md:block">
          <LocaleSwitcher />
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger className="md:hidden inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side={isRtl ? "right" : "left"} className="w-72">
            <nav className="mt-8 flex flex-col gap-2">
              {/* Auth section */}
              {!authLoading && isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <Avatar className="size-10">
                      <AvatarFallback>
                        {profile?.full_name ? getInitials(profile.full_name) : <User className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || (isRtl ? "مستخدم" : "User")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isAdmin ? (isRtl ? "مدير" : "Admin") : (isRtl ? "عميل" : "Customer")}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Link
                      href={`/${locale}/dashboard`}
                      className="inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-2"
                    >
                      <LayoutDashboard className="size-4" />
                      {isRtl ? "لوحة التحكم" : "Dashboard"}
                    </Link>
                  )}
                </>
              ) : !authLoading ? (
                <Link
                  href={`/${locale}/auth/login`}
                  className="inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-2"
                >
                  <LogIn className="size-4" />
                  {isRtl ? "تسجيل الدخول" : "Sign In"}
                </Link>
              ) : null}

              <Separator className="my-2" />

              {/* Nav items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {isRtl ? item.labelAr : item.labelEn}
                </Link>
              ))}
              <Separator className="my-2" />
              <Link
                href={`/${locale}/orders`}
                className="inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {isRtl ? "طلباتي" : "My Orders"}
              </Link>
              <Link
                href={`/${locale}/wallet`}
                className="inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {isRtl ? "المحفظة" : "Wallet"}
              </Link>
              <Link
                href={`/${locale}/profile`}
                className="inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {isRtl ? "الملف الشخصي" : "Profile"}
              </Link>
              <Separator className="my-2" />
              <div className="px-3">
                <LocaleSwitcher />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
