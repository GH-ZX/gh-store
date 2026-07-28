"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Menu, Search, User, LayoutDashboard, LogIn, Wallet, ArrowRight, ChevronDown, Coins, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { APP_NAME } from "@/lib/constants";
import { getCartItemCount, useCartStore } from "@/stores/cart-store";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useAdminProviderWallets } from "@/hooks/use-admin-wallets";

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
  const router = useRouter();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const items = useCartStore((s) => s.items);
  const cartCount = getCartItemCount(items);
  const { isAuthenticated, isAdmin, profile, isLoading: authLoading } = useAuth();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  const { g2bulk, samWallets, g2bulkLoading, samWalletsLoading } = useAdminProviderWallets();
  const [showAdminWallets, setShowAdminWallets] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      router.push(`/${locale}/store?q=${encodeURIComponent(q)}`);
      setSearchValue("");
      searchRef.current?.blur();
    }
  };

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

        {/* Search (desktop) — form that navigates to store */}
        <form onSubmit={handleSearch} className="relative hidden lg:flex items-center gap-1">
          <div className="relative w-48 xl:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={isRtl ? "بحث في المتجر..." : "Search store..."}
              className="h-9 rounded-lg bg-muted/50 pl-9 pr-2 text-sm focus:bg-background transition-all"
            />
          </div>
          <button
            type="submit"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            aria-label={isRtl ? "بحث" : "Search"}
          >
            <ArrowRight className={cn("size-4", isRtl && "rotate-180")} />
          </button>
        </form>

        {/* Auth buttons (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {authLoading || !isAuthenticated ? (
            <a
              href={`/${locale}/auth/login`}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md gap-1.5"
            >
              <LogIn className="size-4" />
              <span className="hidden lg:inline">{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
            </a>
          ) : (
            <>
              {/* Wallet Balance — dropdown for admin, simple link for users */}
              {isAdmin ? (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminWallets(!showAdminWallets)}
                    className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-1"
                  >
                    <Wallet className="size-4" />
                    <span className="hidden lg:inline font-semibold">
                      {balanceLoading ? "..." : `$${balance.toFixed(2)}`}
                    </span>
                    <ChevronDown className={cn("size-3", showAdminWallets && "rotate-180")} />
                  </button>

                  {showAdminWallets && (
                    <>
                      {/* Backdrop to close */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowAdminWallets(false)} />
                      <div className={cn(
                        "absolute top-full mt-1 z-50 w-72 rounded-xl border bg-card p-3 shadow-xl",
                        isRtl ? "left-0" : "right-0",
                      )}>
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                          {isRtl ? "محافظ المزودين" : "Provider Wallets"}
                        </p>

                        {/* G2Bulk balance */}
                        <div className="flex items-center gap-2 rounded-lg px-2 py-2 mb-1">
                          <Coins className="size-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">G2Bulk</p>
                            <p className="text-xs text-muted-foreground">
                              {g2bulkLoading ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="size-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                                  {isRtl ? "جاري التحميل..." : "Loading..."}
                                </span>
                              ) : g2bulk ? (
                                `@${g2bulk.username}`
                              ) : (
                                isRtl ? "غير متصل" : "Disconnected"
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-bold">
                            {g2bulkLoading ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                                ---
                              </span>
                            ) : g2bulk ? (
                              `$${Number(g2bulk.balance).toFixed(2)}`
                            ) : (
                              "---"
                            )}
                          </span>
                        </div>

                        {/* SAM API wallets */}
                        {samWalletsLoading ? (
                          <div className="px-2 py-2 space-y-2">
                            <div className="h-8 rounded-lg bg-muted/50 animate-pulse" />
                            <div className="h-8 rounded-lg bg-muted/50 animate-pulse" />
                          </div>
                        ) : samWallets.length > 0 ? (
                          samWallets.map((w) => (
                            <div key={w.id} className="flex items-center gap-2 rounded-lg px-2 py-2">
                              <CreditCard className="size-4 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{w.providerDisplayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{w.label || w.phone || w.walletAddress?.slice(0, 12)}</p>
                              </div>
                              <div className="text-right">
                                {w.balances && w.balances.length > 0 ? (
                                  w.balances.slice(0, 2).map((b, i) => (
                                    <span key={b.currency || i} className="text-xs font-semibold block">
                                      {b.currency === "SYP" ? `£S${Number(b.amount).toFixed(0)}` : `$${Number(b.amount).toFixed(2)}`}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">---</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground px-2 py-1">
                            {isRtl ? "لا توجد محافظ SAM" : "No SAM wallets"}
                          </p>
                        )}

                        {/* Link to full wallet */}
                        <Link
                          href={`/${locale}/wallet`}
                          className="mt-2 block rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium text-center hover:bg-muted transition-colors"
                          onClick={() => setShowAdminWallets(false)}
                        >
                          {isRtl ? "عرض المحفظة كاملة" : "View Full Wallet"} →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href={`/${locale}/wallet`}
                  className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground gap-1.5"
                >
                  <Wallet className="size-4" />
                  <span className="hidden lg:inline font-semibold">
                    {balanceLoading ? "..." : `$${balance.toFixed(2)}`}
                  </span>
                </Link>
              )}

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
              {authLoading || !isAuthenticated ? (
                <a
                  href={`/${locale}/auth/login`}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md gap-2 mx-3"
                >
                  <LogIn className="size-4" />
                  {isRtl ? "تسجيل الدخول" : "Sign In"}
                </a>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <Avatar className="size-10">
                      <AvatarFallback>
                        {profile?.full_name ? getInitials(profile.full_name) : <User className="size-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || (isRtl ? "مستخدم" : "User")}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {isAdmin ? (isRtl ? "مدير" : "Admin") : (isRtl ? "عميل" : "Customer")}
                        </Badge>
                        <Link href={`/${locale}/wallet`} className="text-xs font-semibold text-primary hover:underline">
                          <Wallet className="size-3 inline mr-0.5" />${balance.toFixed(2)}
                        </Link>
                      </div>
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
              )}

              {/* Mobile search */}
              <div className="px-3 py-1">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={isRtl ? "بحث في المتجر..." : "Search store..."}
                    className="h-10 rounded-lg bg-muted/50 pl-9 text-sm w-full"
                  />
                </form>
              </div>

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
