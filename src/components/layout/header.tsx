"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  Search,
  User,
  LayoutDashboard,
  LogIn,
  Wallet,
  ArrowRight,
  ChevronDown,
  Coins,
  CreditCard,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminProviderWallets } from "@/hooks/use-admin-wallets";
import { useAuth } from "@/hooks/use-auth";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCartItemCount, useCartStore } from "@/stores/cart-store";

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
    <header className="border-border/40 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:gap-4 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {isRtl ? item.labelAr : item.labelEn}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search (desktop) — form that navigates to store */}
        <form onSubmit={handleSearch} className="relative hidden items-center gap-1 lg:flex">
          <div className="relative w-48 xl:w-64">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={isRtl ? "بحث في المتجر..." : "Search store..."}
              className="bg-muted/50 focus:bg-background h-9 rounded-lg pr-2 pl-9 text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="border-input bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-all"
            aria-label={isRtl ? "بحث" : "Search"}
          >
            <ArrowRight className={cn("size-4", isRtl && "rotate-180")} />
          </button>
        </form>

        {/* Auth buttons (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {authLoading || !isAuthenticated ? (
            <a
              href={`/${locale}/auth/login`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all hover:shadow-md"
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
                    className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-sm font-medium transition-colors"
                  >
                    <Wallet className="size-4" />
                    <span className="hidden font-semibold lg:inline">
                      {balanceLoading ? "..." : `$${balance.toFixed(2)}`}
                    </span>
                    <ChevronDown className={cn("size-3", showAdminWallets && "rotate-180")} />
                  </button>

                  {showAdminWallets && (
                    <>
                      {/* Backdrop to close */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowAdminWallets(false)}
                      />
                      <div
                        className={cn(
                          "bg-card absolute top-full z-50 mt-1 w-72 rounded-xl border p-3 shadow-xl",
                          isRtl ? "left-0" : "right-0",
                        )}
                      >
                        <p className="text-muted-foreground mb-2 px-1 text-xs font-medium">
                          {isRtl ? "محافظ المزودين" : "Provider Wallets"}
                        </p>

                        {/* G2Bulk balance */}
                        <div className="mb-1 flex items-center gap-2 rounded-lg px-2 py-2">
                          <Coins className="text-primary size-4" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">G2Bulk</p>
                            <p className="text-muted-foreground text-xs">
                              {g2bulkLoading ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="bg-muted-foreground/30 size-1.5 animate-pulse rounded-full" />
                                  {isRtl ? "جاري التحميل..." : "Loading..."}
                                </span>
                              ) : g2bulk ? (
                                `@${g2bulk.username}`
                              ) : isRtl ? (
                                "غير متصل"
                              ) : (
                                "Disconnected"
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-bold">
                            {g2bulkLoading ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="bg-muted-foreground/30 size-1.5 animate-pulse rounded-full" />
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
                          <div className="space-y-2 px-2 py-2">
                            <div className="bg-muted/50 h-8 animate-pulse rounded-lg" />
                            <div className="bg-muted/50 h-8 animate-pulse rounded-lg" />
                          </div>
                        ) : samWallets.length > 0 ? (
                          samWallets.map((w) => (
                            <div
                              key={w.id}
                              className="flex items-center gap-2 rounded-lg px-2 py-2"
                            >
                              <CreditCard className="text-primary size-4" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium">{w.providerDisplayName}</p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {w.label || w.phone || w.walletAddress?.slice(0, 12)}
                                </p>
                              </div>
                              <div className="text-right">
                                {w.balances && w.balances.length > 0 ? (
                                  w.balances.slice(0, 2).map((b, i) => (
                                    <span
                                      key={b.currency || i}
                                      className="block text-xs font-semibold"
                                    >
                                      {b.currency === "SYP"
                                        ? `£S${Number(b.amount).toFixed(0)}`
                                        : `$${Number(b.amount).toFixed(2)}`}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs">---</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground px-2 py-1 text-xs">
                            {isRtl ? "لا توجد محافظ SAM" : "No SAM wallets"}
                          </p>
                        )}

                        {/* Link to full wallet */}
                        <Link
                          href={`/${locale}/wallet`}
                          className="bg-muted/50 hover:bg-muted mt-2 block rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors"
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
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors"
                >
                  <Wallet className="size-4" />
                  <span className="hidden font-semibold lg:inline">
                    {balanceLoading ? "..." : `$${balance.toFixed(2)}`}
                  </span>
                </Link>
              )}

              {/* Dashboard (admin only) */}
              {isAdmin && (
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors"
                >
                  <LayoutDashboard className="size-4" />
                  <span className="hidden lg:inline">{isRtl ? "لوحة التحكم" : "Dashboard"}</span>
                </Link>
              )}

              {/* Profile */}
              <Link
                href={`/${locale}/profile`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors"
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {profile?.full_name ? (
                      getInitials(profile.full_name)
                    ) : (
                      <User className="size-3.5" />
                    )}
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
          className="text-muted-foreground hover:bg-muted hover:text-foreground relative inline-flex size-8 items-center justify-center rounded-lg transition-colors"
        >
          <ShoppingCart className="size-5" />
          {cartCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-medium">
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
          <SheetTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors md:hidden">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side={isRtl ? "right" : "left"} className="w-72">
            <nav className="mt-8 flex flex-col gap-2">
              {/* Auth section */}
              {authLoading || !isAuthenticated ? (
                <a
                  href={`/${locale}/auth/login`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mx-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all hover:shadow-md"
                >
                  <LogIn className="size-4" />
                  {isRtl ? "تسجيل الدخول" : "Sign In"}
                </a>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-3 px-3 py-2">
                    <Avatar className="size-10">
                      <AvatarFallback>
                        {profile?.full_name ? (
                          getInitials(profile.full_name)
                        ) : (
                          <User className="size-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {profile?.full_name || (isRtl ? "مستخدم" : "User")}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {isAdmin ? (isRtl ? "مدير" : "Admin") : isRtl ? "عميل" : "Customer"}
                        </Badge>
                        <Link
                          href={`/${locale}/wallet`}
                          className="text-primary text-xs font-semibold hover:underline"
                        >
                          <Wallet className="mr-0.5 inline size-3" />${balance.toFixed(2)}
                        </Link>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Link
                      href={`/${locale}/dashboard`}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-start gap-2 rounded-lg px-3 text-base font-medium transition-colors"
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
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={isRtl ? "بحث في المتجر..." : "Search store..."}
                    className="bg-muted/50 h-10 w-full rounded-lg pl-9 text-sm"
                  />
                </form>
              </div>

              <Separator className="my-2" />

              {/* Nav items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium transition-colors"
                >
                  {isRtl ? item.labelAr : item.labelEn}
                </Link>
              ))}
              <Separator className="my-2" />
              <Link
                href={`/${locale}/orders`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium transition-colors"
              >
                {isRtl ? "طلباتي" : "My Orders"}
              </Link>
              <Link
                href={`/${locale}/wallet`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium transition-colors"
              >
                {isRtl ? "المحفظة" : "Wallet"}
              </Link>
              <Link
                href={`/${locale}/profile`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center justify-start rounded-lg px-3 text-base font-medium transition-colors"
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
